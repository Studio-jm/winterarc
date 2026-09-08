import {
  CAMPUS_COACH_UNTIL,
  DEFAULT_SLEEP_HOURS,
  RULES_VERSION,
  SLEEP_CEILING_HOURS,
  SLEEP_FLOOR_HOURS,
  compareIsoDate,
} from "../time";

export { RULES_VERSION };

export type RuleStatus = "active" | "standing" | "stub";
export type BannerTone = "red" | "calm" | "note" | "info" | "stop" | "review" | "none";
export type ActionCode =
  | "protect_campus_coach"
  | "no_progression"
  | "stop_run_human_review"
  | "drop_optional_load"
  | "human_review"
  | "no_training"
  | "note"
  | "standing";

export type RuleDef = {
  id: string;
  title: string;
  status: RuleStatus;
  action: ActionCode;
  bannerTone: BannerTone;
  neverRed: boolean;
  redOnly: boolean;
  summary: string;
  rationale: string;
  clinical: string;
  coaching: string;
  inputs: string[];
  standingTrace: string;
};

export const RULE_CATALOG: RuleDef[] = [
  {
    id: "R1",
    title: "Protéger le plan Campus Coach",
    status: "active",
    action: "protect_campus_coach",
    bannerTone: "info",
    neverRed: true,
    redOnly: false,
    summary:
      "Jusqu'au 2026-10-25 inclus, Winter Arc ne propose pas de progression hors du plan Campus Coach.",
    rationale:
      "Jessy est suivie par Campus Coach. Le compagnon V0 est un garde-fou, pas un second coach. Toute suggestion de volume, d'intensité ou de séance bonus est gelée pendant la fenêtre contractuelle.",
    clinical:
      "Pas d'enjeu médical propre. Objectif : éviter le double commandement (app vs coach) qui pousse à l'ajout de km « parce que je me sens bien ».",
    coaching:
      "Afficher un bandeau info discret. Ne jamais colorer en rouge. Tracer la date de fin de protection. Après le 25 oct. 2026, la règle reste évaluée mais passe en standing.",
    inputs: ["localDate", "CAMPUS_COACH_UNTIL"],
    standingTrace: "Fenêtre Campus Coach close — R1 standing, aucune protection active.",
  },
  {
    id: "R2",
    title: "Pic de charge (ACWR) — stub",
    status: "stub",
    action: "standing",
    bannerTone: "none",
    neverRed: true,
    redOnly: false,
    summary: "Ratio charge aiguë / chronique non calculé en V0 (pas de modèle 28j).",
    rationale:
      "Un pic de volume sur 7 jours vs 28 jours est un signal classique de blessure d'overuse. V0 n'a pas encore la fenêtre glissante ni le sport-pondéré.",
    clinical: "Stub volontaire. Ne pas inventer un ACWR à partir de 1–2 fichiers FIT.",
    coaching: "Trace standing uniquement. Pas de bannière.",
    inputs: ["activities(7j)", "activities(28j)"],
    standingTrace: "R2 stub — ACWR non calculé, standing.",
  },
  {
    id: "R3",
    title: "HRV / FC repos — stub",
    status: "stub",
    action: "standing",
    bannerTone: "none",
    neverRed: true,
    redOnly: false,
    summary: "Pas d'ingest HRV Apple Watch / Garmin en V0.",
    rationale:
      "La HRV peut qualifier une fatigue systémique, mais les exports XML Health et FIT V0 ne normalisent pas encore ce canal.",
    clinical: "Ne pas dériver un statut « recovered » depuis le RPE seul.",
    coaching: "Trace standing. Aucune action.",
    inputs: ["hrv", "restingHr"],
    standingTrace: "R3 stub — HRV absente, standing.",
  },
  {
    id: "R4",
    title: "Séances dures consécutives — stub",
    status: "stub",
    action: "standing",
    bannerTone: "none",
    neverRed: true,
    redOnly: false,
    summary: "Pas de classification d'intensité séance en V0 (pas de zones FC/allure fiables).",
    rationale:
      "Enchaîner deux durs (seuil, VO2, fractionné) sans tampon augmente le risque. Sans taxonomie sport+intensité, la règle ne peut pas tirer.",
    clinical: "Stub. R5/R6 restent les filets douleur.",
    coaching: "Trace standing.",
    inputs: ["activity.intensity"],
    standingTrace: "R4 stub — intensité séance non classée, standing.",
  },
  {
    id: "R5",
    title: "Douleur de démarche, au lever, ou persistante 24 h",
    status: "active",
    action: "no_progression",
    bannerTone: "red",
    neverRed: false,
    redOnly: true,
    summary:
      "Boiterie / douleur à la démarche, douleur au lever, ou douleur encore présente à 24 h → pas de progression.",
    rationale:
      "Ces trois signes sont des marqueurs d'une structure qui n'a pas encaissé la charge précédente. Progresser (volume, allure, dénivelé, fractionné) est le scénario typique de passage de la simple douleur à la blessure.",
    clinical:
      "Démarche altérée = compensation. Douleur au lever = raideur inflammatoire matinale. Douleur 24 h = non-résolution. Le trio n'exige pas un diagnostic : il exige de ne pas augmenter.",
    coaching:
      "Bannière ROUGE uniquement (avec R6). Action no_progression : on peut entretenir un volume déjà toléré, on n'ajoute rien. Ne pas masquer derrière R8 (sommeil).",
    inputs: ["gait", "limp", "risingPain", "pain24h"],
    standingTrace: "R5 standing — pas de signal démarche / lever / 24 h.",
  },
  {
    id: "R6",
    title: "Tibial focal, douleur de nuit, gonflement",
    status: "active",
    action: "stop_run_human_review",
    bannerTone: "red",
    neverRed: false,
    redOnly: true,
    summary:
      "Douleur tibiale focale, réveil nocturne, ou gonflement → arrêt course et revue humaine.",
    rationale:
      "Périostite / stress tibial, douleur de nuit (signal osseux), et gonflement (inflammation locale) sont des drapeaux de structure, pas de simple fatigue musculaire. La course en charge est le facteur aggravant n°1.",
    clinical:
      "Focal tibial ≠ mollets froids diffus. Nuit ≠ courbatures du soir. Gonflement ≠ simple lourdeur. R6 est RED only : jamais rétrogradée en note, jamais fusionnée avec R8.",
    coaching:
      "Bannière rouge. Action stop_run_human_review. Le plan Campus Coach n'autorise pas de « petit footing pour tester » tant que la revue n'a pas eu lieu.",
    inputs: ["focalTibial", "painZone", "nightPain", "swelling"],
    standingTrace: "R6 standing — pas de tibial focal / nuit / gonflement.",
  },
  {
    id: "R7",
    title: "Deux alertes consécutives",
    status: "active",
    action: "human_review",
    bannerTone: "review",
    neverRed: true,
    redOnly: false,
    summary: "Deux jours de suite avec une alerte R5, R6 ou R10 → revue humaine.",
    rationale:
      "Un signal isolé peut être un mauvais jour. Deux jours d'alerte (douleur structurante ou fièvre/poitrine) indiquent que le système n'a pas auto-corrigé.",
    clinical:
      "R8 (sommeil) n'est PAS une alerte : on ne déclenche pas R7 sur deux nuits courtes. Les notes (mollets froids) non plus.",
    coaching:
      "Bannière revue (pas rouge par elle-même). Si R5/R6 tirent le même jour, leur rouge reste prioritaire à l'affichage.",
    inputs: ["hadAlertYesterday", "todayAlert"],
    standingTrace: "R7 standing — pas deux alertes consécutives.",
  },
  {
    id: "R8",
    title: "Sommeil < 7 h / plafond 6,5 h",
    status: "active",
    action: "drop_optional_load",
    bannerTone: "calm",
    neverRed: true,
    redOnly: false,
    summary:
      "Moins de 7 h de sommeil, y compris le plafond structurel 6,5 h, → on retire la charge optionnelle. Bandeau calme, JAMAIS rouge.",
    rationale:
      "Le sommeil est un levier de récupération, pas un drapeau blessure. Jessy vit souvent sous 7 h (plafond réel ~6,5 h, valeur préremplie de la saisie). Punir ça en rouge créerait de l'alerte-fatigue et des faux arrêts.",
    clinical:
      "STRUCTURAL. drop_optional_load = on garde le socle Campus Coach, on coupe le bonus (footing extra, PPM, renfo optionnel). On ne confond pas avec no_training.",
    coaching:
      "Bannière calme / slate. Copy factuelle. Interdit : pictos danger, fond rouge, mot « alerte ». Même si R5/R6 sont rouges le même jour, le bandeau R8 reste calme.",
    inputs: ["sleepHours", "SLEEP_FLOOR_HOURS", "SLEEP_CEILING_HOURS"],
    standingTrace: "R8 standing — sommeil ≥ 7 h, charge optionnelle conservée.",
  },
  {
    id: "R9",
    title: "Disponibilité énergétique — stub",
    status: "stub",
    action: "standing",
    bannerTone: "none",
    neverRed: true,
    redOnly: false,
    summary: "Pas de modèle kcal dépense vs repas au-delà de l'heuristique V0.",
    rationale:
      "LEA (low energy availability) est un risque réel en endurance, mais V0 n'estime que le high-end alimentaire, pas la dépense.",
    clinical: "Ne pas alerter sur un déficit inventé.",
    coaching: "Trace standing.",
    inputs: ["repas.kcal", "activity.duration"],
    standingTrace: "R9 stub — LEA non modélisée, standing.",
  },
  {
    id: "R10",
    title: "Fièvre ou douleur thoracique",
    status: "active",
    action: "no_training",
    bannerTone: "stop",
    neverRed: true,
    redOnly: false,
    summary: "Fièvre ou douleur thoracique → pas d'entraînement. Ce n'est pas une bannière rouge R5/R6.",
    rationale:
      "Courir avec une fièvre ou une douleur de poitrine est un risque systémique (myocardite, infection). Arrêt net, pas de « séance facile ».",
    clinical:
      "Le rouge visuel est réservé à R5/R6 (appareil locomoteur). R10 est un STOP santé, ton distinct, action no_training plus forte que no_progression.",
    coaching:
      "Bannière stop, pas rouge blessure. R7 compte R10 comme alerte. R1 ne peut pas « protéger le plan » au point d'ignorer R10.",
    inputs: ["fever", "chest"],
    standingTrace: "R10 standing — pas de fièvre ni douleur thoracique.",
  },
  {
    id: "R11",
    title: "Mollets froids habituels sans boiterie",
    status: "active",
    action: "note",
    bannerTone: "note",
    neverRed: true,
    redOnly: false,
    summary:
      "Mollets froids connus, sans boiterie, → note. Jamais rouge. Ce n'est pas un R6.",
    rationale:
      "Jessy décrit des mollets froids récurrents sans altération de la démarche. Medicaliser ce trait habituel en drapeau vasculaire créerait du bruit et des arrêts inutiles.",
    clinical:
      "Si boiterie ou démarche altérée coexiste, R5 prend la main (rouge). Si tibial focal / nuit / gonflement, R6 prend la main. R11 ne s'applique que lorsque le froid de mollet est isolé.",
    coaching: "Note grise, une ligne. Pas de bandeau rouge. Pas d'action d'arrêt.",
    inputs: ["coldCalves", "limp", "gait"],
    standingTrace: "R11 standing — pas de mollets froids isolés.",
  },
  {
    id: "R12",
    title: "Chaleur / hydratation — stub",
    status: "stub",
    action: "standing",
    bannerTone: "none",
    neverRed: true,
    redOnly: false,
    summary: "Pas de météo ni de masse corporelle en V0.",
    rationale: "Les sorties chaudes demandent un plafond d'allure, hors scope V0.",
    clinical: "Stub.",
    coaching: "Trace standing.",
    inputs: ["weather", "sweat"],
    standingTrace: "R12 stub — chaleur/hydratation non évaluées, standing.",
  },
  {
    id: "R13",
    title: "Reprise post-maladie — stub",
    status: "stub",
    action: "standing",
    bannerTone: "none",
    neverRed: true,
    redOnly: false,
    summary: "Pas d'historique d'arrêt maladie multi-jours en V0 au-delà de R10 du jour.",
    rationale:
      "La reprise trop rapide après infection est un risque cardiaque. V0 n'a pas encore la mémoire d'un épisode fébrile J-3.",
    clinical: "R10 couvre le jour même. R13 est le lendemain+.",
    coaching: "Trace standing.",
    inputs: ["feverHistory"],
    standingTrace: "R13 stub — reprise post-maladie non suivie, standing.",
  },
  {
    id: "R14",
    title: "Longs enchaînés — stub",
    status: "stub",
    action: "standing",
    bannerTone: "none",
    neverRed: true,
    redOnly: false,
    summary: "Deux sorties longues back-to-back non détectées (seuil km non figé).",
    rationale: "Le week-end « long + long » est un classique de surcharge tendineuse.",
    clinical: "Stub V0.",
    coaching: "Trace standing.",
    inputs: ["distanceM", "localDate-1"],
    standingTrace: "R14 stub — longs enchaînés non évalués, standing.",
  },
  {
    id: "R15",
    title: "Alcool / caféine tardifs — stub",
    status: "stub",
    action: "standing",
    bannerTone: "none",
    neverRed: true,
    redOnly: false,
    summary: "Pas de saisie dédiée alcool/caféine en V0.",
    rationale: "Peut expliquer un sommeil 6,5 h, déjà couvert structurellement par R8.",
    clinical: "Ne pas doubler R8.",
    coaching: "Trace standing.",
    inputs: ["notes"],
    standingTrace: "R15 stub — alcool/caféine non saisis, standing.",
  },
];

