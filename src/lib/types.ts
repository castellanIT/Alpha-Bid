export type AuctionStatus =
  | "SETUP"
  | "READY"
  | "PLAYER_UP"
  | "BIDDING"
  | "PAUSED"
  | "SOLD"
  | "UNSOLD"
  | "ENDED";

export type PlayerStatus = "AVAILABLE" | "LIVE" | "SOLD" | "UNSOLD";

export type UserRole = "ADMIN" | "CAPTAIN" | "SPECTATOR";

export interface Team {
  id: string;
  name: string;
  captainUserId: string;
  captainName: string;
  purseTotal: number;
  purseRemaining: number;
  squadCount: number;
}

export interface Player {
  id: string;
  name: string;
  basePrice: number;
  status: PlayerStatus;
  teamId: string | null;
  soldPrice: number | null;
  isCaptain: boolean;
}

export interface Bid {
  id: string;
  auctionId: string;
  playerId: string;
  teamId: string;
  amount: number;
  createdAt: string;
}

export interface Auction {
  id: string;
  name: string;
  status: AuctionStatus;
  currentPlayerId: string | null;
  currentBid: number | null;
  currentBidTeamId: string | null;
  bidEndsAt: string | null;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  teamId: string | null;
  displayName: string;
  pin: string;
}

export interface AuctionState {
  auction: Auction;
  teams: Team[];
  players: Player[];
  bids: Bid[];
  users: UserProfile[];
}

export type AuctionEvent =
  | { type: "STATE"; payload: AuctionState }
  | { type: "ERROR"; message: string };
