"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LiveLot, PlayerProfile, PurseBar, teamName } from "@/components/AuctionUI";
import { PageHeader } from "@/components/Brand";
import { DrawScreen } from "@/components/DrawScreen";
import {
  SoldCelebration,
  useSoldCelebration,
} from "@/components/SoldCelebration";
import { EQUAL_BID_AMOUNT } from "@/lib/constants";
import { useAuctionState } from "@/lib/hooks";
import { teamsWithEqualBid } from "@/lib/rules";

export default function BoardPage() {
  const { state, loading } = useAuctionState();
  const { burst, soldPlayer } = useSoldCelebration(state);

  const sold = useMemo(
    () =>
      state?.players.filter((p) => !p.isCaptain && p.status === "SOLD") ?? [],
    [state]
  );

  const equalContenders = useMemo(() => {
    if (
      !state?.auction.currentPlayerId ||
      state.auction.currentBid !== EQUAL_BID_AMOUNT
    ) {
      return [] as string[];
    }
    return teamsWithEqualBid(state, state.auction.currentPlayerId);
  }, [state]);

  const leadingTeamId = state?.auction.currentBidTeamId ?? null;

  const liveBids = useMemo(() => {
    if (!state?.auction.currentPlayerId) return [];
    return state.bids
      .filter((b) => b.playerId === state.auction.currentPlayerId)
      .slice(-6)
      .reverse();
  }, [state]);

  const highBid = state?.auction.currentBid ?? null;

  if (loading || !state) {
    return <main className="p-8 text-muted">Loading board…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <SoldCelebration state={state} burst={burst} soldPlayer={soldPlayer} />
      <PageHeader
        title="Auction Board"
        actions={
          <>
            <Link href="/summary" className="btn-secondary">
              Summary
            </Link>
            <Link href="/" className="btn-secondary">
              Home
            </Link>
          </>
        }
      />

      {state.auction.status === "DRAW" ? (
        <DrawScreen
          state={state}
          isAdmin={false}
          myTeamId={null}
          onAssignPicker={() => undefined}
          onReveal={() => undefined}
        />
      ) : (
        <LiveLot state={state} emphasizeBid />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {state.teams.map((t) => (
          <div key={t.id} className="panel" style={{ padding: "0.5rem" }}>
            <PurseBar
              team={t}
              leading={
                equalContenders.length > 1
                  ? equalContenders.includes(t.id)
                  : t.id === leadingTeamId
              }
            />
          </div>
        ))}
      </div>

      <section className="panel">
        <h2 className="font-display text-2xl text-gold">Live bids</h2>
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
                    ? "bid-pulse rounded-lg border border-[rgba(245,197,24,0.65)] bg-[rgba(245,197,24,0.12)] px-3 py-2 text-lg font-extrabold uppercase tracking-wide text-gold"
                    : "px-1 text-muted"
                }
              >
                ₹{b.amount} — {teamName(state, b.teamId)}
              </li>
            );
          })}
          {liveBids.length === 0 && (
            <li className="text-muted">Waiting for bids…</li>
          )}
        </ul>
      </section>

      <section className="panel">
        <h2 className="font-display text-2xl text-gold">Sold players</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sold.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-[rgba(245,197,24,0.12)] bg-black/40 px-3 py-2 text-sm"
            >
              <PlayerProfile player={p} compact />
              <div className="mt-1 text-muted">
                {teamName(state, p.teamId)} ·{" "}
                <span className="text-gold">₹{p.soldPrice}</span>
              </div>
            </div>
          ))}
          {sold.length === 0 && <p className="text-muted">No sales yet</p>}
        </div>
      </section>
    </main>
  );
}
