import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { upsertPlannedDay } from "@/lib/store";
import { parisDate } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function PUT(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("JSON invalide");
  }
  const localDate = typeof body.localDate === "string" ? body.localDate : parisDate();
  if (!ISO.test(localDate)) return jsonError("Date invalide");
  if (typeof body.campusCoachText !== "string") {
    return jsonError("Texte Campus Coach manquant");
  }
  const row = await upsertPlannedDay(localDate, body.campusCoachText);
  return NextResponse.json({ ok: true, planned: row });
}
