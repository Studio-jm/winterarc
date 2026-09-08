import { CAMPUS_COACH_UNTIL, RULES_VERSION, SLEEP_FLOOR_HOURS, compareIsoDate } from "../time";
import { BANNER_COPY, RULE_CATALOG, type ActionCode, type BannerTone, type RuleDef } from "./catalog";

export type { ActionCode, BannerTone };

export type DaySignals = {
  localDate: string;
  sleepHours: number | null;
  rpe: number | null;
  pain: number | null;
  painZone: string | null;
  gait: boolean;
  risingPain: boolean;
  pain24h: boolean;
  nightPain: boolean;
  swelling: boolean;
  focalTibial: boolean;
  fever: boolean;
  chest: boolean;
  limp: boolean;
  coldCalves: boolean;
  hadAlertYesterday: boolean;
};

export type RuleTrace = {
  ruleId: string;
  status: RuleDef["status"];
  fired: boolean;
  action: ActionCode;
  severity: BannerTone;
  message: string;
  reason: string;
  inputs: Record<string, unknown>;
};

export type RuleAction = {
  ruleId: string;
  action: ActionCode;
  severity: BannerTone;
  message: string;
  trace: RuleTrace;
};

export type Banner = {
  ruleId: string;
  tone: BannerTone;
  title: string;
  body: string;
};

export type Evaluation = {
  rulesVersion: typeof RULES_VERSION;
  localDate: string;
  traces: RuleTrace[];
  actions: RuleAction[];
  banners: Banner[];
  todayIsAlert: boolean;
};

const TIBIAL_RE = /\b(tibia|tibial|periost|périost|shin|cresta)\b/i;

function catalog(id: string): RuleDef {
  const row = RULE_CATALOG.find((r) => r.id === id);
  if (!row) throw new Error(`règle inconnue ${id}`);
  return row;
}

function standingTrace(rule: RuleDef, inputs: Record<string, unknown>, extra?: string): RuleTrace {
  return {
    ruleId: rule.id,
    status: rule.status,
    fired: false,
    action: "standing",
    severity: "none",
    message: extra ?? rule.standingTrace,
    reason: extra ?? rule.standingTrace,
    inputs,
  };
}

function firedTrace(
  rule: RuleDef,
  inputs: Record<string, unknown>,
  reason: string,
  action: ActionCode = rule.action,
  severity: BannerTone = rule.bannerTone,
): RuleTrace {
  return {
    ruleId: rule.id,
    status: rule.status,
    fired: true,
    action,
    severity,
    message: BANNER_COPY[rule.id]?.body ?? rule.summary,
    reason,
    inputs,
  };
}

function toAction(trace: RuleTrace): RuleAction {
  return {
    ruleId: trace.ruleId,
    action: trace.action,
    severity: trace.severity,
    message: BANNER_COPY[trace.ruleId]?.body ?? trace.message,
    trace,
  };
}

function isTibialZone(zone: string | null): boolean {
  if (!zone) return false;
  return TIBIAL_RE.test(zone);
}

export function isAlertAction(action: ActionCode): boolean {
  return action === "no_progression" || action === "stop_run_human_review" || action === "no_training";
}

