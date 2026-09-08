import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { getDb, resetDbCache } from "../lib/db/index.ts";
import { facultatifFromEvaluation } from "../lib/semaine/lever.ts";
import { nutritionCible, plannedHasVolume, QUIET_DAY_KCAL, VOLUME_DAY_KCAL } from "../lib/semaine/nutrition.ts";
import { loadSemaine, SEMAINE_INTRO } from "../lib/semaine/week.ts";
import { evaluateRules, type DaySignals } from "../lib/rules/engine.ts";
import { addRepas, insertActivities, insertSleeps, upsertPlannedDay, upsertSaisie } from "../lib/store.ts";

function signals(over: Partial<DaySignals> = {}): DaySignals {
  return {
    localDate: "2026-09-08",
    sleepHours: 8,
    rpe: 5,
    pain: 0,
    painZone: null,
    gait: false,
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
    ...over,
  };
}

describe("semaine nutrition cible", () => {
  it("quiet day is ~2200 kcal cible, not a meal plan", () => {
    assert.equal(plannedHasVolume(""), false);
    assert.equal(plannedHasVolume("repos"), false);
    const c = nutritionCible("");
    assert.equal(c.kcal, QUIET_DAY_KCAL);
    assert.equal(c.kind, "quiet");
    assert.match(c.line, /cible/);
    assert.match(c.line, /2200/);
    assert.doesNotMatch(c.line, /petit-déj|déjeuner|dîner/i);
  });

  it("volume from pasted text raises energy, without rewriting the text", () => {
    const pasted = "Campus Coach — sortie longue 18 km allure facile";
    assert.equal(plannedHasVolume(pasted), true);
    const c = nutritionCible(pasted);
    assert.equal(c.kcal, VOLUME_DAY_KCAL);
    assert.equal(c.kind, "volume");
    assert.match(c.line, /cible/);
    assert.match(c.line, /glucides|énergie/);
    assert.equal(pasted, "Campus Coach — sortie longue 18 km allure facile");
  });
});

describe("semaine lever facultatif", () => {
  it("defaults optional ON without garde flags", () => {
    const state = facultatifFromEvaluation(evaluateRules(signals({ sleepHours: 8 })));
    assert.equal(state.on, true);
    assert.equal(state.off, false);
    assert.equal(state.tone, null);
    assert.match(state.label, /Raptor|extras/i);
    assert.match(state.label, /ON/);
  });

  it("R8 sleep ceiling → facultatif OFF, calm, never red", () => {
    const state = facultatifFromEvaluation(evaluateRules(signals({ sleepHours: 6.5 })));
    assert.equal(state.off, true);
    assert.equal(state.tone, "calm");
    assert.ok(state.rules.includes("R8"));
    assert.equal(state.label, "Facultatif OFF");
  });

  it("R5/R6 → facultatif OFF, red only", () => {
    const r5 = facultatifFromEvaluation(evaluateRules(signals({ gait: true, sleepHours: 8 })));
    assert.equal(r5.off, true);
    assert.equal(r5.tone, "red");
    assert.ok(r5.rules.includes("R5"));

    const r6 = facultatifFromEvaluation(evaluateRules(signals({ swelling: true, sleepHours: 8 })));
    assert.equal(r6.off, true);
    assert.equal(r6.tone, "red");
    assert.ok(r6.rules.includes("R6"));
  });
});

