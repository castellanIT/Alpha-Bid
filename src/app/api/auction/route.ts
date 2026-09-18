import { NextResponse } from "next/server";
import {
  addPlayer,
  assignCaptain,
  assignDrawPicker,
  endAuction,
  markSold,
  markUnsold,
  pauseAuction,
  placeBid,
  placeQuickBid,
  putPlayerUp,
  resumeAuction,
  revealDrawCard,
  startAuction,
  updatePlayerProfile,
} from "@/lib/auction";
import { sanitizeStateForViewer } from "@/lib/players";
import { readState, resetState, updateState } from "@/lib/store";
import type { AuctionState, PlayerHand, PlayingRole, SkillLevel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActionBody = {
  action: string;
  teamId?: string;
  amount?: number;
  playerId?: string;
  userId?: string;
  cardIndex?: number;
  pickerTeamId?: string;
  playingRole?: PlayingRole | null;
  skillLevel?: SkillLevel | null;
  hand?: PlayerHand | null;
  name?: string;
  basePrice?: number;
};

function requireAdmin(state: AuctionState, userId?: string): string | null {
  const user = state.users.find((u) => u.id === userId);
  if (!user || user.role !== "ADMIN") return "Admin only";
  return null;
}

function requireCaptain(
  state: AuctionState,
  userId?: string,
  teamId?: string
): string | null {
  const user = state.users.find((u) => u.id === userId);
  if (!user || user.role !== "CAPTAIN") return "Captain only";
  if (!teamId || user.teamId !== teamId) return "Invalid team";
  return null;
}

function respond(state: AuctionState, userId?: string | null) {
  return NextResponse.json(sanitizeStateForViewer(state, userId));
}

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  const state = await readState();
  return respond(state, userId);
}

export async function POST(req: Request) {
  const body = (await req.json()) as ActionBody;
  const { action } = body;

  try {
    if (action === "reset") {
      const state = await readState();
      const err = requireAdmin(state, body.userId);
      if (err) return NextResponse.json({ error: err }, { status: 403 });
      const next = await resetState();
      return respond(next, body.userId);
    }

    const next = await updateState((state) => {
      switch (action) {
        case "start": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          return startAuction(state);
        }
        case "putPlayerUp": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          return putPlayerUp(state, body.playerId);
        }
        case "placeBid": {
          const err = requireCaptain(state, body.userId, body.teamId);
          if (err) return err;
          if (body.amount == null) return "Amount required";
          return placeBid(state, body.teamId!, body.amount);
        }
        case "quickBid": {
          const err = requireCaptain(state, body.userId, body.teamId);
          if (err) return err;
          return placeQuickBid(state, body.teamId!);
        }
        case "markSold": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          return markSold(state);
        }
        case "markUnsold": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          return markUnsold(state);
        }
        case "pause": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          return pauseAuction(state);
        }
        case "resume": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          return resumeAuction(state);
        }
        case "end": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          return endAuction(state);
        }
        case "assignDrawPicker": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          if (!body.pickerTeamId) return "Picker team required";
          return assignDrawPicker(state, body.pickerTeamId);
        }
        case "revealDrawCard": {
          if (body.cardIndex == null) return "Card index required";
          const adminErr = requireAdmin(state, body.userId);
          if (!adminErr) {
            return revealDrawCard(state, body.cardIndex, null, true);
          }
          const capErr = requireCaptain(state, body.userId, body.teamId);
          if (capErr) return capErr;
          return revealDrawCard(state, body.cardIndex, body.teamId, false);
        }
        case "updatePlayerProfile": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          if (!body.playerId) return "Player required";
          return updatePlayerProfile(state, body.playerId, {
            name: body.name,
            playingRole: body.playingRole,
            skillLevel: body.skillLevel,
            hand: body.hand,
            basePrice: body.basePrice,
          });
        }
        case "addPlayer": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          if (!body.name) return "Name required";
          return addPlayer(state, {
            name: body.name,
            playingRole: body.playingRole,
            skillLevel: body.skillLevel,
            hand: body.hand,
            basePrice: body.basePrice,
          });
        }
        case "assignCaptain": {
          const err = requireAdmin(state, body.userId);
          if (err) return err;
          if (!body.playerId || !body.teamId) return "Player and team required";
          return assignCaptain(state, body.playerId, body.teamId);
        }
        default:
          return "Unknown action";
      }
    });

    return respond(next, body.userId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
