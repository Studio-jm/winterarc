import { getDb, type DbClient } from "./db";
import { estimateMeal } from "./meals/estimate";
import { evaluateRules, isAlertAction, type DaySignals, type Evaluation } from "./rules";
import { addDays, parisDate } from "./time";
import type { ParsedActivity, ParsedSleep, SaisieInput } from "./types";

export type ActivityRow = {
  id: number;
  source: string;
  import_key: string;
  sport: string | null;
  started_at: string;
  ended_at: string | null;
  duration_s: number | null;
  distance_m: number | null;
  local_date: string;
};

export type SleepRow = {
  id: number;
  source: string;
  started_at: string;
  ended_at: string;
  stage: string | null;
  duration_s: number;
  local_date: string;
};

export type SaisieRow = {
  local_date: string;
  source: string;
  rpe: number;
  sleep_hours: number;
  pain: number;
  pain_zone: string | null;
  gait: number;
  rising_pain: number;
  pain_24h: number;
  night_pain: number;
  swelling: number;
  focal_tibial: number;
  fever: number;
  chest: number;
  limp: number;
  cold_calves: number;
  notes: string | null;
};

export type RepasRow = {
  id: number;
  local_date: string;
  text: string;
  portion: string | null;
  kcal: number;
  estimate: string;
  matched: string | null;
};

export type FlagRow = { key: string; value: string | null; source: string | null };

function bool(v: boolean | number | null | undefined): boolean {
  return Boolean(v);
}

export async function insertActivities(
  activities: ParsedActivity[],
  db?: DbClient,
): Promise<{ inserted: number; skipped: number }> {
  const client = db ?? (await getDb());
  let inserted = 0;
  let skipped = 0;
  for (const a of activities) {
    const result = await client.run(
      `INSERT OR IGNORE INTO activities
        (source, import_key, sport, started_at, ended_at, duration_s, distance_m, local_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.source, a.importKey, a.sport, a.startedAt, a.endedAt, a.durationS, a.distanceM, a.localDate],
    );
    if (result.changes === 0) {
      skipped += 1;
      continue;
    }
    inserted += 1;
    const row = await client.get<{ id: number }>(
      `SELECT id FROM activities WHERE source = ? AND import_key = ?`,
      [a.source, a.importKey],
    );
    if (!row) continue;
    for (const p of a.trackPoints) {
      await client.run(
        `INSERT INTO track_points (activity_id, seq, lat, lon, ele, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [row.id, p.seq, p.lat, p.lon, p.ele, p.recordedAt],
      );
    }
  }
  return { inserted, skipped };
}

