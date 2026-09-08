import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { RULE_CATALOG } from "../lib/rules/catalog.ts";
import { evaluateRules, type DaySignals } from "../lib/rules/engine.ts";
import { RULES_VERSION } from "../lib/time.ts";

function base(over: Partial<DaySignals> = {}): DaySignals {
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

function fired(evalResult: ReturnType<typeof evaluateRules>, id: string) {
  return evalResult.actions.find((a) => a.ruleId === id);
}

describe("rules_version 0.1", () => {
  it("exposes 0.1 and a ~15 KB catalog", () => {
    assert.equal(RULES_VERSION, "0.1");
    const bytes = readFileSync(new URL("../lib/rules/catalog.ts", import.meta.url)).byteLength;
    assert.ok(bytes >= 12_000, `catalog ${bytes} bytes, expected ~15 KB`);
    assert.ok(bytes <= 20_000, `catalog ${bytes} bytes, expected ~15 KB`);
    assert.equal(evaluateRules(base()).rulesVersion, "0.1");
    assert.ok(RULE_CATALOG.some((r) => r.status === "stub"));
  });

  it("R1 protects Campus Coach until 2026-10-25", () => {
    const on = evaluateRules(base({ localDate: "2026-10-25" }));
    const r1 = fired(on, "R1");
    assert.ok(r1);
    assert.equal(r1?.action, "protect_campus_coach");
    assert.equal(r1?.severity, "info");
    const after = evaluateRules(base({ localDate: "2026-10-26" }));
    assert.equal(fired(after, "R1"), undefined);
    assert.ok(after.traces.find((t) => t.ruleId === "R1" && !t.fired));
  });

  it("R5 gait/rising/24h → no_progression red", () => {
    for (const over of [{ gait: true }, { limp: true }, { risingPain: true }, { pain24h: true }] as Partial<DaySignals>[]) {
      const ev = evaluateRules(base(over));
      const r5 = fired(ev, "R5");
      assert.equal(r5?.action, "no_progression");
      assert.equal(r5?.severity, "red");
      assert.ok(ev.banners.some((b) => b.ruleId === "R5" && b.tone === "red"));
    }
  });

  it("R6 focal tibial / night / swelling → stop_run_human_review red only", () => {
    for (const over of [
      { focalTibial: true },
      { painZone: "tibia gauche" },
      { nightPain: true },
      { swelling: true },
    ] as Partial<DaySignals>[]) {
      const ev = evaluateRules(base(over));
      const r6 = fired(ev, "R6");
      assert.equal(r6?.action, "stop_run_human_review");
      assert.equal(r6?.severity, "red");
      assert.ok(ev.banners.some((b) => b.ruleId === "R6" && b.tone === "red"));
    }
  });

  it("R8 sleep <7h / 6.5 ceiling → drop_optional_load calm never red", () => {
    const ev = evaluateRules(base({ sleepHours: 6.5 }));
    const r8 = fired(ev, "R8");
    assert.equal(r8?.action, "drop_optional_load");
    assert.equal(r8?.severity, "calm");
    const banner = ev.banners.find((b) => b.ruleId === "R8");
    assert.equal(banner?.tone, "calm");
    assert.notEqual(banner?.tone, "red");
    const ok = evaluateRules(base({ sleepHours: 7 }));
    assert.equal(fired(ok, "R8"), undefined);
  });

  it("R8 stays calm even when R5 is red", () => {
    const ev = evaluateRules(base({ sleepHours: 6.2, gait: true }));
    assert.equal(fired(ev, "R5")?.severity, "red");
    assert.equal(fired(ev, "R8")?.severity, "calm");
    assert.equal(ev.banners.find((b) => b.ruleId === "R8")?.tone, "calm");
  });

  it("R7 two consecutive alerts → human_review", () => {
    const ev = evaluateRules(base({ pain24h: true, hadAlertYesterday: true }));
    assert.equal(fired(ev, "R7")?.action, "human_review");
    const sleepOnly = evaluateRules(base({ sleepHours: 6, hadAlertYesterday: true }));
    assert.equal(fired(sleepOnly, "R7"), undefined, "R8 is not an alert");
  });

  it("R10 fever/chest → no_training stop not red", () => {
    const ev = evaluateRules(base({ fever: true }));
    assert.equal(fired(ev, "R10")?.action, "no_training");
    assert.equal(ev.banners.find((b) => b.ruleId === "R10")?.tone, "stop");
  });

  it("habitual cold calves without limp: note, no red", () => {
    const ev = evaluateRules(base({ coldCalves: true }));
    const r11 = fired(ev, "R11");
    assert.equal(r11?.action, "note");
    assert.equal(r11?.severity, "note");
    assert.ok(!ev.banners.some((b) => b.tone === "red"));
    const withLimp = evaluateRules(base({ coldCalves: true, limp: true }));
    assert.equal(fired(withLimp, "R11"), undefined);
    assert.equal(fired(withLimp, "R5")?.severity, "red");
  });

  it("stubs leave a standing trace", () => {
    const ev = evaluateRules(base());
    for (const id of ["R2", "R3", "R4", "R9", "R12", "R13", "R14", "R15"]) {
      const t = ev.traces.find((x) => x.ruleId === id);
      assert.ok(t, id);
      assert.equal(t?.fired, false);
      assert.equal(t?.action, "standing");
      assert.match(t?.reason ?? "", /stub|standing/i);
    }
  });
});
