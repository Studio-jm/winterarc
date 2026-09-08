export const TZ = "Europe/Paris";
export const CAMPUS_COACH_UNTIL = "2026-10-25";
export const MAX_IMPORT_BYTES = 32 * 1024 * 1024;
export const MAX_TRACK_POINTS = 250;
export const RULES_VERSION = "0.1";
export const DEFAULT_SLEEP_HOURS = 6.5;
export const SLEEP_FLOOR_HOURS = 7;
export const SLEEP_CEILING_HOURS = 6.5;

/** YYYY-MM-DD in Europe/Paris for an instant (defaults to now). */
export function parisDate(instant: Date | string | number = new Date()): string {
  const d = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(d.getTime())) {
    throw new Error("instant invalide");
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatParisLong(instant: Date | string | number = new Date()): string {
  const d = instant instanceof Date ? instant : new Date(instant);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function compareIsoDate(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  return parisDate(new Date(utc));
}

export function hoursBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return ms / 3_600_000;
}

export function secondsBetween(startIso: string, endIso: string): number {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000;
}

export function capPoints<T>(points: T[], max = MAX_TRACK_POINTS): T[] {
  if (points.length <= max) return points;
  if (max <= 1) return points.slice(0, max);
  const out: T[] = [];
  for (let i = 0; i < max; i++) {
    const idx = Math.round((i * (points.length - 1)) / (max - 1));
    out.push(points[idx]);
  }
  return out;
}

export function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function semicirclesToDeg(value: number): number {
  return value * (180 / 2147483648);
}
