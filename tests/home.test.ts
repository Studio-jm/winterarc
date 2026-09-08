import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { sessionFlagsOnCard } from "../lib/home/sessionFlags.ts";
import { loadHome } from "../lib/home/today.ts";
import { getDb, resetDbCache } from "../lib/db/index.ts";
import { evaluateRules, type DaySignals } from "../lib/rules/engine.ts";
import { upsertPlannedDay, upsertSaisie } from "../lib/store.ts";

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

describe("session flags on the home card", () => {
  it("R5/R6 are red pas cette course; R8 calm facultatif OFF; R1 stays off the card", () => {
    const r5 = sessionFlagsOnCard(evaluateRules(signals({ gait: true })).banners);
    assert.ok(r5.some((b) => b.ruleId === "R5" && b.tone === "red" && b.title === "Pas cette course"));
    assert.ok(!r5.some((b) => b.ruleId === "R1"));

    const r6 = sessionFlagsOnCard(evaluateRules(signals({ swelling: true })).banners);
    assert.ok(r6.some((b) => b.ruleId === "R6" && b.tone === "red" && b.title === "Pas cette course"));

    const r8 = sessionFlagsOnCard(evaluateRules(signals({ sleepHours: 6.5 })).banners);
    const flag = r8.find((b) => b.ruleId === "R8");
    assert.equal(flag?.tone, "calm");
    assert.notEqual(flag?.tone, "red");
    assert.equal(flag?.title, "Facultatif OFF");
  });
});

describe("loadHome live aujourd'hui", () => {
  let dir: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "wa-home-"));
    process.env.WINTERARC_SQLITE_PATH = join(dir, "t.db");
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    await resetDbCache();
    await getDb();
  });

  afterEach(async () => {
    await resetDbCache();
  });

  it("hero is Tuesday EF 45 min from the Campus Coach mirror, without writing planned_days", async () => {
    const home = await loadHome("2026-09-08");
    assert.equal(home.session.type, "EF");
    assert.equal(home.session.duration, "45 min");
    assert.equal(home.displayText, "EF 45 min");
    assert.equal(home.fromMirror, true);
    const db = await getDb();
    const n = await db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM planned_days`);
    assert.equal(Number(n?.n ?? 0), 0);
  });

  it("7-day strip is the current week until Lille, display only", async () => {
    const home = await loadHome("2026-09-08");
    assert.equal(home.week.length, 7);
    assert.equal(home.week[0].localDate, "2026-09-07");
    assert.equal(home.week[1].session.type, "EF");
    assert.equal(home.week[2].session.type, "Tempo / fractionné");
    assert.equal(home.week[2].session.pace, "allure marathon");
    assert.equal(home.week[4].session.duration, "45 min");
    assert.equal(home.week[5].session.type, "Sortie longue");
    assert.equal(home.week[0].session.type, "Repos / force");
    assert.equal(home.week[3].session.type, "Repos / force");
    assert.equal(home.week[6].session.type, "Repos / force");
    assert.equal(home.week[1].isToday, true);
  });

  it("paste overrides the mirror and is kept verbatim; flags do not rewrite it", async () => {
    const pasted = "Seuil 8x400 récup 200 — ne pas réécrire";
    await upsertPlannedDay("2026-09-08", pasted);
    await upsertSaisie({
      localDate: "2026-09-08",
      rpe: 4,
      sleepHours: 6.5,
      pain: 3,
      painZone: "tibia",
      gait: true,
      risingPain: false,
      pain24h: false,
      nightPain: false,
      swelling: true,
      focalTibial: true,
      fever: false,
      chest: false,
      limp: false,
      coldCalves: false,
      notes: null,
    });
    const home = await loadHome("2026-09-08");
    assert.equal(home.displayText, pasted);
    assert.equal(home.storedText, pasted);
    assert.equal(home.fromMirror, false);
    assert.ok(home.sessionFlags.some((b) => b.ruleId === "R5" && b.tone === "red"));
    assert.ok(home.sessionFlags.some((b) => b.ruleId === "R6" && b.tone === "red"));
    assert.ok(home.sessionFlags.some((b) => b.ruleId === "R8" && b.tone === "calm"));
    assert.ok(!home.sessionFlags.some((b) => b.ruleId === "R1"));
  });

  it("does not invent an Ironman plan or a second run plan", async () => {
    const home = await loadHome("2026-09-08");
    const blob = JSON.stringify(home.week);
    assert.doesNotMatch(blob, /ironman|triathlon|vélo|natation|swim|bike/i);
    assert.doesNotMatch(blob, /génération|llm|openai/i);
  });
});
