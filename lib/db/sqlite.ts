import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { DbClient, RunResult, SqlValue } from "./types";

function asNumber(value: number | bigint): number {
  return typeof value === "bigint" ? Number(value) : value;
}

function bind(params: SqlValue[]): SQLInputValue[] {
  return params.map((p) => {
    if (typeof p === "boolean") return p ? 1 : 0;
    return p;
  });
}

export function openSqlite(filePath: string): DbClient {
  mkdirSync(dirname(filePath), { recursive: true });
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  return {
    async exec(sql: string) {
      db.exec(sql);
    },
    async run(sql: string, params: SqlValue[] = []): Promise<RunResult> {
      const result = db.prepare(sql).run(...bind(params));
      return {
        lastInsertRowid: asNumber(result.lastInsertRowid),
        changes: asNumber(result.changes),
      };
    },
    async get<T>(sql: string, params: SqlValue[] = []) {
      return db.prepare(sql).get(...bind(params)) as T | undefined;
    },
    async all<T>(sql: string, params: SqlValue[] = []) {
      return db.prepare(sql).all(...bind(params)) as T[];
    },
    async close() {
      db.close();
    },
  };
}
