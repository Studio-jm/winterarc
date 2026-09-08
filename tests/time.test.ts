import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parisDate, capPoints } from "../lib/time.ts";

describe("Europe/Paris dates", () => {
  it("formats YYYY-MM-DD in Paris", () => {
    const d = parisDate("2026-09-07T22:30:00Z");
    assert.equal(d, "2026-09-08");
  });

  it("caps points evenly including ends", () => {
    const pts = Array.from({ length: 1000 }, (_, i) => i);
    const capped = capPoints(pts, 250);
    assert.equal(capped.length, 250);
    assert.equal(capped[0], 0);
    assert.equal(capped[249], 999);
  });
});
