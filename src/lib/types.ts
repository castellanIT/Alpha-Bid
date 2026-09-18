export type AuctionStatus =
  | "SETUP"
  | "READY"
  | "PLAYER_UP"
  | "BIDDING"
  | "PAUSED"
  | "DRAW"
  | "SOLD"
  | "UNSOLD"
  | "ENDED";

export type PlayerStatus = "AVAILABLE" | "LIVE" | "SOLD" | "UNSOLD";

export type UserRole = "ADMIN" | "CAPTAIN" | "SPECTATOR";

export type PlayingRole = "BAT" | "BOWL" | "ALL_ROUNDER";

export type SkillLevel = "ADVANCED" | "INTERMEDIATE";

export type PlayerHand = "RIGHT" | "LEFT";

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
  playingRole: PlayingRole | null;
  skillLevel: SkillLevel | null;
  hand: PlayerHand | null;
}

export interface Bid {
  id: string;
  auctionId: string;
  playerId: string;
  teamId: string;
  amount: number;
  createdAt: string;
}

export interface DrawState {
  playerId: string;
  contenderTeamIds: string[];
  cardOrder: string[];
  pickerTeamId: string | null;
  revealedIndex: number | null;
  winnerTeamId: string | null;
}

export interface Auction {
  id: string;
  name: string;
  status: AuctionStatus;
  currentPlayerId: string | null;
  currentBid: number | null;
  currentBidTeamId: string | null;
  bidEndsAt: string | null;
  draw: DrawState | null;
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
