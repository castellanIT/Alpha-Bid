import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { createSeedState } from "./seed";
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
  if (redis) {
    const state = await redis.get<AuctionState>(REDIS_KEY);
    if (state) return state;
    const seeded = createSeedState();
    await redis.set(REDIS_KEY, seeded);
    return seeded;
  }

  if (process.env.VERCEL) {
    if (!g.__auctionMem) g.__auctionMem = createSeedState();
    return structuredClone(g.__auctionMem);
  }

  return readFileState();
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
