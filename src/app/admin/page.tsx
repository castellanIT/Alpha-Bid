"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LiveLot, PurseBar, teamName } from "@/components/AuctionUI";
import { PageHeader } from "@/components/Brand";
import { clearSession, loadSession, useAuctionState } from "@/lib/hooks";

export default function AdminPage() {
  const { state, error, loading, mutate, setError } = useAuctionState();
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const s = loadSession();
    if (!s || s.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    setUserId(s.userId);
  }, [router]);

  const queue = useMemo(
    () =>
      state?.players.filter(
        (p) => !p.isCaptain && (p.status === "AVAILABLE" || p.status === "UNSOLD")
      ) ?? [],
    [state]
  );

  const liveBids = useMemo(() => {
    if (!state?.auction.currentPlayerId) return [];
    return state.bids
      .filter((b) => b.playerId === state.auction.currentPlayerId)
      .slice(-8)
      .reverse();
  }, [state]);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    if (!userId) return;
    await mutate({ action, userId, ...extra });
  }

  if (loading || !state || !userId) {
    return <main className="p-8 text-muted">Loading admin…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <PageHeader
        title="Admin Control"
        subtitle={state.auction.name}
        actions={
          <>
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

      <LiveLot state={state} />

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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <h2 className="font-display text-2xl text-gold">Purses</h2>
          <div className="mt-4 space-y-4">
            {state.teams.map((t) => (
              <PurseBar key={t.id} team={t} />
            ))}
          </div>
        </section>

        <section className="panel">
          <h2 className="font-display text-2xl text-gold">
            Queue ({queue.length})
          </h2>
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
            {queue.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[rgba(245,197,24,0.12)] bg-black/40 px-3 py-2"
              >
                <span>
                  {p.name}{" "}
                  <span className="text-muted">₹{p.basePrice}</span>
                </span>
                <button
                  className="btn-secondary"
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                  onClick={() => act("putPlayerUp", { playerId: p.id })}
                >
                  Put up
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2 className="font-display text-2xl text-gold">Recent bids</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {liveBids.map((b) => (
            <li key={b.id}>
              <span className="text-gold">₹{b.amount}</span> —{" "}
              {teamName(state, b.teamId)}
            </li>
          ))}
          {liveBids.length === 0 && (
            <li className="text-muted">No bids on current lot</li>
          )}
        </ul>
      </section>
    </main>
  );
}
