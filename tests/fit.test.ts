import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseFit } from "../lib/import/fit.ts";
import { MAX_TRACK_POINTS } from "../lib/time.ts";

describe("FIT import", () => {
  it("reads distance, duration, source=fit from fixture", () => {
    const bytes = readFileSync(new URL("../public/fixtures/sample.fit", import.meta.url));
    const activity = parseFit(bytes);
    assert.equal(activity.source, "fit");
    assert.ok((activity.distanceM ?? 0) > 500);
    assert.ok((activity.durationS ?? 0) > 60);
    assert.ok(activity.trackPoints.length >= 1);
    assert.ok(activity.trackPoints.length <= MAX_TRACK_POINTS);
    assert.match(activity.importKey, /^fit:/);
  });
});
