import { NextResponse } from "next/server";
import { evaluateAndStore, loadSaisie, upsertSaisie } from "@/lib/store";
import { DEFAULT_SLEEP_HOURS, parisDate } from "@/lib/time";
import { jsonError } from "@/lib/http";
import type { SaisieInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true" || v === "on";
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export async function GET() {
  const date = parisDate();
  const row = await loadSaisie(date);
  return NextResponse.json({
    localDate: date,
    sleepHoursDefault: DEFAULT_SLEEP_HOURS,
    saisie: row ?? null,
  });
}

export async function PUT(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("JSON invalide");
  }
  const localDate = typeof body.localDate === "string" ? body.localDate : parisDate();
  const rpe = clamp(Number(body.rpe), 1, 10);
  const pain = clamp(Number(body.pain), 0, 10);
  const sleepHours = Number(body.sleepHours);
  if (!Number.isFinite(rpe) || rpe < 1) return jsonError("RPE entre 1 et 10");
  if (!Number.isFinite(pain) || pain < 0) return jsonError("Douleur entre 0 et 10");
  if (!Number.isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24) {
    return jsonError("Sommeil invalide");
  }
  const input: SaisieInput = {
    localDate,
    rpe,
    sleepHours,
    pain,
    painZone: typeof body.painZone === "string" && body.painZone.trim() ? body.painZone.trim() : null,
    gait: asBool(body.gait),
    risingPain: asBool(body.risingPain),
    pain24h: asBool(body.pain24h),
    nightPain: asBool(body.nightPain),
    swelling: asBool(body.swelling),
    focalTibial: asBool(body.focalTibial),
    fever: asBool(body.fever),
    chest: asBool(body.chest),
    limp: asBool(body.limp),
    coldCalves: asBool(body.coldCalves),
    notes: typeof body.notes === "string" ? body.notes : null,
  };
  await upsertSaisie(input);
  const evaluation = await evaluateAndStore(localDate);
  return NextResponse.json({ ok: true, saisie: input, evaluation });
}