export const BANNER_COPY: Record<string, { title: string; body: string }> = {
  R1: {
    title: "Plan Campus Coach protégé",
    body: "Jusqu'au 25 octobre 2026, Winter Arc ne propose pas de progression hors du plan. Garde-fou, pas second coach.",
  },
  R5: {
    title: "Pas de progression aujourd'hui",
    body: "Signal démarche, douleur au lever ou douleur encore là à 24 h. On n'ajoute ni volume ni intensité.",
  },
  R6: {
    title: "Arrêt course — revue humaine",
    body: "Tibial focal, douleur de nuit ou gonflement. Pas de footing « pour tester » tant que ce n'est pas relu.",
  },
  R7: {
    title: "Revue humaine",
    body: "Deux jours d'alerte d'affilée. Le système n'a pas auto-corrigé — un regard extérieur est requis.",
  },
  R8: {
    title: "Charge optionnelle retirée",
    body: "Sommeil sous 7 h (plafond structurel 6,5 h). On garde le socle, on coupe le bonus. Ce n'est pas une alerte.",
  },
  R10: {
    title: "Pas d'entraînement",
    body: "Fièvre ou douleur thoracique. Arrêt net — pas de séance facile.",
  },
  R11: {
    title: "Note — mollets froids",
    body: "Trait habituel, sans boiterie. Ce n'est pas un drapeau rouge.",
  },
};

export const CAMPUS_COACH_DATE = CAMPUS_COACH_UNTIL;
export const SLEEP_DEFAULT = DEFAULT_SLEEP_HOURS;
export const SLEEP_FLOOR = SLEEP_FLOOR_HOURS;
export const SLEEP_CEILING = SLEEP_CEILING_HOURS;
export { compareIsoDate };
