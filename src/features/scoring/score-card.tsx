// ============================================================
// ScoreCard —— 详情页评分维度卡
// ============================================================
// 展示 ScoreBreakdown 的 4+1 个 sub-section：
//   硬性 ✅/❌ · 技能匹配 · 经验 · 加分 · 自定义
// + highlights / red_flags
// ============================================================

import type { ScoreResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ScoreCard({ score }: { score: ScoreResult }) {
  const { breakdown } = score;

  return (
    <div className="space-y-4">
      {/* 硬性要求 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">硬性要求</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {breakdown.hard.length === 0 ? (
            <p className="text-sm text-slate-500">未配置硬性要求</p>
          ) : (
            breakdown.hard.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-md bg-slate-50 px-3 py-2"
              >
                <span className="text-lg leading-6">
                  {h.pass ? "✅" : "❌"}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">
                    {h.label}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{h.reason}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 技能匹配 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">技能匹配</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.skills.length === 0 ? (
            <p className="text-sm text-slate-500">未配置技能项</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {breakdown.skills.map((s, i) => (
                <span
                  key={i}
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs " +
                    (s.matched
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500 line-through")
                  }
                  title={`权重 ${s.required_weight}`}
                >
                  {s.matched ? "✓" : "✗"} {s.name}
                  <span className="text-[10px] opacity-70">
                    ·{s.required_weight}
                  </span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 经验 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>经验评估</span>
            <span className="font-mono text-sm text-slate-600">
              {breakdown.experience.score} / 100
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            {breakdown.experience.reason || "—"}
          </p>
        </CardContent>
      </Card>

      {/* 加分项 */}
      {breakdown.bonus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">加分项</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {breakdown.bonus.map((b, i) => (
                <li
                  key={i}
                  className={b.hit ? "text-emerald-700" : "text-slate-500"}
                >
                  {b.hit ? "✓" : "·"} {b.item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 自定义维度 */}
      {breakdown.custom.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">自定义维度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {breakdown.custom.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">
                    {c.name}
                  </span>
                  <span className="font-mono text-xs text-slate-600">
                    {c.score} / 100
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{c.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* highlights / red_flags */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-emerald-700">
              亮点 ({score.highlights.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {score.highlights.length === 0 ? (
              <p className="text-sm text-slate-500">无</p>
            ) : (
              <ul className="space-y-1 text-sm text-slate-700">
                {score.highlights.map((h, i) => (
                  <li key={i}>· {h}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-rose-700">
              风险 ({score.red_flags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {score.red_flags.length === 0 ? (
              <p className="text-sm text-slate-500">无</p>
            ) : (
              <ul className="space-y-1 text-sm text-slate-700">
                {score.red_flags.map((r, i) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
