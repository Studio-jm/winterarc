import { NextResponse } from "next/server";
import { loadSemaine } from "@/lib/semaine/week";
import { parisDate } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const week = await loadSemaine(parisDate());
  return NextResponse.json(week);
}
