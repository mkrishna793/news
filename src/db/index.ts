import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as embeddedDrizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { mkdirSync } from "node:fs";
const g = globalThis as typeof globalThis & {
  __atlasPool?: Pool;
  __atlasLocal?: PGlite;
};
const postgres = process.env.DATABASE_URL
  ? (g.__atlasPool ??= new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    }))
  : null;
if (!postgres) mkdirSync(".atlas", { recursive: true });
const local = postgres
  ? null
  : (g.__atlasLocal ??= new PGlite(".atlas/database"));
// An embedded Postgres-compatible store makes a clean checkout usable without credentials.
export const pool = postgres ?? {
  query: async (query: string) => {
    await local!.exec(query);
  },
};
export const db = postgres
  ? drizzle(postgres)
  : (embeddedDrizzle(local!) as unknown as ReturnType<typeof drizzle>);
