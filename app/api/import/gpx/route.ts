import { NextResponse } from "next/server";
import { parseGpx } from "@/lib/import/gpx";
import { insertActivities, evaluateAndStore } from "@/lib/store";
import { parisDate } from "@/lib/time";
import { jsonError, readUpload, withStatus } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { buffer } = await readUpload(request);
    const activity = parseGpx(buffer);
    const result = await insertActivities([activity]);
    await evaluateAndStore(activity.localDate || parisDate());
    return NextResponse.json({ ok: true, source: "gpx", activity, ...result });
  } catch (err) {
    const { message, status } = withStatus(err);
    return jsonError(message, status);
  }
}
