import { createHash } from "node:crypto";
import { SaxesParser } from "saxes";
import { capPoints, haversineM, parisDate, secondsBetween } from "../time";
import type { ParsedActivity, TrackPoint } from "../types";

type Pt = { lat: number; lon: number; ele: number | null; time: string | null };

function attrMap(tag: { attributes: Record<string, string | { value: string }> }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tag.attributes)) {
    out[k] = typeof v === "string" ? v : v.value;
  }
  return out;
}

export function parseGpx(xml: string | Buffer, fileHash?: string): ParsedActivity {
  const parser = new SaxesParser({ xmlns: false });
  const points: Pt[] = [];
  let name: string | null = null;
  let currentText = "";
  let inName = false;
  let inEle = false;
  let inTime = false;
  let pending: Pt | null = null;

  parser.on("opentag", (tag) => {
    const local = tag.name.includes(":") ? tag.name.split(":")[1] : tag.name;
    currentText = "";
    if (local === "trkpt" || local === "wpt") {
      const a = attrMap(tag as unknown as { attributes: Record<string, string> });
      pending = {
        lat: Number(a.lat),
        lon: Number(a.lon),
        ele: null,
        time: null,
      };
    } else if (local === "name") {
      inName = true;
    } else if (local === "ele") {
      inEle = true;
    } else if (local === "time") {
      inTime = true;
    }
  });

  parser.on("text", (t) => {
    currentText += t;
  });

  parser.on("closetag", (tag) => {
    const local = (typeof tag === "string" ? tag : (tag as { name: string }).name) ?? "";
    const nameLocal = local.includes(":") ? local.split(":")[1] : local;
    const text = currentText.trim();
    if (nameLocal === "name" && inName && !name && text) name = text;
    if (pending && nameLocal === "ele" && inEle && text) pending.ele = Number(text);
    if (pending && nameLocal === "time" && inTime && text) pending.time = new Date(text).toISOString();
    if (nameLocal === "trkpt" || nameLocal === "wpt") {
      if (pending && Number.isFinite(pending.lat) && Number.isFinite(pending.lon)) {
        points.push(pending);
      }
      pending = null;
    }
    inName = inEle = inTime = false;
    currentText = "";
  });

  const buf = Buffer.isBuffer(xml) ? xml : Buffer.from(xml);
  const chunk = 32 * 1024;
  for (let i = 0; i < buf.length; i += chunk) {
    parser.write(buf.subarray(i, i + chunk).toString("utf8"));
  }
  parser.close();

  if (points.length === 0) {
    throw new Error("GPX sans points de trace");
  }

  let distanceM = 0;
  for (let i = 1; i < points.length; i++) {
    distanceM += haversineM(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
  }

  const times = points.map((p) => p.time).filter((t): t is string => Boolean(t));
  const startedAt = times[0] ?? new Date().toISOString();
  const endedAt = times[times.length - 1] ?? startedAt;
  const durationS = times.length >= 2 ? secondsBetween(startedAt, endedAt) : null;
  const hash = fileHash ?? createHash("sha256").update(buf).digest("hex").slice(0, 16);

  const trackPoints: TrackPoint[] = capPoints(points).map((p, seq) => ({
    seq,
    lat: p.lat,
    lon: p.lon,
    ele: p.ele,
    recordedAt: p.time,
  }));

  return {
    source: "gpx",
    importKey: `gpx:${hash}:${name ?? startedAt}`,
    sport: name ?? "run",
    startedAt,
    endedAt,
    durationS,
    distanceM,
    localDate: parisDate(startedAt),
    trackPoints,
  };
}
