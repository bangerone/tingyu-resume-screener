// ============================================================
// POST /api/resume/parse
// ------------------------------------------------------------
// 入参：{ fileKey }
// 出参：{ parsedResume: ParsedResume }
//
// D3 行为：mock 返回固定 ParsedResume（稍微按 fileKey 派生点差异，让体验真实些）
// D4 会替换为：COS download → pdf-parse/mammoth → LLM Call #1 → 真 JSON
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCandidateSession } from "@/lib/auth/candidate";
import type { ParsedResume } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  fileKey: z.string().min(1),
});

function mockParse(candidateEmail: string, fileKey: string): ParsedResume {
  // mock 的稳定性：根据 fileKey 选一条示例（hash mod 2）
  const hash = [...fileKey].reduce((s, c) => (s + c.charCodeAt(0)) | 0, 0);
  const variant = Math.abs(hash) % 2;

  if (variant === 0) {
    return {
      name: "张三",
      email: candidateEmail,
      phone: "13800138000",
      location: "上海",
      total_years: 4,
      education: [
        {
          school: "复旦大学",
          degree: "本科",
          major: "计算机科学与技术",
          period: "2017-09 ~ 2021-07",
        },
      ],
      experience: [
        {
          company: "字节跳动",
          title: "前端工程师",
          period: "2021-08 ~ 2024-03",
          summary:
            "主导抖音电商 B 端中后台从 Webpack 迁移 Vite，冷启动从 35s 降至 6s；负责商品列表虚拟化，支撑 10w+ SKU。",
        },
        {
          company: "美团",
          title: "高级前端工程师",
          period: "2024-04 ~ 至今",
          summary:
            "外卖运营平台技术负责人，搭建 Monorepo + 微前端架构，统一 8 条业务线构建和发布。",
        },
      ],
      skills: [
        "TypeScript",
        "React",
        "Next.js",
        "Node.js",
        "Vite",
        "Monorepo",
        "性能优化",
      ],
      projects: [
        {
          name: "抖音电商商家中心",
          role: "前端主力",
          summary:
            "负责商家侧数据看板和订单管理模块重构，首屏性能优化 60%。",
        },
      ],
      raw_text:
        "张三 · 前端工程师\\n复旦大学 计算机科学与技术 · 2017-2021\\n字节跳动 / 美团 · 4 年前端经验\\nTypeScript · React · Next.js · Node.js · Vite",
    };
  }

  return {
    name: "李四",
    email: candidateEmail,
    phone: "13900139000",
    location: "北京",
    total_years: 2,
    education: [
      {
        school: "北京邮电大学",
        degree: "硕士",
        major: "软件工程",
        period: "2020-09 ~ 2023-06",
      },
    ],
    experience: [
      {
        company: "小红书",
        title: "前端开发工程师",
        period: "2023-07 ~ 至今",
        summary:
          "负责笔记详情页前端开发，主导滑动播放器改造，CTR +3%。",
      },
    ],
    skills: ["JavaScript", "React", "CSS", "Node.js", "Webpack"],
    projects: [
      {
        name: "笔记滑动播放器",
        role: "核心开发",
        summary: "纯 CSS + IntersectionObserver 实现，零三方库依赖。",
      },
    ],
    raw_text:
      "李四 · 前端工程师 · 2 年经验\\n北邮软件工程硕士 · 小红书在职\\nJavaScript / React / Webpack",
  };
}

export async function POST(req: NextRequest) {
  const session = await getCandidateSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  // 简单的 path 防越权：fileKey 必须在候选人自己目录下
  if (!parsed.data.fileKey.startsWith(`resumes/${session.sub}/`)) {
    return NextResponse.json(
      { error: "fileKey 与当前候选人不匹配" },
      { status: 403 },
    );
  }

  // mock 延迟 800ms，体验上有 loading 感但不拖沓
  await new Promise((r) => setTimeout(r, 800));

  const parsedResume = mockParse(session.email ?? "", parsed.data.fileKey);
  return NextResponse.json({ parsedResume, mock: true });
}
