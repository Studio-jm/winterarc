import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parisDate, capPoints, mondayOfParisWeek, parisWeekDates, formatWeekdayFr } from "../lib/time.ts";

describe("Europe/Paris dates", () => {
  it("formats YYYY-MM-DD in Paris", () => {
    const d = parisDate("2026-09-07T22:30:00Z");
    assert.equal(d, "2026-09-08");
  });

  it("mondayOfParisWeek is Monday–Sunday civil dates", () => {
    assert.equal(mondayOfParisWeek("2026-09-08"), "2026-09-07");
    assert.deepEqual(parisWeekDates("2026-09-09"), [
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
    ]);
    assert.equal(formatWeekdayFr("2026-09-07"), "lundi");
  });

  it("caps points evenly including ends", () => {
    const pts = Array.from({ length: 1000 }, (_, i) => i);
    const capped = capPoints(pts, 250);
    assert.equal(capped.length, 250);
    assert.equal(capped[0], 0);
    assert.equal(capped[249], 999);
  });
});
