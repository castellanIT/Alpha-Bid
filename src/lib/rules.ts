import {
  BASE_PRICE,
  BID_INCREMENT,
  EQUAL_BID_AMOUNT,
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

export function teamsWithEqualBid(
  state: AuctionState,
  playerId: string,
  amount: number = EQUAL_BID_AMOUNT
): string[] {
  const ids = new Set<string>();
  for (const b of state.bids) {
    if (b.playerId === playerId && b.amount === amount) {
      ids.add(b.teamId);
    }
  }
  return [...ids];
}

export function teamAlreadyEqualBid(
  state: AuctionState,
  playerId: string,
  teamId: string,
  amount: number = EQUAL_BID_AMOUNT
): boolean {
  return state.bids.some(
    (b) => b.playerId === playerId && b.teamId === teamId && b.amount === amount
  );
}

export function minNextBid(state: AuctionState): number {
  const player = state.players.find(
    (p) => p.id === state.auction.currentPlayerId
  );
  const base = player?.basePrice ?? BASE_PRICE;
  if (state.auction.currentBid == null) return base;
  if (state.auction.currentBid === EQUAL_BID_AMOUNT) return EQUAL_BID_AMOUNT;
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

  const max = maxBidForTeam(team);
  if (amount > max) {
    return `Max bid is ${max} (50% of purse / remaining)`;
  }

  if (amount > team.purseRemaining) {
    return "Insufficient purse";
  }

  const current = auction.currentBid;

  if (amount === EQUAL_BID_AMOUNT) {
    if (current != null && current > EQUAL_BID_AMOUNT) {
      return "Invalid bid amount";
    }
    if (current != null && current < EQUAL_BID_AMOUNT) {
      const min = minNextBid(state);
      if (amount < min) return `Bid must be at least ${min}`;
    }
    if (
      teamAlreadyEqualBid(state, auction.currentPlayerId, teamId, EQUAL_BID_AMOUNT)
    ) {
      return "Your team already matched ₹500";
    }
    return null;
  }

  if (current === EQUAL_BID_AMOUNT) {
    return "Only ₹500 matching bids allowed now — go to draw if tied";
  }

  const min = minNextBid(state);
  if (amount < min) return `Bid must be at least ${min}`;

  if (current != null && amount === current) {
    return "Equal bids only allowed at ₹500";
  }

  if (auction.currentBidTeamId === teamId) {
    return "You already hold the highest bid";
  }

  return null;
}

export function effectiveMaxDisplay(team: Team): number {
  return maxBidForTeam(team);
}

export { PURSE_TOTAL, BASE_PRICE, BID_INCREMENT, MAX_BID_PERCENT, EQUAL_BID_AMOUNT };
