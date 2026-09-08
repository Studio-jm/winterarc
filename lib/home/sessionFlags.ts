import type { Banner } from "../rules";

const ON_CARD = new Set(["R5", "R6", "R8"]);

/**
 * Flags for the live home session card (not under sleep).
 * R5/R6 red = pas cette course. R8 calm = facultatif OFF.
 * Does not rewrite Campus Coach text.
 */
export function sessionFlagsOnCard(banners: Banner[]): Banner[] {
  const out: Banner[] = [];
  for (const b of banners) {
    if (!ON_CARD.has(b.ruleId)) continue;
    if (b.ruleId === "R5" || b.ruleId === "R6") {
      out.push({
        ...b,
        tone: "red",
        title: "Pas cette course",
      });
      continue;
    }
    out.push({
      ...b,
      tone: "calm",
      title: "Facultatif OFF",
    });
  }
  return out;
}
