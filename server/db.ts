import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm").catch(() => {});
pool.query("CREATE EXTENSION IF NOT EXISTS fuzzystrmatch").catch(() => {});

export const db = drizzle(pool, { schema });
