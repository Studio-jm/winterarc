import { NextResponse } from "next/server";
import { parseFit } from "@/lib/import/fit";
import { insertActivities, evaluateAndStore } from "@/lib/store";
import { parisDate } from "@/lib/time";
import { jsonError, readUpload, withStatus } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { buffer } = await readUpload(request);
    const activity = parseFit(buffer);
    const result = await insertActivities([activity]);
    await evaluateAndStore(activity.localDate || parisDate());
    return NextResponse.json({ ok: true, source: "fit", activity, ...result });
  } catch (err) {
    const { message, status } = withStatus(err);
    return jsonError(message, status);
  }
}