describe("loadSemaine réel", () => {
  let dir: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "wa-sem-"));
    process.env.WINTERARC_SQLITE_PATH = join(dir, "t.db");
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    await resetDbCache();
    await getDb();
  });

  afterEach(async () => {
    await resetDbCache();
  });

  it("is the current Europe/Paris Monday–Sunday week", async () => {
    const week = await loadSemaine("2026-09-10");
    assert.equal(week.monday, "2026-09-07");
    assert.equal(week.sunday, "2026-09-13");
    assert.equal(week.days.length, 7);
    assert.equal(week.days[0].weekday, "lundi");
    assert.equal(week.days[3].isToday, true);
    assert.match(week.intro, /Campus Coach/);
    assert.match(SEMAINE_INTRO, /jamais rattrapée/);
  });

  it("stores Campus Coach paste as planned text, never rewritten", async () => {
    const pasted = "EF 45' + 6x200 récup 200 — collé tel quel";
    await upsertPlannedDay("2026-09-08", pasted);
    const week = await loadSemaine("2026-09-08");
    const tue = week.days.find((d) => d.localDate === "2026-09-08");
    assert.equal(tue?.prevu.campusCoachText, pasted);
  });

  it("fait is empty when nothing is logged — no fake data", async () => {
    const week = await loadSemaine("2026-09-08");
    for (const day of week.days) {
      assert.equal(day.fait.empty, true);
      assert.equal(day.fait.sessions.length, 0);
      assert.equal(day.fait.mealsCount, 0);
      assert.equal(day.fait.rpe, null);
      assert.equal(day.fait.sleepHours, null);
      assert.equal(day.fait.pain, null);
      assert.equal(day.lever.visible, false);
      assert.equal(day.prevu.optional.on, true);
    }
  });

  it("reads existing saisie / repas / activities", async () => {
    await upsertSaisie({
      localDate: "2026-09-08",
      rpe: 6,
      sleepHours: 6.5,
      pain: 2,
      painZone: "mollet",
      gait: false,
      risingPain: false,
      pain24h: false,
      nightPain: false,
      swelling: false,
      focalTibial: false,
      fever: false,
      chest: false,
      limp: false,
      coldCalves: false,
      notes: null,
    });
    await addRepas("2026-09-08", "porridge", null);
    await insertActivities([
      {
        source: "gpx",
        importKey: "run-1",
        sport: "run",
        startedAt: "2026-09-08T06:00:00Z",
        endedAt: "2026-09-08T07:00:00Z",
        durationS: 3600,
        distanceM: 10000,
        localDate: "2026-09-08",
        trackPoints: [],
      },
    ]);
    await insertSleeps([
      {
        source: "apple_health",
        importKey: "sleep-1",
        startedAt: "2026-09-07T22:00:00Z",
        endedAt: "2026-09-08T04:30:00Z",
        stage: "asleep",
        durationS: 6.5 * 3600,
        localDate: "2026-09-08",
      },
    ]);

    const week = await loadSemaine("2026-09-08");
    const tue = week.days.find((d) => d.localDate === "2026-09-08");
    assert.equal(tue?.fait.empty, false);
    assert.equal(tue?.fait.rpe, 6);
    assert.equal(tue?.fait.pain, 2);
    assert.equal(tue?.fait.painZone, "mollet");
    assert.equal(tue?.fait.sessions.length, 1);
    assert.equal(tue?.fait.sessions[0].sport, "run");
    assert.equal(tue?.fait.mealsCount, 1);
    assert.ok((tue?.fait.sleepHours ?? 0) > 6);
    assert.equal(tue?.lever.visible, true);
    assert.equal(tue?.lever.facultatif.tone, "calm");
    assert.equal(tue?.prevu.campusCoachText, "");
  });

  it("does not auto-make-up a missed session on another day", async () => {
    await upsertPlannedDay("2026-09-07", "EF 50 min Campus Coach");
    await insertActivities([
      {
        source: "fit",
        importKey: "wed-run",
        sport: "run",
        startedAt: "2026-09-09T06:00:00Z",
        endedAt: "2026-09-09T07:00:00Z",
        durationS: 3600,
        distanceM: 9000,
        localDate: "2026-09-09",
        trackPoints: [],
      },
    ]);
    const week = await loadSemaine("2026-09-08");
    const mon = week.days.find((d) => d.localDate === "2026-09-07");
    const wed = week.days.find((d) => d.localDate === "2026-09-09");
    assert.equal(mon?.prevu.campusCoachText, "EF 50 min Campus Coach");
    assert.equal(mon?.fait.sessions.length, 0);
    assert.equal(wed?.prevu.campusCoachText, "");
    assert.equal(wed?.fait.sessions.length, 1);
    assert.notEqual(wed?.fait.sessions[0]?.sport, mon?.prevu.campusCoachText);
  });

  it("R5/R6 turn facultatif OFF without changing Campus Coach text", async () => {
    const pasted = "Seuil 5x4' récup 2' — ne pas réécrire";
    await upsertPlannedDay("2026-09-08", pasted);
    await upsertSaisie({
      localDate: "2026-09-08",
      rpe: 4,
      sleepHours: 8,
      pain: 3,
      painZone: "tibia",
      gait: true,
      risingPain: true,
      pain24h: false,
      nightPain: false,
      swelling: false,
      focalTibial: true,
      fever: false,
      chest: false,
      limp: false,
      coldCalves: false,
      notes: null,
    });
    const week = await loadSemaine("2026-09-08");
    const tue = week.days.find((d) => d.localDate === "2026-09-08");
    assert.equal(tue?.prevu.campusCoachText, pasted);
    assert.equal(tue?.lever.visible, true);
    assert.equal(tue?.lever.facultatif.tone, "red");
    assert.ok(tue?.lever.facultatif.rules.includes("R5"));
    assert.ok(tue?.lever.facultatif.rules.includes("R6"));
    assert.equal(tue?.prevu.optional.on, false);
  });
});
