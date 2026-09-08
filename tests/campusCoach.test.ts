import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CAMPUS_COACH_WEEK_MIRROR,
  campusCoachMirrorLine,
  displayCampusCoachText,
  isCampusCoachMirror,
  parseCampusCoachFields,
} from "../lib/campusCoach/week.ts";
import { addDays, mondayOfParisWeek } from "../lib/time.ts";

describe("Campus Coach week mirror", () => {
  it("mirrors Jessy's current week: EF / quality / EF / long, rest otherwise", () => {
    assert.equal(CAMPUS_COACH_WEEK_MIRROR.length, 7);
    assert.equal(CAMPUS_COACH_WEEK_MIRROR[0], "Repos / force");
    assert.equal(CAMPUS_COACH_WEEK_MIRROR[1], "EF 45 min");
    assert.equal(CAMPUS_COACH_WEEK_MIRROR[2], "Tempo / fractionné allure marathon");
    assert.equal(CAMPUS_COACH_WEEK_MIRROR[3], "Repos / force");
    assert.equal(CAMPUS_COACH_WEEK_MIRROR[4], "EF 45 min");
    assert.match(CAMPUS_COACH_WEEK_MIRROR[5], /sortie longue/i);
    assert.equal(CAMPUS_COACH_WEEK_MIRROR[6], "Repos / force");
  });

  it("is weekday-static until Lille — not auto-progression", () => {
    const monday = mondayOfParisWeek("2026-09-08");
    const nextMonday = addDays(monday, 7);
    for (let i = 0; i < 7; i++) {
      assert.equal(campusCoachMirrorLine(addDays(monday, i)), CAMPUS_COACH_WEEK_MIRROR[i]);
      assert.equal(campusCoachMirrorLine(addDays(nextMonday, i)), CAMPUS_COACH_WEEK_MIRROR[i]);
    }
    assert.equal(campusCoachMirrorLine("2026-10-26"), "");
  });

  it("uses stored paste as-is and never rewrites it", () => {
    const pasted = "EF 50' + 6x200 récup 200 — collé tel quel";
    assert.equal(displayCampusCoachText("2026-09-08", pasted), pasted);
    assert.equal(isCampusCoachMirror(pasted), false);
    assert.equal(isCampusCoachMirror(""), true);
    assert.equal(displayCampusCoachText("2026-09-08", ""), "EF 45 min");
  });
});

describe("parseCampusCoachFields", () => {
  it("reads type, duration, pace from EF 45 min", () => {
    const s = parseCampusCoachFields("EF 45 min");
    assert.equal(s.type, "EF");
    assert.equal(s.duration, "45 min");
    assert.equal(s.pace, null);
  });

  it("reads tempo / intervals at marathon pace", () => {
    const s = parseCampusCoachFields("Tempo / fractionné allure marathon");
    assert.equal(s.type, "Tempo / fractionné");
    assert.equal(s.duration, null);
    assert.equal(s.pace, "allure marathon");
  });

  it("does not invent fields on rest or long run", () => {
    assert.deepEqual(parseCampusCoachFields("Repos / force"), {
      type: "Repos / force",
      duration: null,
      pace: null,
    });
    assert.equal(parseCampusCoachFields("Sortie longue").type, "Sortie longue");
    assert.equal(parseCampusCoachFields("").type, "—");
  });
});
