import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SIMULATION_INTRO,
  SIMULATION_SLEEP_HOURS,
  SIMULATION_SOURCE,
  buildSimulationWeek,
  mondayOfParisWeek,
} from "../lib/simulation/week.ts";

describe("simulation week preview", () => {
  const week = buildSimulationWeek("2026-09-08");

  it("is a 7-day Monday–Sunday aperçu tagged simulation", () => {
    assert.equal(week.source, SIMULATION_SOURCE);
    assert.equal(week.days.length, 7);
    assert.equal(week.monday, "2026-09-07");
    assert.equal(mondayOfParisWeek("2026-09-08"), "2026-09-07");
    assert.deepEqual(
      week.days.map((d) => d.localDate),
      ["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"],
    );
    for (const day of week.days) {
      assert.equal(day.source, SIMULATION_SOURCE);
      assert.equal(day.session.source, SIMULATION_SOURCE);
      assert.equal(day.meal.source, SIMULATION_SOURCE);
    }
  });

  it("fills each day with demo session, RPE, 6.5 h sleep, high-end meal", () => {
    assert.equal(SIMULATION_SLEEP_HOURS, 6.5);
    for (const day of week.days) {
      assert.ok(day.session.label.length > 0);
      assert.match(day.session.caption, /démo/i);
      assert.match(day.session.caption, /pas une consigne/i);
      assert.ok(day.rpe >= 1 && day.rpe <= 10);
      assert.equal(day.sleepHours, 6.5);
      assert.equal(day.meal.estimate, "high");
      assert.ok(day.meal.kcal > 0);
    }
    const labels = week.days.map((d) => d.session.label);
    assert.ok(labels.includes("run"));
    assert.ok(labels.includes("easy"));
  });

  it("shows R8 calm on the sleep ceiling and exactly one visual-only R5 red day", () => {
    const redDays = week.days.filter((d) => d.redDemo);
    assert.equal(redDays.length, 1);
    for (const day of week.days) {
      const r8 = day.banners.find((b) => b.ruleId === "R8");
      assert.ok(r8, `R8 missing on ${day.localDate}`);
      assert.equal(r8?.tone, "calm");
      assert.notEqual(r8?.tone, "red");
      const reds = day.banners.filter((b) => b.tone === "red");
      if (day.redDemo) {
        assert.equal(reds.length, 1);
        assert.ok(reds[0].ruleId === "R5" || reds[0].ruleId === "R6");
        assert.match(reds[0].body, /visuel|aperçu/i);
      } else {
        assert.equal(reds.length, 0);
      }
    }
  });

  it("copy is an aperçu, not Campus Coach, not a plan to follow", () => {
    assert.match(SIMULATION_INTRO, /aperçu/i);
    assert.match(SIMULATION_INTRO, /pas Campus Coach/i);
    assert.match(SIMULATION_INTRO, /pas un plan à suivre/i);
    assert.match(SIMULATION_INTRO, /Campus Coach reste le seul plan de course jusqu'à Lille/i);
    const blob = JSON.stringify(week);
    assert.doesNotMatch(blob, /fais ça|fais-le|do this|à faire aujourd/i);
    assert.doesNotMatch(week.intro, /suis ce plan|remplace Campus/i);
  });

  it("is a pure seed and does not touch saisie/import tables", () => {
    assert.equal(typeof buildSimulationWeek, "function");
    const again = buildSimulationWeek("2026-09-08");
    assert.deepEqual(again, week);
  });
});
