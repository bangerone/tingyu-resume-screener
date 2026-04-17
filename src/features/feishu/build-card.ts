// ============================================================
// 飞书 interactive card 构造
// ============================================================
// 给「高分候选人推送」/「HR 手动推送」共用。
// ============================================================

import type { Application, Job } from "@/lib/db/schema";
import type { ScoreResult } from "@/types";

interface BuildCardInput {
  application: Pick<
    Application,
    "id" | "candidateName" | "candidateEmail" | "candidatePhone"
  >;
  job: Pick<Job, "id" | "title" | "department" | "location">;
  score: ScoreResult;
  detailUrl: string;
}

export interface FeishuCardPayload {
  msg_type: "interactive";
  card: Record<string, unknown>;
}

/** total → 卡片 header 模板色 */
function headerTemplate(total: number): "green" | "blue" | "orange" | "red" {
  if (total >= 85) return "green";
  if (total >= 70) return "blue";
  if (total >= 50) return "orange";
  return "red";
}

/** total → lark_md 字体色 */
function scoreFontColor(total: number): string {
  if (total >= 85) return "green";
  if (total >= 70) return "blue";
  if (total >= 50) return "orange";
  return "red";
}

export function buildCandidateCard({
  application,
  job,
  score,
  detailUrl,
}: BuildCardInput): FeishuCardPayload {
  const color = scoreFontColor(score.total);
  const template = headerTemplate(score.total);
  const passedText = score.passed_hard ? "✅ 通过硬性" : "❌ 未通过硬性";
  const jobMeta = [job.department, job.location].filter(Boolean).join(" · ") || "—";
  const contact = application.candidatePhone
    ? `${application.candidateEmail} / ${application.candidatePhone}`
    : application.candidateEmail;

  const highlights =
    score.highlights.length > 0
      ? score.highlights.map((h) => `· ${h}`).join("\n")
      : "—";
  const redFlags =
    score.red_flags.length > 0
      ? score.red_flags.map((r) => `· ${r}`).join("\n")
      : "—";

  return {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true },
      header: {
        template,
        title: {
          tag: "plain_text",
          content: `🎯 高匹配候选人推送 · ${application.candidateName}`,
        },
      },
      elements: [
        {
          tag: "div",
          fields: [
            {
              is_short: true,
              text: {
                tag: "lark_md",
                content: `**岗位**\n${job.title}\n${jobMeta}`,
              },
            },
            {
              is_short: true,
              text: {
                tag: "lark_md",
                content: `**总分**\n<font color='${color}'>**${score.total}**</font> / 100  ${passedText}`,
              },
            },
            {
              is_short: true,
              text: {
                tag: "lark_md",
                content: `**候选人**\n${application.candidateName}`,
              },
            },
            {
              is_short: true,
              text: {
                tag: "lark_md",
                content: `**联系方式**\n${contact}`,
              },
            },
          ],
        },
        { tag: "hr" },
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: `**评估结论**\n${score.reasoning}`,
          },
        },
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: `**亮点**\n${highlights}`,
          },
        },
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: `**风险**\n${redFlags}`,
          },
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "查看详情" },
              type: "primary",
              url: detailUrl,
            },
          ],
        },
      ],
    },
  };
}
