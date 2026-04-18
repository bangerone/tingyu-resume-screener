// ============================================================
// 一次性迁移：为 jobs 表补加 hiring_type 列
//   node scripts/add-hiring-type.mjs
// 幂等：IF NOT EXISTS 语义（先 check 再 ADD）
// ============================================================
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

for (const file of [".env.local", ".env"]) {
  const p = resolve(process.cwd(), file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    const [, k, raw] = m;
    if (process.env[k]) continue;
    process.env[k] = raw.replace(/^["']|["']$/g, "");
  }
}

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL missing");
const u = new URL(rawUrl);

const conn = await mysql.createConnection({
  host: u.hostname,
  port: Number(u.port) || 4000,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ""),
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});

const [cols] = await conn.query(
  `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'hiring_type'`,
);

if (cols.length === 0) {
  await conn.query(
    `ALTER TABLE jobs ADD COLUMN hiring_type ENUM('campus','social') NOT NULL DEFAULT 'social'`,
  );
  console.log("✓ added hiring_type column (default social)");
} else {
  console.log("• hiring_type column already exists, skipping");
}

await conn.end();
