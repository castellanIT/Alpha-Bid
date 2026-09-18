"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LiveLot, PurseBar, teamName } from "@/components/AuctionUI";
import { PageHeader } from "@/components/Brand";
import { useAuctionState } from "@/lib/hooks";

export default function BoardPage() {
  const { state, loading } = useAuctionState();

  const sold = useMemo(
    () =>
      state?.players.filter((p) => !p.isCaptain && p.status === "SOLD") ?? [],
    [state]
  );

  if (loading || !state) {
    return <main className="p-8 text-muted">Loading board…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
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

      <LiveLot state={state} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {state.teams.map((t) => (
          <div key={t.id} className="panel">
            <PurseBar team={t} />
          </div>
        ))}
      </div>

      <section className="panel">
        <h2 className="font-display text-2xl text-gold">Sold players</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sold.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-[rgba(245,197,24,0.12)] bg-black/40 px-3 py-2 text-sm"
            >
              <div className="font-medium text-white">{p.name}</div>
              <div className="text-muted">
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
