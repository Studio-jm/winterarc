import { NextResponse } from "next/server";
import { buildSampleHealthXml } from "@/lib/import/sample";
import { parseHealthXml } from "@/lib/import/health";
import { insertActivities, insertSleeps, evaluateAndStore } from "@/lib/store";
import { parisDate } from "@/lib/time";
import { jsonError, withStatus } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const xml = buildSampleHealthXml(parisDate());
    const parsed = await parseHealthXml(xml);
    const workouts = await insertActivities(parsed.workouts);
    const sleeps = await insertSleeps(parsed.sleeps);
    await evaluateAndStore(parisDate());
    return NextResponse.json({
      ok: true,
      source: "apple_health",
      example: true,
      workouts,
      sleeps,
    });
  } catch (err) {
    const { message, status } = withStatus(err);
    return jsonError(message, status);
  }
}
