import { CAMPUS_COACH_UNTIL, compareIsoDate, weekdayMondayIndex } from "../time";

/**
 * Mirror of Jessy's current Campus Coach week (until Lille).
 * Display fallback only — not generated, not auto-progression, not a second plan.
 * Index 0 = lundi.
 */
export const CAMPUS_COACH_WEEK_MIRROR = [
  "Repos / force",
  "EF 45 min",
  "Tempo / fractionné allure marathon",
  "Repos / force",
  "EF 45 min",
  "Sortie longue",
  "Repos / force",
] as const;

export const COURSE_BADGE = "course = Campus Coach";

export type SessionFields = {
  type: string;
  duration: string | null;
  pace: string | null;
};

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Weekday fallback while Campus Coach is the run line. Empty paste → mirror. Never invent a new session. */
export function campusCoachMirrorLine(isoDate: string): string {
  if (compareIsoDate(isoDate, CAMPUS_COACH_UNTIL) > 0) return "";
  return CAMPUS_COACH_WEEK_MIRROR[weekdayMondayIndex(isoDate)];
}

export function displayCampusCoachText(isoDate: string, stored: string | null | undefined): string {
  const text = stored?.trim() ?? "";
  if (text) return stored as string;
  return campusCoachMirrorLine(isoDate);
}

export function isCampusCoachMirror(stored: string | null | undefined): boolean {
  return !(stored?.trim());
}

/** Read type / duration / pace from pasted (or mirrored) Campus Coach text. No rewrite. */
export function parseCampusCoachFields(text: string): SessionFields {
  const raw = text.trim();
  if (!raw) return { type: "—", duration: null, pace: null };
  const t = fold(raw);

  let duration: string | null = null;
  const dMin = t.match(/\b(\d+)\s*(?:min|minutes)\b/);
  const dH = t.match(/\b(\d+(?:[.,]\d+)?)\s*h\b/);
  if (dMin) duration = `${dMin[1]} min`;
  else if (dH) duration = `${dH[1].replace(".", ",")} h`;

  let pace: string | null = null;
  const allure = raw.match(/allure\s+([^,;./]+)/i);
  const perKm = raw.match(/\d+[.,]\d+\s*\/\s*km/i);
  if (allure) pace = `allure ${allure[1].trim()}`;
  else if (perKm) pace = perKm[0];

  let type: string;
  if (/\brepos\b/.test(t) && /\bforce\b/.test(t)) type = "Repos / force";
  else if (/\brepos\b/.test(t) || /\b(rest|off)\b/.test(t)) type = "Repos";
  else if (/\b(sortie longue|long run)\b/.test(t)) type = "Sortie longue";
  else if (/\btempo\b/.test(t) && /\bfractionn/.test(t)) type = "Tempo / fractionné";
  else if (/\bfractionn|\bintervall/.test(t)) type = "Fractionné";
  else if (/\btempo\b/.test(t)) type = "Tempo";
  else if (/\bef\b/.test(t)) type = "EF";
  else type = raw.split(/[—–\n]/)[0]?.trim() || raw;

  return { type, duration, pace };
}
