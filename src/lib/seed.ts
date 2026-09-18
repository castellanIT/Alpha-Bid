import { randomUUID } from "crypto";
import {
  AUCTION_ID,
  BASE_PRICE,
  CAPTAIN_NAMES,
  PURSE_TOTAL,
  TEAM_NAMES,
} from "./constants";
import type { AuctionState, Player, Team, UserProfile } from "./types";
import { defaultHand, defaultPlayingRole, defaultSkillLevel } from "./players";

const PLAYER_FIRST = [
  "Ayaan",
  "Dev",
  "Ishaan",
  "Kunal",
  "Laksh",
  "Milan",
  "Neel",
  "Om",
  "Parth",
  "Reyansh",
  "Samar",
  "Tanish",
  "Uday",
  "Veer",
  "Yash",
  "Zayan",
  "Ansh",
  "Bhavya",
  "Chirag",
  "Darsh",
  "Eshan",
  "Farhan",
  "Gaurav",
  "Harsh",
];

const PLAYER_LAST = [
  "Sharma",
  "Iyer",
  "Reddy",
  "Joshi",
  "Kulkarni",
  "Desai",
  "Malhotra",
  "Chopra",
  "Bhat",
  "Pillai",
  "Nambiar",
  "Shetty",
];

function playerName(i: number): string {
  const first = PLAYER_FIRST[i % PLAYER_FIRST.length];
  const last = PLAYER_LAST[Math.floor(i / PLAYER_FIRST.length) % PLAYER_LAST.length];
  return `${first} ${last}`;
}

export function createSeedState(): AuctionState {
  const teams: Team[] = TEAM_NAMES.map((name, i) => ({
    id: `team-${i + 1}`,
    name,
    captainUserId: `captain-${i + 1}`,
    captainName: CAPTAIN_NAMES[i],
    purseTotal: PURSE_TOTAL,
    purseRemaining: PURSE_TOTAL,
    squadCount: 1,
  }));

  const captainPlayers: Player[] = teams.map((team, i) => ({
    id: `player-captain-${i + 1}`,
    name: CAPTAIN_NAMES[i],
    basePrice: BASE_PRICE,
    status: "SOLD",
    teamId: team.id,
    soldPrice: 0,
    isCaptain: true,
    playingRole: "ALL_ROUNDER",
    skillLevel: "ADVANCED",
    hand: "RIGHT",
  }));

  const auctionPlayers: Player[] = Array.from({ length: 48 }, (_, i) => ({
    id: `player-${i + 1}`,
    name: playerName(i),
    basePrice: BASE_PRICE,
    status: "AVAILABLE",
    teamId: null,
    soldPrice: null,
    isCaptain: false,
    playingRole: defaultPlayingRole(i),
    skillLevel: defaultSkillLevel(i),
    hand: defaultHand(i),
  }));

  const users: UserProfile[] = [
    {
      id: "admin-1",
      role: "ADMIN",
      teamId: null,
      displayName: "Auction Admin",
      pin: "0000",
    },
    ...teams.map((team, i) => ({
      id: `captain-${i + 1}`,
      role: "CAPTAIN" as const,
      teamId: team.id,
      displayName: CAPTAIN_NAMES[i],
      pin: String(1001 + i),
    })),
    {
      id: "spectator-1",
      role: "SPECTATOR",
      teamId: null,
      displayName: "Spectator",
      pin: "9999",
    },
  ];

  return {
    auction: {
      id: AUCTION_ID,
      name: "Alpha Warriors Auction",
      status: "SETUP",
      currentPlayerId: null,
      currentBid: null,
      currentBidTeamId: null,
      bidEndsAt: null,
      draw: null,
    },
    teams,
    players: [...captainPlayers, ...auctionPlayers],
    bids: [],
    users,
  };
}

export function newBidId(): string {
  return randomUUID();
}

export function newPlayerId(): string {
  return `player-${randomUUID().slice(0, 8)}`;
}
