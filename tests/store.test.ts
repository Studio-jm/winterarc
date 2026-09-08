import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { getDb, resetDbCache } from "../lib/db/index.ts";
import { parseHealthXml } from "../lib/import/health.ts";
import { buildSampleHealthXml } from "../lib/import/sample.ts";
import {
  insertActivities,
  insertSleeps,
  loadSaisie,
  upsertSaisie,
} from "../lib/store.ts";

describe("saisie + import persistence", () => {
  let dir: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "wa-"));
    process.env.WINTERARC_SQLITE_PATH = join(dir, "t.db");
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    await resetDbCache();
    await getDb();
  });

  afterEach(async () => {
    await resetDbCache();
  });

  it("one saisie row per Europe/Paris day, source=manual", async () => {
    await upsertSaisie({
      localDate: "2026-09-08",
      rpe: 4,
      sleepHours: 6.5,
      pain: 1,
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
      coldCalves: true,
      notes: null,
    });
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
      coldCalves: true,
      notes: "update",
    });
    const db = await getDb();
    const rows = await db.all<{ n: number }>(`SELECT COUNT(*) AS n FROM saisie`);
    assert.equal(Number(rows[0].n), 1);
    const row = await loadSaisie("2026-09-08");
    assert.equal(row?.source, "manual");
    assert.equal(row?.rpe, 6);
    assert.equal(row?.notes, "update");
  });

  it("must not overwrite imports on unique (source, import_key)", async () => {
    const parsed = await parseHealthXml(buildSampleHealthXml("2026-09-07"));
    const first = await insertActivities(parsed.workouts);
    const second = await insertActivities(parsed.workouts);
    assert.ok(first.inserted >= 1);
    assert.equal(second.inserted, 0);
    assert.ok(second.skipped >= 1);
    const sleeps1 = await insertSleeps(parsed.sleeps);
    const sleeps2 = await insertSleeps(parsed.sleeps);
    assert.ok(sleeps1.inserted >= 1);
    assert.equal(sleeps2.inserted, 0);
    const db = await getDb();
    const acts = await db.all(`SELECT source FROM activities`);
    assert.ok(acts.every((a) => (a as { source: string }).source !== "manual"));
  });

  it("uses sqlite when TURSO_* unset", async () => {
    const { tursoConfigured } = await import("../lib/db/index.ts");
    assert.equal(tursoConfigured(), false);
  });
});
