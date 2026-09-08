import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseHealthXml } from "../lib/import/health.ts";
import { buildSampleHealthXml } from "../lib/import/sample.ts";

describe("Apple Health SAX import", () => {
  it("parses workouts + asleep intervals from the fixture, ignores in-bed/awake", async () => {
    const xml = readFileSync(new URL("../public/fixtures/export.sample.xml", import.meta.url), "utf8");
    const parsed = await parseHealthXml(xml);
    assert.equal(parsed.workouts.length, 2);
    assert.equal(parsed.workouts[0].source, "apple_health");
    assert.equal(parsed.workouts[0].sport, "running");
    assert.ok((parsed.workouts[0].distanceM ?? 0) > 6000);
    assert.ok((parsed.workouts[0].durationS ?? 0) > 30 * 60);
    assert.equal(parsed.workouts[0].localDate, "2026-09-07");
    assert.equal(parsed.sleeps.length, 4);
    assert.ok(parsed.sleeps.every((s) => s.source === "apple_health"));
    assert.ok(parsed.sleeps.every((s) => /asleep/i.test(s.stage)));
    const hours = parsed.sleeps.reduce((s, x) => s + x.durationS, 0) / 3600;
    assert.ok(hours > 5 && hours < 7);
  });

  it("streams chunks and stamps example XML on an anchor day", async () => {
    const xml = buildSampleHealthXml("2026-03-01");
    const parsed = await parseHealthXml(xml);
    assert.ok(parsed.workouts.some((w) => w.localDate === "2026-03-01"));
    assert.ok(parsed.sleeps.some((s) => s.localDate === "2026-03-01"));
  });
});
