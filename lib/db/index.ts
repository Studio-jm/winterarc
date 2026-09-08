import { join } from "node:path";
import { SCHEMA_SQL } from "./schema";
import { openSqlite } from "./sqlite";
import { openTurso } from "./turso";
import type { DbClient } from "./types";

export type { DbClient } from "./types";

type Cache = { client: DbClient; key: string };

const g = globalThis as typeof globalThis & { __winterarcDb?: Cache };

export function tursoConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

export function sqlitePath(): string {
  return process.env.WINTERARC_SQLITE_PATH ?? join(process.cwd(), "data", "winterarc.db");
}

function cacheKey(): string {
  if (tursoConfigured()) {
    return `turso:${process.env.TURSO_DATABASE_URL}`;
  }
  return `sqlite:${sqlitePath()}`;
}

export async function getDb(): Promise<DbClient> {
  const key = cacheKey();
  if (g.__winterarcDb && g.__winterarcDb.key === key) {
    return g.__winterarcDb.client;
  }
  if (g.__winterarcDb) {
    await g.__winterarcDb.client.close().catch(() => undefined);
    g.__winterarcDb = undefined;
  }

  let client: DbClient;
  if (tursoConfigured()) {
    client = openTurso(process.env.TURSO_DATABASE_URL!, process.env.TURSO_AUTH_TOKEN!);
  } else {
    client = openSqlite(sqlitePath());
  }
  await client.exec(SCHEMA_SQL);
  g.__winterarcDb = { client, key };
  return client;
}

export async function resetDbCache(): Promise<void> {
  if (g.__winterarcDb) {
    await g.__winterarcDb.client.close().catch(() => undefined);
    g.__winterarcDb = undefined;
  }
}
