export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  import_key TEXT NOT NULL,
  sport TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_s REAL,
  distance_m REAL,
  local_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source, import_key)
);

CREATE TABLE IF NOT EXISTS sleep_intervals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  import_key TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  stage TEXT,
  duration_s REAL NOT NULL,
  local_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source, import_key)
);

CREATE TABLE IF NOT EXISTS saisie (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_date TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'manual',
  rpe INTEGER NOT NULL,
  sleep_hours REAL NOT NULL,
  pain INTEGER NOT NULL,
  pain_zone TEXT,
  gait INTEGER NOT NULL DEFAULT 0,
  rising_pain INTEGER NOT NULL DEFAULT 0,
  pain_24h INTEGER NOT NULL DEFAULT 0,
  night_pain INTEGER NOT NULL DEFAULT 0,
  swelling INTEGER NOT NULL DEFAULT 0,
  focal_tibial INTEGER NOT NULL DEFAULT 0,
  fever INTEGER NOT NULL DEFAULT 0,
  chest INTEGER NOT NULL DEFAULT 0,
  limp INTEGER NOT NULL DEFAULT 0,
  cold_calves INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS repas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_date TEXT NOT NULL,
  text TEXT NOT NULL,
  portion TEXT,
  kcal INTEGER NOT NULL,
  estimate TEXT NOT NULL DEFAULT 'high',
  matched TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_date TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  source TEXT,
  UNIQUE(local_date, key)
);

CREATE TABLE IF NOT EXISTS rule_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_date TEXT NOT NULL,
  rules_version TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rule_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evaluation_id INTEGER,
  local_date TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  action TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  trace_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS track_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL,
  seq INTEGER NOT NULL,
  lat REAL,
  lon REAL,
  ele REAL,
  recorded_at TEXT,
  FOREIGN KEY(activity_id) REFERENCES activities(id)
);

CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(local_date);
CREATE INDEX IF NOT EXISTS idx_sleep_date ON sleep_intervals(local_date);
CREATE INDEX IF NOT EXISTS idx_repas_date ON repas(local_date);
CREATE INDEX IF NOT EXISTS idx_actions_date ON rule_actions(local_date);
CREATE INDEX IF NOT EXISTS idx_flags_date ON flags(local_date);
`.trim();
