import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { createSeedState } from "./seed";
import { normalizePlayers } from "./players";
import type { AuctionState } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "auction.json");
const REDIS_KEY = "alpha-auction:state";

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const g = globalThis as unknown as {
  __auctionLock?: Promise<void>;
  __auctionMem?: AuctionState;
};

function lock(): Promise<() => void> {
  let release!: () => void;
  const ready = new Promise<void>((r) => {
    release = r;
  });
  const prev = g.__auctionLock ?? Promise.resolve();
  g.__auctionLock = prev.then(() => ready);
  return prev.then(() => release);
}

async function readFileState(): Promise<AuctionState> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(raw) as AuctionState;
  } catch {
    const state = createSeedState();
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2));
    return state;
  }
}

async function writeFileState(state: AuctionState): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2));
}

export async function readState(): Promise<AuctionState> {
  const redis = redisClient();
  let state: AuctionState;
  if (redis) {
    const stored = await redis.get<AuctionState>(REDIS_KEY);
    if (stored) state = stored;
    else {
      state = createSeedState();
      await redis.set(REDIS_KEY, state);
    }
  } else if (process.env.VERCEL) {
    if (!g.__auctionMem) g.__auctionMem = createSeedState();
    state = structuredClone(g.__auctionMem);
  } else {
    state = await readFileState();
  }
  if (!state.auction.draw) state.auction.draw = null;
  return normalizePlayers(state);
}

export async function writeState(state: AuctionState): Promise<void> {
  const redis = redisClient();
  if (redis) {
    await redis.set(REDIS_KEY, state);
    return;
  }

  if (process.env.VERCEL) {
    g.__auctionMem = state;
    return;
  }

  await writeFileState(state);
}

export async function updateState(
  updater: (state: AuctionState) => AuctionState | string
): Promise<AuctionState> {
  const release = await lock();
  try {
    const current = await readState();
    const next = updater(structuredClone(current));
    if (typeof next === "string") throw new Error(next);
    await writeState(next);
    return next;
  } finally {
    release();
  }
}

export async function resetState(): Promise<AuctionState> {
  const state = createSeedState();
  await writeState(state);
  return state;
}
