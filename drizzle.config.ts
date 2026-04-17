import type { Config } from "drizzle-kit";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// drizzle-kit CLI 不会自动读 .env.local — 用 Node 原生 fs 解析一下注入 process.env
// 零依赖、仅在本配置文件生效，不影响运行时
for (const file of [".env.local", ".env"]) {
  const p = resolve(process.cwd(), file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    const [, k, raw] = m;
    if (process.env[k]) continue;
    const v = raw.replace(/^["']|["']$/g, "");
    process.env[k] = v;
  }
}

// 解析 DATABASE_URL 成分字段 — 避免 URL 尾部 ?sslaccept=strict 被 mysql2 当成未知参数
// 同时显式注入 ssl: { rejectUnauthorized: true }（TiDB Serverless 强制 TLS）
const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL missing in .env.local");
const u = new URL(rawUrl);

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: u.hostname,
    port: Number(u.port) || 4000,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, "") || "test",
    ssl: { rejectUnauthorized: true },
  },
  verbose: true,
  strict: false,
} satisfies Config;
