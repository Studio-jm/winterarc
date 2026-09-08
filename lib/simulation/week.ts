import { estimateMeal } from "../meals/estimate";
import { evaluateRules, type Banner, type DaySignals } from "../rules";
import { DEFAULT_SLEEP_HOURS, addDays, parisDate } from "../time";

/** Isolated demo source — never persisted; easy to ignore. */
export const SIMULATION_SOURCE = "simulation" as const;

export const SIMULATION_SLEEP_HOURS = DEFAULT_SLEEP_HOURS;

export const SIMULATION_INTRO =
  "Ceci est un aperçu fictif d'une semaine remplie. Ce n'est pas Campus Coach, pas un plan à suivre. Campus Coach reste le seul plan de course jusqu'à Lille.";

const SESSION_CAPTION = "étiquette démo · pas une consigne";

/** Monday–Sunday template. Index 2 (mercredi) is the single visual-only R5 day. */
const WEEK_TEMPLATE: Array<{
  session: string;
  rpe: number;
  mealText: string;
  redDemo?: boolean;
}> = [
  { session: "easy", rpe: 3, mealText: "porridge" },
  { session: "run", rpe: 5, mealText: "pates bolo" },
  { session: "easy", rpe: 4, mealText: "pizza", redDemo: true },
  { session: "run", rpe: 6, mealText: "wrap" },
  { session: "easy", rpe: 4, mealText: "riz poulet" },
  { session: "long", rpe: 5, mealText: "saumon" },
  { session: "repos", rpe: 2, mealText: "quiche" },
];

const R8_DEMO_BANNER: Banner = {
  ruleId: "R8",
  tone: "calm",
  title: "R8 — plafond sommeil",
  body: "6,5 h (plafond structurel). Bandeau calme, jamais rouge. Données de démo.",
};

const R5_DEMO_BANNER: Banner = {
  ruleId: "R5",
  tone: "red",
  title: "R5 — visuel démo",
  body: "Rouge visuel uniquement (démarche). Aperçu, pas une consigne.",
};

export type SimulationMeal = {
  text: string;
  kcal: number;
  estimate: "high";
  matched: string[];
  source: typeof SIMULATION_SOURCE;
};

export type SimulationSession = {
  label: string;
  caption: string;
  source: typeof SIMULATION_SOURCE;
};

export type SimulationDay = {
  localDate: string;
  weekday: string;
  source: typeof SIMULATION_SOURCE;
  session: SimulationSession;
  rpe: number;
  sleepHours: number;
  meal: SimulationMeal;
  banners: Banner[];
  redDemo: boolean;
};

export type SimulationWeek = {
  source: typeof SIMULATION_SOURCE;
  intro: string;
  monday: string;
  days: SimulationDay[];
};

function weekdayMondayIndex(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (utcDay + 6) % 7;
}

export function mondayOfParisWeek(isoDate: string): string {
  return addDays(isoDate, -weekdayMondayIndex(isoDate));
}

export function formatWeekdayFr(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

function demoSignals(localDate: string, redDemo: boolean): DaySignals {
  return {
    localDate,
    sleepHours: SIMULATION_SLEEP_HOURS,
    rpe: 4,
    pain: redDemo ? 3 : 0,
    painZone: null,
    gait: redDemo,
    risingPain: false,
    pain24h: false,
    nightPain: false,
    swelling: false,
    focalTibial: false,
    fever: false,
    chest: false,
    limp: false,
    coldCalves: false,
    hadAlertYesterday: false,
  };
}

function bannersForDay(localDate: string, redDemo: boolean): Banner[] {
  const evaluation = evaluateRules(demoSignals(localDate, redDemo));
  const r8 = evaluation.banners.find((b) => b.ruleId === "R8");
  const r5 = evaluation.banners.find((b) => b.ruleId === "R5");
  const out: Banner[] = [];
  if (r8?.tone === "calm") {
    out.push({ ...R8_DEMO_BANNER, tone: r8.tone });
  }
  if (redDemo && r5?.tone === "red") {
    out.push({ ...R5_DEMO_BANNER, tone: r5.tone });
  }
  return out;
}

export function buildSimulationWeek(anchor = parisDate()): SimulationWeek {
  const monday = mondayOfParisWeek(anchor);
  const days = WEEK_TEMPLATE.map((row, i) => {
    const localDate = addDays(monday, i);
    const meal = estimateMeal(row.mealText);
    const redDemo = Boolean(row.redDemo);
    return {
      localDate,
      weekday: formatWeekdayFr(localDate),
      source: SIMULATION_SOURCE,
      session: {
        label: row.session,
        caption: SESSION_CAPTION,
        source: SIMULATION_SOURCE,
      },
      rpe: row.rpe,
      sleepHours: SIMULATION_SLEEP_HOURS,
      meal: {
        text: row.mealText,
        kcal: meal.kcal,
        estimate: meal.estimate,
        matched: meal.matched,
        source: SIMULATION_SOURCE,
      },
      banners: bannersForDay(localDate, redDemo),
      redDemo,
    } satisfies SimulationDay;
  });
  return {
    source: SIMULATION_SOURCE,
    intro: SIMULATION_INTRO,
    monday,
    days,
  };
}
