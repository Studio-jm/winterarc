import { NextResponse } from "next/server";
import { loadHome } from "@/lib/home/today";
import { parisDate } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await loadHome(parisDate());
  return NextResponse.json(payload);
}
