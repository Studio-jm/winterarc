import { NextResponse } from "next/server";
import { addRepas } from "@/lib/store";
import { parisDate } from "@/lib/time";
import { jsonError } from "@/lib/http";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const date = parisDate();
  const db = await getDb();
  const rows = await db.all(`SELECT * FROM repas WHERE local_date = ? ORDER BY id ASC`, [date]);
  return NextResponse.json({ localDate: date, repas: rows });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("JSON invalide");
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return jsonError("Texte du repas requis");
  const portion = typeof body.portion === "string" && body.portion.trim() ? body.portion.trim() : null;
  const localDate = typeof body.localDate === "string" ? body.localDate : parisDate();
  const row = await addRepas(localDate, text, portion);
  return NextResponse.json({ ok: true, repas: row });
}
