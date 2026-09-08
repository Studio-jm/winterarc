import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseGpx } from "../lib/import/gpx.ts";
import { MAX_TRACK_POINTS } from "../lib/time.ts";

describe("GPX import", () => {
  it("reads distance, duration, source=gpx", () => {
    const xml = readFileSync(new URL("../public/fixtures/sample.gpx", import.meta.url));
    const activity = parseGpx(xml);
    assert.equal(activity.source, "gpx");
    assert.ok((activity.distanceM ?? 0) > 100);
    assert.ok((activity.durationS ?? 0) > 60);
    assert.ok(activity.trackPoints.length >= 2);
    assert.ok(activity.trackPoints.length <= MAX_TRACK_POINTS);
    assert.match(activity.importKey, /^gpx:/);
  });

  it("caps track points around 250", () => {
    const pts = Array.from({ length: 800 }, (_, i) => {
      const lat = 48.8 + i * 0.0001;
      const lon = 2.3 + i * 0.0001;
      const t = new Date(Date.UTC(2026, 8, 7, 6, 0, 0) + i * 1000).toISOString();
      return `<trkpt lat="${lat}" lon="${lon}"><time>${t}</time></trkpt>`;
    }).join("");
    const xml = `<?xml version="1.0"?><gpx><trk><name>long</name><trkseg>${pts}</trkseg></trk></gpx>`;
    const activity = parseGpx(xml);
    assert.equal(activity.trackPoints.length, MAX_TRACK_POINTS);
    assert.equal(activity.source, "gpx");
  });
});
