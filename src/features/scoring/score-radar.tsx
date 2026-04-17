"use client";

// ============================================================
// ScoreRadar —— 5 维度雷达图（recharts）
// ============================================================
// 把 ScoreBreakdown 归一化到 0-100，用雷达图直观展示候选人强弱项。
// 维度：硬性 / 技能 / 经验 / 加分 / 自定义
// ============================================================

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { ScoreResult } from "@/types";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function toRadarData(score: ScoreResult) {
  const { breakdown } = score;

  // 硬性：通过率
  const hardTotal = breakdown.hard.length;
  const hardPass = breakdown.hard.filter((h) => h.pass).length;
  const hardScore = hardTotal === 0 ? 80 : (hardPass / hardTotal) * 100;

  // 技能：匹配率（按 weight 加权更公平，但演示直接用命中率够用）
  const skillsTotal = breakdown.skills.length;
  const skillsMatched = breakdown.skills.filter((s) => s.matched).length;
  const skillsScore = skillsTotal === 0 ? 60 : (skillsMatched / skillsTotal) * 100;

  // 经验
  const experienceScore = clamp(breakdown.experience.score ?? 0, 0, 100);

  // 加分：命中 1 条给 33，最多 100
  const bonusHit = breakdown.bonus.filter((b) => b.hit).length;
  const bonusScore = clamp(bonusHit * 33, 0, 100);

  // 自定义：均分
  const customScores = breakdown.custom.map((c) => clamp(c.score ?? 0, 0, 100));
  const customScore = customScores.length
    ? customScores.reduce((a, b) => a + b, 0) / customScores.length
    : 60;

  return [
    { dim: "硬性", value: Math.round(hardScore) },
    { dim: "技能", value: Math.round(skillsScore) },
    { dim: "经验", value: Math.round(experienceScore) },
    { dim: "加分", value: Math.round(bonusScore) },
    { dim: "自定义", value: Math.round(customScore) },
  ];
}

export function ScoreRadar({ score }: { score: ScoreResult }) {
  const data = toRadarData(score);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="dim"
            tick={{ fill: "#475569", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={false}
            tickCount={5}
          />
          <Radar
            dataKey="value"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.25}
            isAnimationActive
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
