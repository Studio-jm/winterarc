import { createHash } from "node:crypto";
import { Decoder, Stream } from "@garmin/fitsdk";
import { capPoints, parisDate, semicirclesToDeg } from "../time";
import type { ParsedActivity, TrackPoint } from "../types";

type FitSession = {
  startTime?: Date | string | number;
  timestamp?: Date | string | number;
  totalElapsedTime?: number;
  totalTimerTime?: number;
  totalDistance?: number;
  sport?: string;
  sportName?: string;
};

type FitRecord = {
  timestamp?: Date | string | number;
  positionLat?: number;
  positionLong?: number;
  altitude?: number;
  enhancedAltitude?: number;
  distance?: number;
};

function toIso(value: Date | string | number | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function latLon(record: FitRecord): { lat: number; lon: number } | null {
  const latRaw = record.positionLat;
  const lonRaw = record.positionLong;
  if (latRaw == null || lonRaw == null) return null;
  let lat = latRaw;
  let lon = lonRaw;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    lat = semicirclesToDeg(latRaw);
    lon = semicirclesToDeg(lonRaw);
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

export function parseFit(bytes: Buffer | Uint8Array): ParsedActivity {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const stream = Stream.fromBuffer(buf);
  const decoder = new Decoder(stream);
  if (!decoder.isFIT()) {
    throw new Error("Fichier FIT invalide");
  }
  const { messages, errors } = decoder.read({
    convertDateTimesToDates: true,
    convertTypesToStrings: true,
  });
  if (errors?.length) {
    const first = errors[0];
    const msg = first instanceof Error ? first.message : String(first);
    if (!messages || Object.keys(messages).length === 0) {
      throw new Error(`FIT illisible: ${msg}`);
    }
  }

  const sessions = (messages.sessionMesgs ?? []) as FitSession[];
  const records = (messages.recordMesgs ?? []) as FitRecord[];
  const session = sessions[0] ?? {};

  const recTimes = records.map((r) => toIso(r.timestamp)).filter((t): t is string => Boolean(t));
  const startedAt =
    toIso(session.startTime) ?? recTimes[0] ?? toIso(session.timestamp) ?? new Date().toISOString();
  const endedAt =
    toIso(session.timestamp) ?? recTimes[recTimes.length - 1] ?? startedAt;
  const durationS =
    session.totalElapsedTime ??
    session.totalTimerTime ??
    (recTimes.length >= 2
      ? (new Date(recTimes[recTimes.length - 1]).getTime() - new Date(recTimes[0]).getTime()) / 1000
      : null);
  const distanceM =
    session.totalDistance ??
    records.reduce<number | null>((acc, r) => {
      if (r.distance != null && Number.isFinite(r.distance)) return r.distance;
      return acc;
    }, null);

  const rawPoints: TrackPoint[] = [];
  records.forEach((r, i) => {
    const ll = latLon(r);
    rawPoints.push({
      seq: i,
      lat: ll?.lat ?? null,
      lon: ll?.lon ?? null,
      ele: r.enhancedAltitude ?? r.altitude ?? null,
      recordedAt: toIso(r.timestamp),
    });
  });
  const trackPoints = capPoints(rawPoints).map((p, seq) => ({ ...p, seq }));
  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 16);
  const sport = (session.sportName ?? session.sport ?? "run") as string;

  return {
    source: "fit",
    importKey: `fit:${hash}:${startedAt}`,
    sport: String(sport),
    startedAt,
    endedAt,
    durationS: durationS == null ? null : Number(durationS),
    distanceM: distanceM == null ? null : Number(distanceM),
    localDate: parisDate(startedAt),
    trackPoints,
  };
}
