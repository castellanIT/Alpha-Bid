import { resetState } from "@/lib/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const state = await resetState();
  return NextResponse.json(state);
}
