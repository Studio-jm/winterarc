import { SaxesParser } from "saxes";
import { parisDate, secondsBetween } from "../time";
import type { ParsedActivity, ParsedSleep } from "../types";

const ASLEEP_VALUES = new Set([
  "HKCategoryValueSleepAnalysisAsleep",
  "HKCategoryValueSleepAnalysisAsleepUnspecified",
  "HKCategoryValueSleepAnalysisAsleepCore",
  "HKCategoryValueSleepAnalysisAsleepDeep",
  "HKCategoryValueSleepAnalysisAsleepREM",
  "Asleep",
  "AsleepUnspecified",
  "AsleepCore",
  "AsleepDeep",
  "AsleepREM",
]);

const INBED_VALUES = new Set([
  "HKCategoryValueSleepAnalysisInBed",
  "InBed",
]);

export type HealthParseResult = {
  workouts: ParsedActivity[];
  sleeps: ParsedSleep[];
};

function attrMap(tag: { attributes: Record<string, string | { value: string }> }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tag.attributes)) {
    out[k] = typeof v === "string" ? v : v.value;
  }
  return out;
}

function toIso(appleDate: string): string {
  const normalized = appleDate
    .trim()
    .replace(
      /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)? ?([+-]\d{2}):?(\d{2})$/,
      "$1T$2$3:$4",
    );
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date(appleDate);
    if (Number.isNaN(fallback.getTime())) return appleDate;
    return fallback.toISOString();
  }
  return d.toISOString();
}

function sportFromType(type: string | undefined): string {
  if (!type) return "workout";
  return type.replace(/^HKWorkoutActivityType/, "").replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function distanceToMeters(value: string | undefined, unit: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const u = (unit ?? "km").toLowerCase();
  if (u.startsWith("mi")) return n * 1609.344;
  if (u.startsWith("m") && !u.startsWith("mi")) return n;
  return n * 1000;
}

function durationToSeconds(value: string | undefined, unit: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const u = (unit ?? "min").toLowerCase();
  if (u.startsWith("s")) return n;
  if (u.startsWith("h")) return n * 3600;
  return n * 60;
}

function isAsleep(type: string, value: string): boolean {
  if (!type.includes("SleepAnalysis")) return false;
  if (ASLEEP_VALUES.has(value)) return true;
  if (INBED_VALUES.has(value)) return false;
  if (value.includes("Awake") || value.includes("InBed")) return false;
  return value.toLowerCase().includes("asleep");
}

export async function parseHealthXml(
  input: string | Buffer | AsyncIterable<string | Buffer>,
): Promise<HealthParseResult> {
  const workouts: ParsedActivity[] = [];
  const sleeps: ParsedSleep[] = [];
  const parser = new SaxesParser({ xmlns: false, fragment: false });

  parser.on("opentag", (tag) => {
    const a = attrMap(tag as unknown as { attributes: Record<string, string> });
    if (tag.name === "Workout") {
      const start = a.startDate ? toIso(a.startDate) : null;
      if (!start) return;
      const end = a.endDate ? toIso(a.endDate) : null;
      const durationS =
        durationToSeconds(a.duration, a.durationUnit) ??
        (end ? secondsBetween(start, end) : null);
      const distanceM = distanceToMeters(a.totalDistance, a.totalDistanceUnit);
      const importKey = `workout:${a.startDate}:${a.workoutActivityType ?? "unknown"}`;
      workouts.push({
        source: "apple_health",
        importKey,
        sport: sportFromType(a.workoutActivityType),
        startedAt: start,
        endedAt: end,
        durationS,
        distanceM,
        localDate: parisDate(start),
        trackPoints: [],
      });
      return;
    }
    if (tag.name === "Record") {
      const type = a.type ?? "";
      if (!type.includes("SleepAnalysis")) return;
      const start = a.startDate ? toIso(a.startDate) : null;
      const end = a.endDate ? toIso(a.endDate) : null;
      if (!start || !end) return;
      const value = a.value ?? "";
      if (!isAsleep(type, value)) return;
      const durationS = Math.max(0, secondsBetween(start, end));
      sleeps.push({
        source: "apple_health",
        importKey: `sleep:${a.startDate}:${a.endDate}:${value}`,
        startedAt: start,
        endedAt: end,
        stage: value,
        durationS,
        localDate: parisDate(end),
      });
    }
  });

  const done = new Promise<void>((resolve, reject) => {
    parser.on("end", () => resolve());
    parser.on("error", (err) => reject(err));
  });

  if (typeof input === "string" || Buffer.isBuffer(input)) {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const chunk = 64 * 1024;
    for (let i = 0; i < buf.length; i += chunk) {
      parser.write(buf.subarray(i, i + chunk).toString("utf8"));
    }
    parser.close();
  } else {
    for await (const piece of input) {
      parser.write(Buffer.isBuffer(piece) ? piece.toString("utf8") : piece);
    }
    parser.close();
  }

  await done;
  return { workouts, sleeps };
}
