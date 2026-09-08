/** Quiet-day base. Cible only — not a meal plan. */
export const QUIET_DAY_KCAL = 2200;
/** Higher carbs / energy when the pasted Campus Coach line has volume. */
export const VOLUME_DAY_KCAL = 2800;

export type NutritionCible = {
  kcal: number;
  kind: "quiet" | "volume";
  line: string;
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

/**
 * Simple volume detector on the pasted Campus Coach text.
 * Never rewrites the text. Empty / repos → quiet.
 */
export function plannedHasVolume(text: string): boolean {
  const t = fold(text);
  if (!t) return false;
  if (/\b(repos|rest|off)\b/.test(t) && !/\d+(?:[.,]\d+)?\s*km\b/.test(t)) {
    return false;
  }

  for (const m of t.matchAll(/(\d+(?:[.,]\d+)?)\s*km\b/g)) {
    if (Number(m[1].replace(",", ".")) >= 12) return true;
  }
  for (const m of t.matchAll(/(\d+)\s*(?:min|minutes)\b/g)) {
    if (Number(m[1]) >= 75) return true;
  }
  if (/\b(sortie longue|long run|semi[- ]?marathon)\b/.test(t)) return true;
  if (/\bvolume\b/.test(t)) return true;
  return false;
}

export function nutritionCible(campusCoachText: string): NutritionCible {
  if (plannedHasVolume(campusCoachText)) {
    return {
      kcal: VOLUME_DAY_KCAL,
      kind: "volume",
      line: `cible ~${VOLUME_DAY_KCAL} kcal · glucides / énergie plus élevés (volume prévu)`,
    };
  }
  return {
    kcal: QUIET_DAY_KCAL,
    kind: "quiet",
    line: `cible ~${QUIET_DAY_KCAL} kcal (jour calme)`,
  };
}
