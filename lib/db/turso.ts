import { createClient, type Client, type InValue } from "@libsql/client";
import type { DbClient, RunResult, SqlValue } from "./types";

function toArgs(params: SqlValue[]): InValue[] {
  return params.map((p) => {
    if (typeof p === "boolean") return p ? 1 : 0;
    return p as InValue;
  });
}

export function openTurso(url: string, authToken: string): DbClient {
  const client: Client = createClient({ url, authToken });

  return {
    async exec(sql: string) {
      for (const stmt of sql
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)) {
        await client.execute(stmt);
      }
    },
    async run(sql: string, params: SqlValue[] = []): Promise<RunResult> {
      const rs = await client.execute({ sql, args: toArgs(params) });
      return {
        lastInsertRowid: Number(rs.lastInsertRowid ?? 0),
        changes: Number(rs.rowsAffected ?? 0),
      };
    },
    async get<T>(sql: string, params: SqlValue[] = []) {
      const rs = await client.execute({ sql, args: toArgs(params) });
      return (rs.rows[0] as T | undefined) ?? undefined;
    },
    async all<T>(sql: string, params: SqlValue[] = []) {
      const rs = await client.execute({ sql, args: toArgs(params) });
      return rs.rows as T[];
    },
    async close() {
      client.close();
    },
  };
}
