"use client";

import type { AuctionState, Player, Team } from "@/lib/types";
import { maxBidForTeam, minNextBid } from "@/lib/rules";

export function teamName(state: AuctionState, teamId: string | null): string {
  if (!teamId) return "—";
  return state.teams.find((t) => t.id === teamId)?.name ?? "—";
}

export function currentPlayer(state: AuctionState): Player | null {
  if (!state.auction.currentPlayerId) return null;
  return (
    state.players.find((p) => p.id === state.auction.currentPlayerId) ?? null
  );
}

export function teamSquad(state: AuctionState, teamId: string): Player[] {
  return state.players.filter((p) => p.teamId === teamId);
}

export function PurseBar({ team }: { team: Team }) {
  const pct = Math.round((team.purseRemaining / team.purseTotal) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-white">{team.name}</span>
        <span className="text-gold">
          ₹{team.purseRemaining} / ₹{team.purseTotal}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-black/60">
        <div
          className="h-full bg-gradient-to-r from-[#8b0000] via-[#e10600] to-[#f5c518] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-muted">
        Squad {team.squadCount}/7 · Max bid ₹{maxBidForTeam(team)}
      </div>
    </div>
  );
}

export function LiveLot({ state }: { state: AuctionState }) {
  const player = currentPlayer(state);
  const min = minNextBid(state);

  return (
    <div className="hex-bg rounded-2xl border border-[rgba(245,197,24,0.4)] bg-gradient-to-br from-[#1a0808] via-black to-[#0a0a0a] p-6 text-center shadow-[0_0_40px_rgba(225,6,0,0.2)]">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold">
        {state.auction.status}
      </p>
      <h2 className="font-display mt-3 text-4xl text-white md:text-5xl">
        {player?.name ?? "Waiting for next player"}
      </h2>
      <p className="mt-4 text-[rgba(232,232,232,0.85)]">
        Base ₹{player?.basePrice ?? 50}
        {state.auction.currentBid != null && (
          <>
            {" "}
            · Leading{" "}
            <span className="font-bold text-gold">
              ₹{state.auction.currentBid}
            </span>{" "}
            ({teamName(state, state.auction.currentBidTeamId)})
          </>
        )}
      </p>
      {player && (
        <p className="mt-2 text-sm text-muted">Next bid from ₹{min}</p>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-[rgba(245,197,24,0.4)] bg-[rgba(225,6,0,0.15)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold">
      {status}
    </span>
  );
}
