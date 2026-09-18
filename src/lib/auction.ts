import { BID_INCREMENT, SQUAD_TARGET } from "./constants";
import { minNextBid, validateBid } from "./rules";
import { newBidId } from "./seed";
import type { AuctionState, Player } from "./types";

function availableQueue(state: AuctionState): Player[] {
  return state.players.filter((p) => !p.isCaptain && p.status === "AVAILABLE");
}

function livePlayer(state: AuctionState): Player | undefined {
  return state.players.find((p) => p.id === state.auction.currentPlayerId);
}

export function startAuction(state: AuctionState): AuctionState | string {
  if (state.auction.status !== "SETUP" && state.auction.status !== "READY") {
    return "Auction already started";
  }
  state.auction.status = "READY";
  return state;
}

export function putPlayerUp(
  state: AuctionState,
  playerId?: string
): AuctionState | string {
  if (
    state.auction.status !== "READY" &&
    state.auction.status !== "SOLD" &&
    state.auction.status !== "UNSOLD" &&
    state.auction.status !== "PLAYER_UP"
  ) {
    if (state.auction.status === "BIDDING") {
      return "Finish current lot first";
    }
    if (state.auction.status === "ENDED") return "Auction ended";
    if (state.auction.status === "SETUP") return "Start auction first";
  }

  const current = livePlayer(state);
  if (current && current.status === "LIVE") {
    return "A player is already live";
  }

  let player: Player | undefined;
  if (playerId) {
    player = state.players.find((p) => p.id === playerId);
    if (!player || player.isCaptain) return "Invalid player";
    if (player.status !== "AVAILABLE" && player.status !== "UNSOLD") {
      return "Player not available";
    }
  } else {
    player = availableQueue(state)[0];
  }

  if (!player) {
    state.auction.status = "ENDED";
    state.auction.currentPlayerId = null;
    state.auction.currentBid = null;
    state.auction.currentBidTeamId = null;
    return state;
  }

  for (const p of state.players) {
    if (p.id === player!.id) {
      p.status = "LIVE";
    }
  }

  state.auction.currentPlayerId = player.id;
  state.auction.currentBid = null;
  state.auction.currentBidTeamId = null;
  state.auction.status = "PLAYER_UP";
  return state;
}

export function placeBid(
  state: AuctionState,
  teamId: string,
  amount: number
): AuctionState | string {
  if (state.auction.status === "PLAYER_UP") {
    state.auction.status = "BIDDING";
  }

  const err = validateBid(state, teamId, amount);
  if (err) return err;

  const bid = {
    id: newBidId(),
    auctionId: state.auction.id,
    playerId: state.auction.currentPlayerId!,
    teamId,
    amount,
    createdAt: new Date().toISOString(),
  };

  state.bids.push(bid);
  state.auction.currentBid = amount;
  state.auction.currentBidTeamId = teamId;
  state.auction.status = "BIDDING";
  return state;
}

export function placeQuickBid(
  state: AuctionState,
  teamId: string
): AuctionState | string {
  const amount = minNextBid(state);
  return placeBid(state, teamId, amount);
}

export function markSold(state: AuctionState): AuctionState | string {
  if (state.auction.status !== "BIDDING" && state.auction.status !== "PLAYER_UP") {
    return "No live lot to sell";
  }

  const player = livePlayer(state);
  if (!player) return "No live player";

  if (state.auction.currentBid == null || !state.auction.currentBidTeamId) {
    return "No bids — mark unsold instead";
  }

  const team = state.teams.find((t) => t.id === state.auction.currentBidTeamId);
  if (!team) return "Winning team not found";

  if (team.purseRemaining < state.auction.currentBid) {
    return "Winning team cannot afford bid";
  }

  if (team.squadCount >= SQUAD_TARGET) {
    return "Team squad is full";
  }

  team.purseRemaining -= state.auction.currentBid;
  team.squadCount += 1;
  player.status = "SOLD";
  player.teamId = team.id;
  player.soldPrice = state.auction.currentBid;

  state.auction.status = "SOLD";
  state.auction.currentPlayerId = null;
  state.auction.currentBid = null;
  state.auction.currentBidTeamId = null;

  const remaining = availableQueue(state);
  if (remaining.length === 0) {
    const allDone = state.players
      .filter((p) => !p.isCaptain)
      .every((p) => p.status === "SOLD" || p.status === "UNSOLD");
    if (allDone) state.auction.status = "ENDED";
  }

  return state;
}

export function markUnsold(state: AuctionState): AuctionState | string {
  if (state.auction.status !== "BIDDING" && state.auction.status !== "PLAYER_UP") {
    return "No live lot";
  }

  const player = livePlayer(state);
  if (!player) return "No live player";

  player.status = "UNSOLD";
  player.teamId = null;
  player.soldPrice = null;

  state.auction.status = "UNSOLD";
  state.auction.currentPlayerId = null;
  state.auction.currentBid = null;
  state.auction.currentBidTeamId = null;
  return state;
}

export function pauseAuction(state: AuctionState): AuctionState | string {
  if (state.auction.status !== "BIDDING" && state.auction.status !== "PLAYER_UP") {
    return "Nothing to pause";
  }
  state.auction.status = "PAUSED";
  return state;
}

export function resumeAuction(state: AuctionState): AuctionState | string {
  if (state.auction.status !== "PAUSED") return "Auction is not paused";
  state.auction.status = state.auction.currentBid != null ? "BIDDING" : "PLAYER_UP";
  return state;
}

export function endAuction(state: AuctionState): AuctionState | string {
  state.auction.status = "ENDED";
  state.auction.currentPlayerId = null;
  state.auction.currentBid = null;
  state.auction.currentBidTeamId = null;
  return state;
}

export { BID_INCREMENT };
