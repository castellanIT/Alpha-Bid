"use client";

import type { AuctionState, Player, Team } from "@/lib/types";
import { EQUAL_BID_AMOUNT } from "@/lib/constants";
import { playingRoleLabel, skillLevelLabel, handLabel } from "@/lib/players";
import { maxBidForTeam, minNextBid, teamsWithEqualBid } from "@/lib/rules";

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

export function PurseBar({
  team,
  leading = false,
}: {
  team: Team;
  leading?: boolean;
}) {
  const pct = Math.round((team.purseRemaining / team.purseTotal) * 100);
  return (
    <div
      className={`space-y-1 rounded-lg p-2 transition ${
        leading
          ? "bid-pulse border border-[rgba(245,197,24,0.65)] bg-[rgba(245,197,24,0.12)]"
          : ""
      }`}
    >
      <div className="flex justify-between text-sm">
        <span
          className={
            leading
              ? "text-base font-extrabold uppercase tracking-wide text-gold"
              : "font-semibold text-white"
          }
        >
          {team.name}
          {leading ? " · BIDDING" : ""}
        </span>
        <span className={leading ? "text-base font-extrabold text-gold" : "text-gold"}>
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

export function PlayerProfile({
  player,
  showSkill = false,
  compact = false,
  badgesOnly = false,
}: {
  player: Player;
  showSkill?: boolean;
  compact?: boolean;
  badgesOnly?: boolean;
}) {
  return (
    <div className={compact || badgesOnly ? "inline-flex flex-wrap items-center gap-2" : "space-y-1"}>
      {!badgesOnly && (
        <span className={compact ? "font-medium text-white" : "font-display text-2xl text-white"}>
          {player.name}
          {player.isCaptain ? " (C)" : ""}
        </span>
      )}
      <span className="rounded-full border border-[rgba(245,197,24,0.35)] bg-[rgba(245,197,24,0.1)] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-gold">
        {playingRoleLabel(player.playingRole)}
      </span>
      <span className="rounded-full border border-[rgba(192,192,192,0.4)] bg-[rgba(192,192,192,0.1)] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[rgba(232,232,232,0.9)]">
        {handLabel(player.hand)}
      </span>
      {showSkill && player.skillLevel && (
        <span className="rounded-full border border-[rgba(225,6,0,0.4)] bg-[rgba(225,6,0,0.12)] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-crimson">
          {skillLevelLabel(player.skillLevel)}
        </span>
      )}
    </div>
  );
}

export function LiveLot({
  state,
  emphasizeBid = false,
  showSkill = false,
}: {
  state: AuctionState;
  emphasizeBid?: boolean;
  showSkill?: boolean;
}) {
  const player = currentPlayer(state);
  const min = minNextBid(state);
  const leadingTeam = teamName(state, state.auction.currentBidTeamId);
  const hasBid = state.auction.currentBid != null;
  const equalTeams =
    state.auction.currentBid === EQUAL_BID_AMOUNT && player
      ? teamsWithEqualBid(state, player.id)
      : [];

  return (
    <div className="hex-bg rounded-2xl border border-[rgba(245,197,24,0.4)] bg-gradient-to-br from-[#1a0808] via-black to-[#0a0a0a] p-6 text-center shadow-[0_0_40px_rgba(225,6,0,0.2)]">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold">
        {state.auction.status}
      </p>
      {player ? (
        <div className="mt-3 flex flex-col items-center gap-2">
          <h2 className="font-display text-4xl text-white md:text-5xl">
            {player.name}
          </h2>
          <PlayerProfile player={player} showSkill={showSkill} badgesOnly />
        </div>
      ) : (
        <h2 className="font-display mt-3 text-4xl text-white md:text-5xl">
          Waiting for next player
        </h2>
      )}
      <p className="mt-4 text-[rgba(232,232,232,0.85)]">
        Base ₹{player?.basePrice ?? 50}
      </p>

      {hasBid && emphasizeBid && (
        <div className="bid-pulse mx-auto mt-5 max-w-lg rounded-xl border-2 border-[rgba(245,197,24,0.75)] bg-[rgba(225,6,0,0.18)] px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">
            {equalTeams.length > 1 ? "₹500 matched by" : "Current bid"}
          </p>
          <p className="font-display mt-1 text-5xl font-bold text-gold md:text-6xl">
            ₹{state.auction.currentBid}
          </p>
          {equalTeams.length > 1 ? (
            <p className="mt-2 text-xl font-extrabold uppercase tracking-wide text-white">
              {equalTeams.map((id) => teamName(state, id)).join(" · ")}
            </p>
          ) : (
            <p className="mt-2 text-2xl font-extrabold uppercase tracking-wide text-white">
              {leadingTeam}
            </p>
          )}
        </div>
      )}

      {hasBid && !emphasizeBid && (
        <p className="mt-4 text-[rgba(232,232,232,0.85)]">
          Leading{" "}
          <span className="font-bold text-gold">₹{state.auction.currentBid}</span>{" "}
          (
          {equalTeams.length > 1
            ? equalTeams.map((id) => teamName(state, id)).join(", ")
            : leadingTeam}
          )
        </p>
      )}

      {player && state.auction.status !== "DRAW" && (
        <p className="mt-2 text-sm text-muted">
          {state.auction.currentBid === EQUAL_BID_AMOUNT
            ? "Match ₹500 allowed · Sold starts draw if multiple"
            : `Next bid from ₹${min}`}
        </p>
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
