import { NextResponse } from "next/server";
import { parseHealthXml } from "@/lib/import/health";
import { insertActivities, insertSleeps, evaluateAndStore } from "@/lib/store";
import { parisDate } from "@/lib/time";
import { jsonError, readUpload, withStatus } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { buffer } = await readUpload(request);
    const xml = buffer.toString("utf8");
    const parsed = await parseHealthXml(xml);
    const workouts = await insertActivities(parsed.workouts);
    const sleeps = await insertSleeps(parsed.sleeps);
    await evaluateAndStore(parisDate());
    return NextResponse.json({
      ok: true,
      source: "apple_health",
      workouts,
      sleeps,
    });
  } catch (err) {
    const { message, status } = withStatus(err);
    return jsonError(message, status);
  }
}
