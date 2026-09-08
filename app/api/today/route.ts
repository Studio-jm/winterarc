import { NextResponse } from "next/server";
import { loadToday } from "@/lib/store";
import { parisDate } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await loadToday(parisDate());
  return NextResponse.json(payload);
}
