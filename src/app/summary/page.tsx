"use client";

import Link from "next/link";
import { useMemo } from "react";
import { teamSquad } from "@/components/AuctionUI";
import { PageHeader } from "@/components/Brand";
import { useAuctionState } from "@/lib/hooks";

export default function SummaryPage() {
  const { state, loading } = useAuctionState();

  const rows = useMemo(() => {
    if (!state) return [];
    return state.teams.map((team) => {
      const squad = teamSquad(state, team.id);
      const spent = team.purseTotal - team.purseRemaining;
      return { team, squad, spent };
    });
  }, [state]);

  if (loading || !state) {
    return <main className="p-8 text-muted">Loading summary…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <PageHeader
        title="Squad Summary"
        subtitle={`Status: ${state.auction.status}`}
        actions={
          <>
            <Link href="/board" className="btn-secondary">
              Board
            </Link>
            <Link href="/" className="btn-secondary">
              Home
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map(({ team, squad, spent }) => (
          <section key={team.id} className="panel">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-3xl text-white">{team.name}</h2>
                <p className="text-sm text-muted">C: {team.captainName}</p>
              </div>
              <div className="text-right text-sm">
                <div className="text-crimson">Spent ₹{spent}</div>
                <div className="text-gold">Left ₹{team.purseRemaining}</div>
                <div className="text-muted">{team.squadCount}/7 players</div>
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-sm">
              {squad.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between border-b border-[rgba(245,197,24,0.1)] py-1.5"
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
        ))}
      </div>
    </main>
  );
}
