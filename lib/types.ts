export type ActivitySource = "apple_health" | "fit" | "gpx" | "manual";

export type TrackPoint = {
  seq: number;
  lat: number | null;
  lon: number | null;
  ele: number | null;
  recordedAt: string | null;
};

export type ParsedActivity = {
  source: ActivitySource;
  importKey: string;
  sport: string | null;
  startedAt: string;
  endedAt: string | null;
  durationS: number | null;
  distanceM: number | null;
  localDate: string;
  trackPoints: TrackPoint[];
};

export type ParsedSleep = {
  source: ActivitySource;
  importKey: string;
  startedAt: string;
  endedAt: string;
  stage: string;
  durationS: number;
  localDate: string;
};

export type SaisieInput = {
  localDate: string;
  rpe: number;
  sleepHours: number;
  pain: number;
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
  notes: string | null;
};

export type RepasInput = {
  localDate: string;
  text: string;
  portion: string | null;
};

export type MealEstimate = {
  kcal: number;
  estimate: "high";
  matched: string[];
  portionFactor: number;
};
