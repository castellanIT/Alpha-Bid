import {
  BASE_PRICE,
  BID_INCREMENT,
  MAX_BID_PERCENT,
  PURSE_TOTAL,
} from "./constants";
import type { AuctionState, Team } from "./types";

export function maxBidForTeam(team: Team): number {
  return Math.min(
    Math.floor(team.purseTotal * MAX_BID_PERCENT),
    team.purseRemaining
  );
}

export function minNextBid(state: AuctionState): number {
  const player = state.players.find(
    (p) => p.id === state.auction.currentPlayerId
  );
  const base = player?.basePrice ?? BASE_PRICE;
  if (state.auction.currentBid == null) return base;
  return state.auction.currentBid + BID_INCREMENT;
}

export function validateBid(
  state: AuctionState,
  teamId: string,
  amount: number
): string | null {
  const { auction } = state;
  if (auction.status !== "BIDDING" && auction.status !== "PLAYER_UP") {
    return "Auction is not open for bidding";
  }
  if (!auction.currentPlayerId) return "No player is live";

  const team = state.teams.find((t) => t.id === teamId);
  if (!team) return "Team not found";

  const player = state.players.find((p) => p.id === auction.currentPlayerId);
  if (!player || player.status !== "LIVE") return "Player is not live";

  if (amount % BID_INCREMENT !== 0) {
    return `Bid must be in increments of ${BID_INCREMENT}`;
  }

  const min = minNextBid(state);
  if (amount < min) return `Bid must be at least ${min}`;

  const max = maxBidForTeam(team);
  if (amount > max) {
    return `Max bid is ${max} (50% of purse / remaining)`;
  }

  if (amount > team.purseRemaining) {
    return "Insufficient purse";
  }

  if (auction.currentBidTeamId === teamId) {
    return "You already hold the highest bid";
  }

  return null;
}

export function effectiveMaxDisplay(team: Team): number {
  return maxBidForTeam(team);
}

export { PURSE_TOTAL, BASE_PRICE, BID_INCREMENT, MAX_BID_PERCENT };
