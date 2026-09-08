export type SqlValue = string | number | bigint | boolean | null | Uint8Array;

export type RunResult = {
  lastInsertRowid: number;
  changes: number;
};

export type DbClient = {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<RunResult>;
  get<T>(sql: string, params?: SqlValue[]): Promise<T | undefined>;
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  close(): Promise<void>;
};
