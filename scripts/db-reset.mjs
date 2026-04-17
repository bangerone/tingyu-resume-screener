// 一次性脚本：删除所有业务表（drizzle push 失败后用来清残骸）
// 用法：node scripts/db-reset.mjs
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

const u = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: u.hostname,
  port: Number(u.port) || 4000,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, "") || "test",
  ssl: { rejectUnauthorized: true },
});

await conn.query("SET FOREIGN_KEY_CHECKS = 0");
for (const t of ["applications", "email_codes", "candidates", "jobs", "feishu_logs", "__drizzle_migrations"]) {
  try {
    await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
    console.log(`dropped ${t}`);
  } catch (e) {
    console.error(`${t}:`, e.message);
  }
}
await conn.query("SET FOREIGN_KEY_CHECKS = 1");
await conn.end();
console.log("done.");