export async function insertSleeps(
  sleeps: ParsedSleep[],
  db?: DbClient,
): Promise<{ inserted: number; skipped: number }> {
  const client = db ?? (await getDb());
  let inserted = 0;
  let skipped = 0;
  for (const s of sleeps) {
    const result = await client.run(
      `INSERT OR IGNORE INTO sleep_intervals
        (source, import_key, started_at, ended_at, stage, duration_s, local_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.source, s.importKey, s.startedAt, s.endedAt, s.stage, s.durationS, s.localDate],
    );
    if (result.changes === 0) skipped += 1;
    else inserted += 1;
  }
  return { inserted, skipped };
}

export async function upsertSaisie(input: SaisieInput, db?: DbClient): Promise<void> {
  const client = db ?? (await getDb());
  await client.run(
    `INSERT INTO saisie (
       local_date, source, rpe, sleep_hours, pain, pain_zone,
       gait, rising_pain, pain_24h, night_pain, swelling, focal_tibial,
       fever, chest, limp, cold_calves, notes, created_at, updated_at
     ) VALUES (?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(local_date) DO UPDATE SET
       rpe = excluded.rpe,
       sleep_hours = excluded.sleep_hours,
       pain = excluded.pain,
       pain_zone = excluded.pain_zone,
       gait = excluded.gait,
       rising_pain = excluded.rising_pain,
       pain_24h = excluded.pain_24h,
       night_pain = excluded.night_pain,
       swelling = excluded.swelling,
       focal_tibial = excluded.focal_tibial,
       fever = excluded.fever,
       chest = excluded.chest,
       limp = excluded.limp,
       cold_calves = excluded.cold_calves,
       notes = excluded.notes,
       source = 'manual',
       updated_at = datetime('now')`,
    [
      input.localDate,
      input.rpe,
      input.sleepHours,
      input.pain,
      input.painZone,
      input.gait ? 1 : 0,
      input.risingPain ? 1 : 0,
      input.pain24h ? 1 : 0,
      input.nightPain ? 1 : 0,
      input.swelling ? 1 : 0,
      input.focalTibial ? 1 : 0,
      input.fever ? 1 : 0,
      input.chest ? 1 : 0,
      input.limp ? 1 : 0,
      input.coldCalves ? 1 : 0,
      input.notes,
    ],
  );

  const flags: Array<[string, string]> = [
    ["gait", String(input.gait)],
    ["rising_pain", String(input.risingPain)],
    ["pain_24h", String(input.pain24h)],
    ["night_pain", String(input.nightPain)],
    ["swelling", String(input.swelling)],
    ["focal_tibial", String(input.focalTibial)],
    ["fever", String(input.fever)],
    ["chest", String(input.chest)],
    ["limp", String(input.limp)],
    ["cold_calves", String(input.coldCalves)],
  ];
  for (const [key, value] of flags) {
    await client.run(
      `INSERT INTO flags (local_date, key, value, source) VALUES (?, ?, ?, 'manual')
       ON CONFLICT(local_date, key) DO UPDATE SET value = excluded.value, source = 'manual'`,
      [input.localDate, key, value],
    );
  }
}

export async function addRepas(
  localDate: string,
  text: string,
  portion: string | null,
  db?: DbClient,
): Promise<RepasRow> {
  const client = db ?? (await getDb());
  const est = estimateMeal(text, portion);
  const result = await client.run(
    `INSERT INTO repas (local_date, text, portion, kcal, estimate, matched)
     VALUES (?, ?, ?, ?, 'high', ?)`,
    [localDate, text, portion, est.kcal, est.matched.join(",")],
  );
  return {
    id: result.lastInsertRowid,
    local_date: localDate,
    text,
    portion,
    kcal: est.kcal,
    estimate: "high",
    matched: est.matched.join(","),
  };
}

export async function importedSleepHours(localDate: string, db?: DbClient): Promise<number | null> {
  const client = db ?? (await getDb());
  const row = await client.get<{ total: number | null }>(
    `SELECT SUM(duration_s) AS total FROM sleep_intervals WHERE local_date = ?`,
    [localDate],
  );
  if (row?.total == null || row.total <= 0) return null;
  return row.total / 3600;
}

export async function loadSaisie(localDate: string, db?: DbClient): Promise<SaisieRow | undefined> {
  const client = db ?? (await getDb());
  return client.get<SaisieRow>(`SELECT * FROM saisie WHERE local_date = ?`, [localDate]);
}

export async function dayHadAlert(localDate: string, db?: DbClient): Promise<boolean> {
  const client = db ?? (await getDb());
  const latest = await client.get<{ id: number }>(
    `SELECT id FROM rule_evaluations WHERE local_date = ? ORDER BY id DESC LIMIT 1`,
    [localDate],
  );
  if (!latest) return false;
  const rows = await client.all<{ action: string }>(
    `SELECT action FROM rule_actions WHERE evaluation_id = ?`,
    [latest.id],
  );
  return rows.some((r) => isAlertAction(r.action as never));
}

export async function buildSignals(localDate: string, db?: DbClient): Promise<DaySignals> {
  const client = db ?? (await getDb());
  const saisie = await loadSaisie(localDate, client);
  const imported = await importedSleepHours(localDate, client);
  const yesterday = addDays(localDate, -1);
  const hadAlertYesterday = await dayHadAlert(yesterday, client);
  return {
    localDate,
    sleepHours: imported ?? saisie?.sleep_hours ?? null,
    rpe: saisie?.rpe ?? null,
    pain: saisie?.pain ?? null,
    painZone: saisie?.pain_zone ?? null,
    gait: bool(saisie?.gait),
    risingPain: bool(saisie?.rising_pain),
    pain24h: bool(saisie?.pain_24h),
    nightPain: bool(saisie?.night_pain),
    swelling: bool(saisie?.swelling),
    focalTibial: bool(saisie?.focal_tibial),
    fever: bool(saisie?.fever),
    chest: bool(saisie?.chest),
    limp: bool(saisie?.limp),
    coldCalves: bool(saisie?.cold_calves),
    hadAlertYesterday,
  };
}

export async function persistEvaluation(evaluation: Evaluation, db?: DbClient): Promise<number> {
  const client = db ?? (await getDb());
  const result = await client.run(
    `INSERT INTO rule_evaluations (local_date, rules_version, result_json)
     VALUES (?, ?, ?)`,
    [evaluation.localDate, evaluation.rulesVersion, JSON.stringify(evaluation)],
  );
  const evaluationId = result.lastInsertRowid;
  for (const action of evaluation.actions) {
    await client.run(
      `INSERT INTO rule_actions (evaluation_id, local_date, rule_id, action, severity, message, trace_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        evaluationId,
        evaluation.localDate,
        action.ruleId,
        action.action,
        action.severity,
        action.message,
        JSON.stringify(action.trace),
      ],
    );
  }
  return evaluationId;
}

export async function evaluateAndStore(localDate: string, db?: DbClient): Promise<Evaluation> {
  const client = db ?? (await getDb());
  const signals = await buildSignals(localDate, client);
  const evaluation = evaluateRules(signals);
  await persistEvaluation(evaluation, client);
  return evaluation;
}

export type TodayPayload = {
  localDate: string;
  heading: string;
  sleepHours: number | null;
  sleepSource: "import" | "saisie" | null;
  rpe: number | null;
  pain: number | null;
  painZone: string | null;
  mealsKcal: number;
  mealsCount: number;
  meals: RepasRow[];
  activities: ActivityRow[];
  sleeps: SleepRow[];
  saisie: SaisieRow | null;
  evaluation: Evaluation;
};

export async function loadToday(localDate = parisDate()): Promise<TodayPayload> {
  const db = await getDb();
  const saisie = (await loadSaisie(localDate, db)) ?? null;
  const imported = await importedSleepHours(localDate, db);
  const meals = await db.all<RepasRow>(
    `SELECT * FROM repas WHERE local_date = ? ORDER BY id ASC`,
    [localDate],
  );
  const activities = await db.all<ActivityRow>(
    `SELECT * FROM activities WHERE local_date = ? ORDER BY started_at ASC`,
    [localDate],
  );
  const sleeps = await db.all<SleepRow>(
    `SELECT * FROM sleep_intervals WHERE local_date = ? ORDER BY started_at ASC`,
    [localDate],
  );
  const evaluation = await evaluateAndStore(localDate, db);
  const mealsKcal = meals.reduce((s, m) => s + m.kcal, 0);
  return {
    localDate,
    heading: localDate,
    sleepHours: imported ?? saisie?.sleep_hours ?? null,
    sleepSource: imported != null ? "import" : saisie ? "saisie" : null,
    rpe: saisie?.rpe ?? null,
    pain: saisie?.pain ?? null,
    painZone: saisie?.pain_zone ?? null,
    mealsKcal,
    mealsCount: meals.length,
    meals,
    activities,
    sleeps,
    saisie,
    evaluation,
  };
}
