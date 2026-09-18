"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LiveLot, PurseBar, teamSquad } from "@/components/AuctionUI";
import { PageHeader } from "@/components/Brand";
import { BID_INCREMENT } from "@/lib/constants";
import { clearSession, loadSession, useAuctionState } from "@/lib/hooks";
import { maxBidForTeam, minNextBid } from "@/lib/rules";

export default function CaptainPage() {
  const { state, error, loading, mutate, setError } = useAuctionState();
  const [userId, setUserId] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const router = useRouter();

  useEffect(() => {
    const s = loadSession();
    if (!s || s.role !== "CAPTAIN") {
      router.replace("/");
      return;
    }
    setUserId(s.userId);
  }, [router]);

  const user = state?.users.find((u) => u.id === userId);
  const team = state?.teams.find((t) => t.id === user?.teamId);

  const canBid =
    state &&
    team &&
    (state.auction.status === "BIDDING" ||
      state.auction.status === "PLAYER_UP") &&
    state.auction.currentPlayerId &&
    state.auction.currentBidTeamId !== team.id;

  const min = state ? minNextBid(state) : 50;
  const max = team ? maxBidForTeam(team) : 0;

  const squad = useMemo(() => {
    if (!state || !team) return [];
    return teamSquad(state, team.id);
  }, [state, team]);

  async function bid(amount: number) {
    if (!userId || !team) return;
    await mutate({
      action: "placeBid",
      userId,
      teamId: team.id,
      amount,
    });
  }

  async function quick() {
    if (!userId || !team) return;
    await mutate({ action: "quickBid", userId, teamId: team.id });
  }

  if (loading || !state || !userId || !team) {
    return <main className="p-8 text-muted">Loading captain desk…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
      <PageHeader
        title={team.name}
        subtitle={`Captain ${team.captainName}`}
        actions={
          <>
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

      <LiveLot state={state} />
      <div className="panel">
        <PurseBar team={team} />
      </div>

      <section className="panel space-y-4">
        <h2 className="font-display text-2xl text-gold">Bid pad</h2>
        <p className="text-sm text-muted">
          Min ₹{min} · Max ₹{max} · Step ₹{BID_INCREMENT}
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={!canBid} onClick={quick}>
            Bid ₹{min}
          </button>
          <button
            className="btn-secondary"
            disabled={!canBid || min + BID_INCREMENT > max}
            onClick={() => bid(min + BID_INCREMENT)}
          >
            Bid ₹{min + BID_INCREMENT}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            className="input"
            type="number"
            step={BID_INCREMENT}
            min={min}
            max={max}
            placeholder={`Custom (≥ ${min})`}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button
            className="btn-danger"
            disabled={!canBid || !custom}
            onClick={() => bid(Number(custom))}
          >
            Place
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="font-display text-2xl text-gold">Your squad</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {squad.map((p) => (
            <li
              key={p.id}
              className="flex justify-between rounded-lg border border-[rgba(245,197,24,0.12)] bg-black/40 px-3 py-2"
            >
              <span>
                {p.name}
                {p.isCaptain ? " (C)" : ""}
              </span>
              <span className="text-gold">₹{p.soldPrice ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
