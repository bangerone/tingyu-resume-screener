// ============================================================
// rate-limit — 进程内存限流（D6.5）
// ============================================================
// 简单的 fixed-window 计数器：key 命中 limit 时拒绝。
// 进程重启 = 清零（demo 场景够用，不引入 Redis）。
// ============================================================

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function bumpAndCheck(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count };
}

/** 仅测试用：清空所有 bucket（比如 acceptance 里手动触发 10 次后想复位） */
export function __resetRateLimits() {
  buckets.clear();
}
