"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PlayerProfile } from "@/components/AuctionUI";
import { PageHeader } from "@/components/Brand";
import { BASE_PRICE } from "@/lib/constants";
import { clearSession, loadSession, useAuctionState } from "@/lib/hooks";
import type { PlayerHand, PlayingRole, SkillLevel } from "@/lib/types";

type Filter = "ALL" | "AVAILABLE" | "LIVE" | "SOLD" | "UNSOLD" | "CAPTAIN";

export default function AdminPlayersPage() {
  const { state, error, loading, mutate, setError } = useAuctionState();
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [playingRole, setPlayingRole] = useState<PlayingRole>("BAT");
  const [hand, setHand] = useState<PlayerHand>("RIGHT");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("INTERMEDIATE");
  const [basePrice, setBasePrice] = useState(String(BASE_PRICE));
  const router = useRouter();

  useEffect(() => {
    const s = loadSession();
    if (!s || s.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    setUserId(s.userId);
  }, [router]);

  const players = useMemo(() => {
    if (!state) return [];
    let list = [...state.players];
    if (filter === "CAPTAIN") list = list.filter((p) => p.isCaptain);
    else if (filter !== "ALL") {
      list = list.filter((p) => !p.isCaptain && p.status === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [state, filter, query]);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    if (!userId) return;
    await mutate({ action, userId, ...extra });
  }

  async function onAdd() {
    const res = await mutate({
      action: "addPlayer",
      userId,
      name,
      playingRole,
      hand,
      skillLevel,
      basePrice: Number(basePrice) || BASE_PRICE,
    });
    if (res) {
      setName("");
      setPlayingRole("BAT");
      setHand("RIGHT");
      setSkillLevel("INTERMEDIATE");
      setBasePrice(String(BASE_PRICE));
    }
  }

  if (loading || !state || !userId) {
    return <main className="p-8 text-muted">Loading players…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <PageHeader
        title="All Players"
        subtitle={`${state.players.length} in pool`}
        actions={
          <>
            <Link href="/admin" className="btn-secondary">
              Auction
            </Link>
            <Link href="/board" className="btn-secondary">
              Board
            </Link>
            <button
              className="btn-secondary"
              onClick={() => {
                clearSession();
                router.push("/");
              }}
            >
              Logout
            </button>
          </>
        }
      />

      {error && (
        <div className="rounded-xl border border-[rgba(245,197,24,0.4)] bg-[rgba(225,6,0,0.12)] px-4 py-3 text-gold">
          {error}
          <button className="ml-3 underline" onClick={() => setError(null)}>
            dismiss
          </button>
        </div>
      )}

      <section className="panel space-y-4">
        <h2 className="font-display text-2xl text-gold">Add player</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <input
            className="input"
            placeholder="Player name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="input"
            value={playingRole}
            onChange={(e) => setPlayingRole(e.target.value as PlayingRole)}
          >
            <option value="BAT">Batter</option>
            <option value="BOWL">Bowler</option>
            <option value="ALL_ROUNDER">All-rounder</option>
          </select>
          <select
            className="input"
            value={hand}
            onChange={(e) => setHand(e.target.value as PlayerHand)}
          >
            <option value="RIGHT">Right</option>
            <option value="LEFT">Left</option>
          </select>
          <select
            className="input"
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
          >
            <option value="ADVANCED">Advanced</option>
            <option value="INTERMEDIATE">Intermediate</option>
          </select>
          <input
            className="input"
            type="number"
            min={BASE_PRICE}
            step={25}
            placeholder="Base price"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
          />
          <button className="btn-primary" onClick={onAdd} disabled={!name.trim()}>
            Add to pool
          </button>
        </div>
      </section>

      <section className="panel space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl text-gold">
            Player list ({players.length})
          </h2>
          <input
            className="input max-w-xs"
            placeholder="Search name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "ALL",
              "AVAILABLE",
              "LIVE",
              "SOLD",
              "UNSOLD",
              "CAPTAIN",
            ] as Filter[]
          ).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? "btn-primary" : "btn-secondary"}
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {players.map((p) => (
            <li
              key={p.id}
              className="space-y-3 rounded-xl border border-[rgba(245,197,24,0.15)] bg-black/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <PlayerProfile player={p} showSkill compact />
                <span className="text-xs font-bold uppercase tracking-wide text-muted">
                  {p.isCaptain ? "Captain" : p.status} · ₹{p.basePrice}
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
                <input
                  className="input"
                  defaultValue={p.name}
                  key={`${p.id}-name-${p.name}`}
                  onBlur={(e) => {
                    if (e.target.value.trim() !== p.name) {
                      void act("updatePlayerProfile", {
                        playerId: p.id,
                        name: e.target.value,
                        playingRole: p.playingRole,
                        skillLevel: p.skillLevel,
                        hand: p.hand,
                        basePrice: p.basePrice,
                      });
                    }
                  }}
                />
                <select
                  className="input"
                  value={p.playingRole ?? ""}
                  onChange={(e) =>
                    act("updatePlayerProfile", {
                      playerId: p.id,
                      playingRole: (e.target.value || null) as PlayingRole | null,
                      skillLevel: p.skillLevel,
                      hand: p.hand,
                      basePrice: p.basePrice,
                    })
                  }
                >
                  <option value="BAT">Batter</option>
                  <option value="BOWL">Bowler</option>
                  <option value="ALL_ROUNDER">All-rounder</option>
                </select>
                <select
                  className="input"
                  value={p.hand ?? ""}
                  onChange={(e) =>
                    act("updatePlayerProfile", {
                      playerId: p.id,
                      playingRole: p.playingRole,
                      skillLevel: p.skillLevel,
                      hand: (e.target.value || null) as PlayerHand | null,
                      basePrice: p.basePrice,
                    })
                  }
                >
                  <option value="RIGHT">Right</option>
                  <option value="LEFT">Left</option>
                </select>
                <select
                  className="input"
                  value={p.skillLevel ?? ""}
                  onChange={(e) =>
                    act("updatePlayerProfile", {
                      playerId: p.id,
                      playingRole: p.playingRole,
                      skillLevel: (e.target.value || null) as SkillLevel | null,
                      hand: p.hand,
                      basePrice: p.basePrice,
                    })
                  }
                >
                  <option value="ADVANCED">Advanced</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                </select>
                {!p.isCaptain && p.status === "AVAILABLE" && (
                  <button
                    className="btn-secondary"
                    onClick={() => act("putPlayerUp", { playerId: p.id })}
                  >
                    Put up
                  </button>
                )}
              </div>
              {!p.isCaptain &&
                (p.status === "AVAILABLE" ||
                  p.status === "UNSOLD" ||
                  p.status === "SOLD") && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gold">
                      Make captain of
                    </span>
                    <select
                      className="input"
                      style={{ width: "auto" }}
                      defaultValue=""
                      onChange={(e) => {
                        const teamId = e.target.value;
                        if (!teamId) return;
                        void act("assignCaptain", {
                          playerId: p.id,
                          teamId,
                        });
                        e.target.value = "";
                      }}
                    >
                      <option value="">Select team</option>
                      {state.teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {p.teamId === t.id ? " (current)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
            </li>
          ))}
          {players.length === 0 && (
            <li className="text-muted">No players match this filter</li>
          )}
        </ul>
      </section>
    </main>
  );
}
