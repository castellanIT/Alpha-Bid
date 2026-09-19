"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LiveLot, PlayerProfile, PurseBar, teamName } from "@/components/AuctionUI";
import { PageHeader } from "@/components/Brand";
import { DrawScreen } from "@/components/DrawScreen";
import {
  SoldCelebration,
  useSoldCelebration,
} from "@/components/SoldCelebration";
import { EQUAL_BID_AMOUNT } from "@/lib/constants";
import { clearSession, loadSession, useAuctionState } from "@/lib/hooks";
import { teamsWithEqualBid } from "@/lib/rules";
import type { PlayerHand, PlayingRole, SkillLevel } from "@/lib/types";

export default function AdminPage() {
  const { state, error, loading, mutate, setError } = useAuctionState();
  const { burst, soldPlayer } = useSoldCelebration(state);
  const [userId, setUserId] = useState<string | null>(null);
  const [queueSearch, setQueueSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | PlayingRole>("ALL");
  const [handFilter, setHandFilter] = useState<"ALL" | PlayerHand>("ALL");
  const [skillFilter, setSkillFilter] = useState<"ALL" | SkillLevel>("ALL");
  const router = useRouter();

  useEffect(() => {
    const s = loadSession();
    if (!s || s.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    setUserId(s.userId);
  }, [router]);

  const queue = useMemo(() => {
    if (!state) return [];
    const q = queueSearch.trim().toLowerCase();
    return state.players
      .filter(
        (p) => !p.isCaptain && (p.status === "AVAILABLE" || p.status === "UNSOLD")
      )
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .filter((p) => (roleFilter === "ALL" ? true : p.playingRole === roleFilter))
      .filter((p) => (handFilter === "ALL" ? true : p.hand === handFilter))
      .filter((p) => (skillFilter === "ALL" ? true : p.skillLevel === skillFilter))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state, queueSearch, roleFilter, handFilter, skillFilter]);

  const queueTotal = useMemo(
    () =>
      state?.players.filter(
        (p) => !p.isCaptain && (p.status === "AVAILABLE" || p.status === "UNSOLD")
      ).length ?? 0,
    [state]
  );

  const liveBids = useMemo(() => {
    if (!state?.auction.currentPlayerId) return [];
    return state.bids
      .filter((b) => b.playerId === state.auction.currentPlayerId)
      .slice(-8)
      .reverse();
  }, [state]);

  const leadingTeamId = state?.auction.currentBidTeamId ?? null;
  const highBid = state?.auction.currentBid ?? null;
  const equalContenders = useMemo(() => {
    if (!state?.auction.currentPlayerId || highBid !== EQUAL_BID_AMOUNT) {
      return [] as string[];
    }
    return teamsWithEqualBid(state, state.auction.currentPlayerId);
  }, [state, highBid]);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    if (!userId) return;
    await mutate({ action, userId, ...extra });
  }

  if (loading || !state || !userId) {
    return <main className="p-8 text-muted">Loading admin…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <SoldCelebration state={state} burst={burst} soldPlayer={soldPlayer} />
      <PageHeader
        title="Admin Control"
        subtitle={state.auction.name}
        actions={
          <>
            <Link href="/admin/players" className="btn-secondary">
              Players
            </Link>
            <Link href="/board" className="btn-secondary">
              Board
            </Link>
            <Link href="/summary" className="btn-secondary">
              Summary
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

      {state.auction.status === "DRAW" ? (
        <DrawScreen
          state={state}
          isAdmin={true}
          myTeamId={null}
          onAssignPicker={(pickerTeamId) =>
            act("assignDrawPicker", { pickerTeamId })
          }
          onReveal={(cardIndex) => act("revealDrawCard", { cardIndex })}
        />
      ) : (
        <LiveLot state={state} emphasizeBid showSkill />
      )}

      {equalContenders.length > 1 && state.auction.status === "BIDDING" && (
        <p className="rounded-xl border border-[rgba(245,197,24,0.35)] bg-[rgba(245,197,24,0.08)] px-4 py-3 text-sm text-gold">
          ₹500 tied by {equalContenders.length} teams — press{" "}
          <strong>Sold</strong> to open the scratch-card draw.
        </p>
      )}

      {state.auction.status !== "DRAW" && (
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => act("start")}>
          Start
        </button>
        <button className="btn-primary" onClick={() => act("putPlayerUp")}>
          Next player
        </button>
        <button className="btn-danger" onClick={() => act("markSold")}>
          Sold
        </button>
        <button className="btn-secondary" onClick={() => act("markUnsold")}>
          Unsold
        </button>
        <button className="btn-secondary" onClick={() => act("pause")}>
          Pause
        </button>
        <button className="btn-secondary" onClick={() => act("resume")}>
          Resume
        </button>
        <button className="btn-secondary" onClick={() => act("end")}>
          End
        </button>
        <button className="btn-secondary" onClick={() => act("reset")}>
          Reset seed
        </button>
      </div>
      )}

      {state.auction.status === "DRAW" && (
        <div className="panel border-[rgba(245,197,24,0.45)] text-center">
          <p className="font-display text-2xl text-gold">Draw in progress</p>
          <p className="mt-1 text-sm text-muted">
            Assign a non-₹500 team in the popup, then scratch (or let that
            captain scratch).
          </p>
          <button
            className="btn-secondary mt-4"
            onClick={() => act("markUnsold")}
          >
            Cancel lot (unsold)
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <h2 className="font-display text-2xl text-gold">Purses</h2>
          <div className="mt-4 space-y-3">
            {state.teams.map((t) => (
              <PurseBar
                key={t.id}
                team={t}
                leading={
                  equalContenders.length > 1
                    ? equalContenders.includes(t.id)
                    : t.id === leadingTeamId
                }
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <h2 className="font-display text-2xl text-gold">
            Queue ({queue.length}
            {queue.length !== queueTotal ? ` / ${queueTotal}` : ""})
          </h2>
          <p className="mt-1 text-xs text-muted">
            Admin search & filters · Skill is admin-only
          </p>

          <input
            className="input mt-3"
            placeholder="Search player name…"
            value={queueSearch}
            onChange={(e) => setQueueSearch(e.target.value)}
          />

          <div className="mt-3 space-y-2">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                Role
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["ALL", "All"],
                    ["BAT", "Batter"],
                    ["BOWL", "Bowler"],
                    ["ALL_ROUNDER", "All-rounder"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={roleFilter === value ? "btn-primary" : "btn-secondary"}
                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}
                    onClick={() => setRoleFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                Hand
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["ALL", "All"],
                    ["LEFT", "Left"],
                    ["RIGHT", "Right"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={handFilter === value ? "btn-primary" : "btn-secondary"}
                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}
                    onClick={() => setHandFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                Skill
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["ALL", "All"],
                    ["ADVANCED", "Advanced"],
                    ["INTERMEDIATE", "Intermediate"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={skillFilter === value ? "btn-primary" : "btn-secondary"}
                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}
                    onClick={() => setSkillFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ul className="mt-3 max-h-[28rem] space-y-3 overflow-y-auto text-sm">
            {queue.map((p) => (
              <li
                key={p.id}
                className="space-y-2 rounded-lg border border-[rgba(245,197,24,0.12)] bg-black/40 px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <PlayerProfile player={p} showSkill compact />
                  <button
                    className="btn-secondary"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                    onClick={() => act("putPlayerUp", { playerId: p.id })}
                  >
                    Put up
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="input"
                    style={{ width: "auto" }}
                    value={p.playingRole ?? ""}
                    onChange={(e) =>
                      act("updatePlayerProfile", {
                        playerId: p.id,
                        playingRole: (e.target.value || null) as PlayingRole | null,
                        skillLevel: p.skillLevel,
                        hand: p.hand,
                      })
                    }
                  >
                    <option value="">Role</option>
                    <option value="BAT">Batter</option>
                    <option value="BOWL">Bowler</option>
                    <option value="ALL_ROUNDER">All-rounder</option>
                  </select>
                  <select
                    className="input"
                    style={{ width: "auto" }}
                    value={p.hand ?? ""}
                    onChange={(e) =>
                      act("updatePlayerProfile", {
                        playerId: p.id,
                        playingRole: p.playingRole,
                        skillLevel: p.skillLevel,
                        hand: (e.target.value || null) as PlayerHand | null,
                      })
                    }
                  >
                    <option value="">Hand</option>
                    <option value="RIGHT">Right</option>
                    <option value="LEFT">Left</option>
                  </select>
                  <select
                    className="input"
                    style={{ width: "auto" }}
                    value={p.skillLevel ?? ""}
                    onChange={(e) =>
                      act("updatePlayerProfile", {
                        playerId: p.id,
                        playingRole: p.playingRole,
                        skillLevel: (e.target.value || null) as SkillLevel | null,
                        hand: p.hand,
                      })
                    }
                  >
                    <option value="">Skill (admin)</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                  </select>
                </div>
              </li>
            ))}
            {queue.length === 0 && (
              <li className="text-muted">No players match search/filters</li>
            )}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2 className="font-display text-2xl text-gold">Recent bids</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {liveBids.map((b, i) => {
            const isLead =
              highBid === EQUAL_BID_AMOUNT
                ? b.amount === EQUAL_BID_AMOUNT
                : i === 0 && b.amount === highBid;
            return (
              <li
                key={b.id}
                className={
                  isLead
                    ? "bid-pulse rounded-lg border border-[rgba(245,197,24,0.65)] bg-[rgba(245,197,24,0.12)] px-3 py-2 text-base font-extrabold uppercase tracking-wide text-gold"
                    : "px-1 text-muted"
                }
              >
                <span className="text-gold">₹{b.amount}</span>
                {" — "}
                {teamName(state, b.teamId)}
              </li>
            );
          })}
          {liveBids.length === 0 && (
            <li className="text-muted">No bids on current lot</li>
          )}
        </ul>
      </section>
    </main>
  );
}
