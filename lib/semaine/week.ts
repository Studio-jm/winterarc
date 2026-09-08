import {
  displayCampusCoachText,
  isCampusCoachMirror,
  parseCampusCoachFields,
  type SessionFields,
} from "../campusCoach/week";
import { getDb } from "../db";
import { evaluateRules, type Evaluation } from "../rules";
import {
  type ActivityRow,
  type RepasRow,
  type SaisieRow,
  type SleepRow,
  buildSignals,
  loadPlannedDays,
  loadSaisie,
} from "../store";
import { formatWeekdayFr, mondayOfParisWeek, parisDate, parisWeekDates } from "../time";
import { facultatifFromEvaluation, type FacultatifState } from "./lever";
import { nutritionCible, type NutritionCible } from "./nutrition";

export const SEMAINE_INTRO =
  "Jusqu'à Lille, la ligne course est le texte Campus Coach collé — pas un plan écrit par l'app. Une séance manquée n'est jamais rattrapée automatiquement.";

export type FaitSession = {
  id: number;
  sport: string | null;
  source: string;
  distanceM: number | null;
  durationS: number | null;
};

export type SemaineFait = {
  empty: boolean;
  meals: RepasRow[];
  mealsKcal: number;
  mealsCount: number;
  sessions: FaitSession[];
  sleepHours: number | null;
  sleepSource: "import" | "saisie" | null;
  pain: number | null;
  painZone: string | null;
  rpe: number | null;
  saisie: SaisieRow | null;
};

export type SemainePrevu = {
  campusCoachText: string;
  displayText: string;
  fromMirror: boolean;
  session: SessionFields;
  optional: FacultatifState;
  nutrition: NutritionCible;
};

export type SemaineLever = {
  visible: boolean;
  facultatif: FacultatifState;
};

export type SemaineDay = {
  localDate: string;
  weekday: string;
  isToday: boolean;
  prevu: SemainePrevu;
  fait: SemaineFait;
  lever: SemaineLever;
};

export type SemaineWeek = {
  localDate: string;
  monday: string;
  sunday: string;
  intro: string;
  days: SemaineDay[];
};

function hoursFromSleeps(rows: SleepRow[]): number | null {
  if (!rows.length) return null;
  const total = rows.reduce((s, r) => s + r.duration_s, 0);
  if (total <= 0) return null;
  return total / 3600;
}

function groupByDate<T extends { local_date: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.local_date) ?? [];
    list.push(row);
    map.set(row.local_date, list);
  }
  return map;
}

function toFait(
  saisie: SaisieRow | null,
  meals: RepasRow[],
  activities: ActivityRow[],
  sleepHours: number | null,
  sleepSource: "import" | "saisie" | null,
): SemaineFait {
  const sessions: FaitSession[] = activities.map((a) => ({
    id: a.id,
    sport: a.sport,
    source: a.source,
    distanceM: a.distance_m,
    durationS: a.duration_s,
  }));
  const empty =
    saisie == null && meals.length === 0 && sessions.length === 0 && sleepHours == null;
  return {
    empty,
    meals,
    mealsKcal: meals.reduce((s, m) => s + m.kcal, 0),
    mealsCount: meals.length,
    sessions,
    sleepHours,
    sleepSource,
    pain: saisie?.pain ?? null,
    painZone: saisie?.pain_zone ?? null,
    rpe: saisie?.rpe ?? null,
    saisie,
  };
}

export async function loadSemaine(anchor = parisDate()): Promise<SemaineWeek> {
  const db = await getDb();
  const dates = parisWeekDates(anchor);
  const monday = mondayOfParisWeek(anchor);
  const sunday = dates[6];
  const planned = await loadPlannedDays(dates, db);

  const meals = await db.all<RepasRow>(
    `SELECT * FROM repas WHERE local_date >= ? AND local_date <= ? ORDER BY id ASC`,
    [monday, sunday],
  );
  const activities = await db.all<ActivityRow>(
    `SELECT * FROM activities WHERE local_date >= ? AND local_date <= ? ORDER BY started_at ASC`,
    [monday, sunday],
  );
  const sleeps = await db.all<SleepRow>(
    `SELECT * FROM sleep_intervals WHERE local_date >= ? AND local_date <= ? ORDER BY started_at ASC`,
    [monday, sunday],
  );

  const mealsByDate = groupByDate(meals);
  const activitiesByDate = groupByDate(activities);
  const sleepsByDate = groupByDate(sleeps);

  const days: SemaineDay[] = [];
  for (const localDate of dates) {
    const campusCoachText = planned.get(localDate)?.campus_coach_text ?? "";
    const displayText = displayCampusCoachText(localDate, campusCoachText);
    const saisie = (await loadSaisie(localDate, db)) ?? null;
    const imported = hoursFromSleeps(sleepsByDate.get(localDate) ?? []);
    const sleepHours = imported ?? saisie?.sleep_hours ?? null;
    const sleepSource: "import" | "saisie" | null =
      imported != null ? "import" : saisie ? "saisie" : null;

    let evaluation: Evaluation | null = null;
    const hasSignals = saisie != null || imported != null;
    if (hasSignals) {
      const signals = await buildSignals(localDate, db);
      evaluation = evaluateRules(signals);
    }

    const facultatif = facultatifFromEvaluation(evaluation);
    days.push({
      localDate,
      weekday: formatWeekdayFr(localDate),
      isToday: localDate === anchor,
      prevu: {
        campusCoachText,
        displayText,
        fromMirror: isCampusCoachMirror(campusCoachText),
        session: parseCampusCoachFields(displayText),
        optional: facultatif,
        nutrition: nutritionCible(displayText),
      },
      fait: toFait(
        saisie,
        mealsByDate.get(localDate) ?? [],
        activitiesByDate.get(localDate) ?? [],
        sleepHours,
        sleepSource,
      ),
      lever: {
        visible: facultatif.off,
        facultatif,
      },
    });
  }

  return {
    localDate: anchor,
    monday,
    sunday,
    intro: SEMAINE_INTRO,
    days,
  };
}
