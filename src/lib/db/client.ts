// ============================================================
// Drizzle DB client (singleton)
// ============================================================
// Usage:
//   import { db } from "@/lib/db/client";
//   import { jobs } from "@/lib/db/schema";
//   const rows = await db.select().from(jobs).where(eq(jobs.status, "open"));
// ============================================================

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __dbPool__: mysql.Pool | undefined;
}

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in .env.local — TiDB Cloud connection string.",
    );
  }
  return mysql.createPool({
    uri: url,
    connectionLimit: 10,
    // TiDB Serverless requires TLS
    ssl: { rejectUnauthorized: true },
  });
}

const pool = global.__dbPool__ ?? createPool();
if (process.env.NODE_ENV !== "production") {
  global.__dbPool__ = pool;
}

export const db = drizzle(pool, { schema, mode: "default" });