export function evaluateRules(signals: DaySignals): Evaluation {
  const traces: RuleTrace[] = [];
  const actions: RuleAction[] = [];

  const r1 = catalog("R1");
  const coachActive = compareIsoDate(signals.localDate, CAMPUS_COACH_UNTIL) <= 0;
  if (coachActive) {
    const t = firedTrace(r1, { localDate: signals.localDate, until: CAMPUS_COACH_UNTIL }, "date ≤ 2026-10-25");
    traces.push(t);
    actions.push(toAction(t));
  } else {
    traces.push(standingTrace(r1, { localDate: signals.localDate, until: CAMPUS_COACH_UNTIL }));
  }

  for (const id of ["R2", "R3", "R4"] as const) {
    traces.push(standingTrace(catalog(id), { stub: true }));
  }

  const r5 = catalog("R5");
  const gaitLike = Boolean(signals.gait || signals.limp);
  const r5fire = gaitLike || signals.risingPain || signals.pain24h;
  if (r5fire) {
    const t = firedTrace(r5, {
      gait: signals.gait,
      limp: signals.limp,
      risingPain: signals.risingPain,
      pain24h: signals.pain24h,
    }, "gait/limp | rising | 24h");
    traces.push(t);
    actions.push(toAction(t));
  } else {
    traces.push(
      standingTrace(r5, {
        gait: signals.gait,
        limp: signals.limp,
        risingPain: signals.risingPain,
        pain24h: signals.pain24h,
      }),
    );
  }

  const r6 = catalog("R6");
  const focal = Boolean(signals.focalTibial || isTibialZone(signals.painZone));
  const r6fire = focal || signals.nightPain || signals.swelling;
  if (r6fire) {
    const t = firedTrace(r6, {
      focalTibial: signals.focalTibial,
      painZone: signals.painZone,
      nightPain: signals.nightPain,
      swelling: signals.swelling,
    }, "focal tibial | night | swelling");
    traces.push(t);
    actions.push(toAction(t));
  } else {
    traces.push(
      standingTrace(r6, {
        focalTibial: signals.focalTibial,
        painZone: signals.painZone,
        nightPain: signals.nightPain,
        swelling: signals.swelling,
      }),
    );
  }

  const r10 = catalog("R10");
  const r10fire = Boolean(signals.fever || signals.chest);
  if (r10fire) {
    const t = firedTrace(r10, { fever: signals.fever, chest: signals.chest }, "fever | chest");
    traces.push(t);
    actions.push(toAction(t));
  } else {
    traces.push(standingTrace(r10, { fever: signals.fever, chest: signals.chest }));
  }

  const todayIsAlert = actions.some((a) => isAlertAction(a.action));
  const r7 = catalog("R7");
  if (todayIsAlert && signals.hadAlertYesterday) {
    const t = firedTrace(r7, { hadAlertYesterday: true, todayIsAlert: true }, "deux alertes consécutives");
    traces.push(t);
    actions.push(toAction(t));
  } else {
    traces.push(
      standingTrace(r7, { hadAlertYesterday: signals.hadAlertYesterday, todayIsAlert }),
    );
  }

  const r8 = catalog("R8");
  const sleep = signals.sleepHours;
  const r8fire = sleep != null && sleep < SLEEP_FLOOR_HOURS;
  if (r8fire) {
    const t = firedTrace(
      r8,
      { sleepHours: sleep, floor: SLEEP_FLOOR_HOURS, ceiling: 6.5 },
      sleep <= 6.5 ? "sommeil ≤ plafond 6,5 h" : "sommeil < 7 h",
    );
    traces.push(t);
    actions.push(toAction(t));
  } else {
    traces.push(standingTrace(r8, { sleepHours: sleep, floor: SLEEP_FLOOR_HOURS }));
  }

  traces.push(standingTrace(catalog("R9"), { stub: true }));

  const r11 = catalog("R11");
  const isolatedCold = Boolean(signals.coldCalves && !signals.limp && !signals.gait);
  if (isolatedCold) {
    const t = firedTrace(r11, { coldCalves: true, limp: false, gait: false }, "mollets froids isolés");
    traces.push(t);
    actions.push(toAction(t));
  } else {
    traces.push(
      standingTrace(r11, {
        coldCalves: signals.coldCalves,
        limp: signals.limp,
        gait: signals.gait,
      }),
    );
  }

  for (const id of ["R12", "R13", "R14", "R15"] as const) {
    traces.push(standingTrace(catalog(id), { stub: true }));
  }

  const banners = pickBanners(actions);
  return {
    rulesVersion: RULES_VERSION,
    localDate: signals.localDate,
    traces,
    actions,
    banners,
    todayIsAlert,
  };
}

function pickBanners(actions: RuleAction[]): Banner[] {
  const fired = new Map(actions.map((a) => [a.ruleId, a]));
  const order = ["R6", "R5", "R10", "R7", "R8", "R1", "R11"];
  const banners: Banner[] = [];
  for (const id of order) {
    const a = fired.get(id);
    if (!a) continue;
    const copy = BANNER_COPY[id];
    const def = catalog(id);
    if (def.bannerTone === "none") continue;
    banners.push({
      ruleId: id,
      tone: a.severity,
      title: copy?.title ?? def.title,
      body: copy?.body ?? a.message,
    });
  }
  return banners;
}
