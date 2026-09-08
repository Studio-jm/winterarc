import type { Evaluation } from "../rules";

export type FacultatifTone = "calm" | "red";

export type FacultatifState = {
  on: boolean;
  /** Default ON unless a garde (R8 / R5 / R6) drops optional load. */
  off: boolean;
  tone: FacultatifTone | null;
  rules: Array<"R8" | "R5" | "R6">;
  label: string;
};

const OPTIONAL_ON = "Raptor / extras · ON";
const OPTIONAL_OFF = "Facultatif OFF";

/**
 * Optional slot (Raptor / extras) defaults ON.
 * R8 → OFF, calm. R5/R6 → OFF, red only. Campus Coach run text is untouched.
 */
export function facultatifFromEvaluation(evaluation: Evaluation | null): FacultatifState {
  if (!evaluation) {
    return { on: true, off: false, tone: null, rules: [], label: OPTIONAL_ON };
  }
  const fired = new Set(
    evaluation.actions.filter((a) => a.trace.fired).map((a) => a.ruleId),
  );
  const r6 = fired.has("R6");
  const r5 = fired.has("R5");
  const r8 = fired.has("R8");
  const rules: Array<"R8" | "R5" | "R6"> = [];
  if (r6) rules.push("R6");
  if (r5) rules.push("R5");
  if (r8) rules.push("R8");

  if (r5 || r6) {
    return { on: false, off: true, tone: "red", rules, label: OPTIONAL_OFF };
  }
  if (r8) {
    return { on: false, off: true, tone: "calm", rules, label: OPTIONAL_OFF };
  }
  return { on: true, off: false, tone: null, rules: [], label: OPTIONAL_ON };
}
