import type {
  AuctionState,
  PlayerHand,
  PlayingRole,
  SkillLevel,
  UserRole,
} from "./types";

const ROLES: PlayingRole[] = ["BAT", "BOWL", "ALL_ROUNDER"];
const SKILLS: SkillLevel[] = ["ADVANCED", "INTERMEDIATE"];
const HANDS: PlayerHand[] = ["RIGHT", "LEFT"];

export function playingRoleLabel(role: PlayingRole | null | undefined): string {
  if (role === "BAT") return "Batter";
  if (role === "BOWL") return "Bowler";
  if (role === "ALL_ROUNDER") return "All-rounder";
  return "Unassigned";
}

export function skillLevelLabel(level: SkillLevel | null | undefined): string {
  if (level === "ADVANCED") return "Advanced";
  if (level === "INTERMEDIATE") return "Intermediate";
  return "Unassigned";
}

export function handLabel(hand: PlayerHand | null | undefined): string {
  if (hand === "RIGHT") return "Right";
  if (hand === "LEFT") return "Left";
  return "Unassigned";
}

export function defaultPlayingRole(index: number): PlayingRole {
  return ROLES[index % ROLES.length];
}

export function defaultSkillLevel(index: number): SkillLevel {
  return SKILLS[index % SKILLS.length];
}

export function defaultHand(index: number): PlayerHand {
  return HANDS[index % HANDS.length];
}

export function normalizePlayers(state: AuctionState): AuctionState {
  state.players = state.players.map((p, i) => ({
    ...p,
    playingRole:
      p.playingRole ?? (p.isCaptain ? "ALL_ROUNDER" : defaultPlayingRole(i)),
    skillLevel:
      p.skillLevel ?? (p.isCaptain ? "ADVANCED" : defaultSkillLevel(i)),
    hand: p.hand ?? (p.isCaptain ? "RIGHT" : defaultHand(i)),
  }));
  return state;
}

export function sanitizeStateForViewer(
  state: AuctionState,
  userId?: string | null
): AuctionState {
  const clone = structuredClone(state);
  normalizePlayers(clone);
  const user = clone.users.find((u) => u.id === userId);
  const isAdmin = user?.role === "ADMIN";
  if (isAdmin) return clone;

  clone.players = clone.players.map((p) => ({
    ...p,
    skillLevel: null,
  }));
  return clone;
}

export function isAdminUser(
  state: AuctionState,
  userId?: string | null
): boolean {
  return state.users.find((u) => u.id === userId)?.role === "ADMIN";
}

export function viewerRole(
  state: AuctionState,
  userId?: string | null
): UserRole | null {
  return state.users.find((u) => u.id === userId)?.role ?? null;
}
