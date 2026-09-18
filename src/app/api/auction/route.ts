import { NextResponse } from "next/server";
import {
  endAuction,
  markSold,
  markUnsold,
  pauseAuction,
  placeBid,
  placeQuickBid,
  putPlayerUp,
  resumeAuction,
  startAuction,
} from "@/lib/auction";
import { readState, resetState, updateState } from "@/lib/store";
import type { AuctionState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActionBody = {
  action: string;
  teamId?: string;
  amount?: number;
  playerId?: string;
  userId?: string;
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

export async function GET() {
  const state = await readState();
  return NextResponse.json(state);
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
      return NextResponse.json(next);
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
        default:
          return "Unknown action";
      }
    });

    return NextResponse.json(next);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
