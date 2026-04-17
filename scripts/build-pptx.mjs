// ============================================================
// build-pptx.mjs — 生成 docs/presentation.pptx
// ============================================================
// 用于面试作业提交的配套演示文稿（16 页）。
// 内容是 docs/submission.md 的视觉版本，产品 + 设计决策 + 技术栈 + 时间线。
//
// 运行：
//   npm install -g pptxgenjs
//   cd F:/tingyu-resume-screener
//   NODE_PATH="$(npm root -g)" node scripts/build-pptx.mjs
// ============================================================

import pptxgen from "pptxgenjs";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10" x 5.625"
pres.author = "bangerone";
pres.title = "庭宇 · 智能简历筛选系统";
pres.subject = "庭宇科技面试作业";

// ---------- Palette (Midnight Executive + coral accent) ----------
const C = {
  navy: "1E2761",
  teal: "1C7293",
  coral: "F96167",
  gold: "F59E0B",
  ice: "CADCFC",
  cream: "FAFBFC",
  white: "FFFFFF",
  text: "1F2937",
  muted: "64748B",
  divider: "E2E8F0",
};

const FH = "Microsoft YaHei";
const FB = "Microsoft YaHei";
const FM = "Consolas"; // mono

function titleBar(slide, text, subtitle) {
  slide.addText(text, {
    x: 0.5, y: 0.35, w: 9, h: 0.55,
    fontSize: 28, fontFace: FH, bold: true, color: C.navy, margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.95, w: 9, h: 0.3,
      fontSize: 12, fontFace: FB, color: C.muted, margin: 0,
    });
  }
  // title accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.3, w: 0.35, h: 0.04,
    fill: { color: C.coral }, line: { color: C.coral, width: 0 },
  });
}

// ============================================================
// 1 · Cover
// ============================================================
let s = pres.addSlide();
s.background = { color: C.navy };
s.addShape(pres.shapes.OVAL, {
  x: -1.5, y: -2, w: 4, h: 4,
  fill: { color: C.coral, transparency: 80 }, line: { color: C.navy, width: 0 },
});
s.addShape(pres.shapes.OVAL, {
  x: 7.5, y: 3.5, w: 3.5, h: 3.5,
  fill: { color: C.teal, transparency: 70 }, line: { color: C.navy, width: 0 },
});
s.addText("庭宇 · 智能简历筛选", {
  x: 0.8, y: 1.5, w: 8.4, h: 0.9,
  fontSize: 44, fontFace: FH, bold: true, color: C.white,
});
s.addText("AI 驱动的招聘 SaaS · 全国内栈 · 一周 vibe-coding", {
  x: 0.8, y: 2.5, w: 8.4, h: 0.5,
  fontSize: 18, fontFace: FH, color: C.ice,
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 0.8, y: 3.2, w: 0.8, h: 0.05,
  fill: { color: C.coral }, line: { color: C.coral, width: 0 },
});
s.addText("庭宇科技面试作业", {
  x: 0.8, y: 3.35, w: 8.4, h: 0.35,
  fontSize: 14, fontFace: FH, color: C.white, charSpacing: 3,
});
s.addText("GitHub: github.com/bangerone/tingyu-resume-screener", {
  x: 0.8, y: 4.9, w: 8.4, h: 0.3,
  fontSize: 11, fontFace: FM, color: C.ice,
});

// ============================================================
// 2 · 一句话定位
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
s.addText("产品是什么", {
  x: 0.5, y: 0.5, w: 9, h: 0.4,
  fontSize: 13, fontFace: FH, color: C.coral, charSpacing: 4, bold: true,
});
s.addText([
  { text: "HR ", options: { color: C.text } },
  { text: "用自然语言写 JD", options: { color: C.teal, bold: true } },
  { text: "，系统自动生成筛选标准；\n", options: { color: C.text } },
  { text: "候选人 ", options: { color: C.text } },
  { text: "上传简历自动填表", options: { color: C.coral, bold: true } },
  { text: "，不用重复敲字段。", options: { color: C.text } },
], {
  x: 0.5, y: 1.4, w: 9, h: 2.2,
  fontSize: 28, fontFace: FH,
});
s.addText("两端 LLM 能力 · 降低每个角色的摩擦", {
  x: 0.5, y: 4.0, w: 9, h: 0.5,
  fontSize: 18, fontFace: FH, color: C.muted, italic: true,
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 4.7, w: 0.6, h: 0.04,
  fill: { color: C.navy }, line: { color: C.navy, width: 0 },
});

// ============================================================
// 3 · 用户角色 & 闭环
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "用户角色 & 核心闭环", "HR / AI / 候选人 三方分工");

const roles = [
  {
    name: "HR",
    color: C.navy,
    steps: [
      "① 登录 /admin",
      "② 建岗：贴 JD → AI 生成 criteria",
      "③ 看候选人池（按分降序）",
      "④ 雷达图 + 一句话理由",
    ],
  },
  {
    name: "AI",
    color: C.coral,
    steps: [
      "① 解析简历（同步 5-15s）",
      "② parsed_resume → autofill",
      "③ 异步评分 · 5 维度",
      "④ 命中阈值 → 推飞书",
    ],
  },
  {
    name: "候选人",
    color: C.teal,
    steps: [
      "① 看岗位 /jobs",
      "② 邮箱验证码登录",
      "③ 上传简历 → AI 填表 → review",
      "④ 投递 → 「评估中」看状态",
    ],
  },
];
roles.forEach((role, i) => {
  const x = 0.4 + i * 3.15;
  s.addShape(pres.shapes.RECTANGLE, {
    x, y: 1.6, w: 3.05, h: 0.7,
    fill: { color: role.color }, line: { color: role.color, width: 0 },
  });
  s.addText(role.name, {
    x, y: 1.6, w: 3.05, h: 0.7,
    fontSize: 20, fontFace: FH, bold: true, color: C.white,
    align: "center", valign: "middle", margin: 0,
  });
  s.addText(
    role.steps.map((t, idx) => ({
      text: t,
      options: { breakLine: idx < role.steps.length - 1 },
    })),
    {
      x: x + 0.1, y: 2.45, w: 2.85, h: 2.5,
      fontSize: 12, fontFace: FB, color: C.text, paraSpaceAfter: 10,
    }
  );
});
s.addText("→ 高分候选人自动进 HR 飞书群，缩短筛选到面试的链路", {
  x: 0.5, y: 5.2, w: 9, h: 0.3,
  fontSize: 11, fontFace: FB, color: C.muted, align: "center", italic: true,
});

// ============================================================
// 4 · 卖点 1 · autofill
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "核心卖点 ①  AI 自动填表", "候选人侧 · 把\"重复敲字段\"交给 LLM");

const steps = [
  { t: "拖拽上传", d: "PDF / DOCX · 最大 10 MB" },
  { t: "STS 直传 COS", d: "前端临时凭证 · 不经过 server" },
  { t: "LLM 解析", d: "文本 → LLM #1 → ParsedResume JSON" },
  { t: "Autofill", d: "姓名/学校/经历/技能 自动填入" },
  { t: "Review → 提交", d: "候选人可修改任意字段" },
];
steps.forEach((st, i) => {
  const y = 1.5 + i * 0.6;
  s.addShape(pres.shapes.OVAL, {
    x: 0.5, y, w: 0.4, h: 0.4,
    fill: { color: C.coral }, line: { color: C.coral, width: 0 },
  });
  s.addText(String(i + 1), {
    x: 0.5, y, w: 0.4, h: 0.4,
    fontSize: 13, fontFace: FH, bold: true, color: C.white,
    align: "center", valign: "middle", margin: 0,
  });
  s.addText(st.t, {
    x: 1.05, y: y - 0.02, w: 3.8, h: 0.3,
    fontSize: 14, fontFace: FH, bold: true, color: C.text, margin: 0,
  });
  s.addText(st.d, {
    x: 1.05, y: y + 0.24, w: 3.8, h: 0.3,
    fontSize: 10, fontFace: FB, color: C.muted, margin: 0,
  });
});

s.addShape(pres.shapes.RECTANGLE, {
  x: 5.3, y: 1.5, w: 4.2, h: 3.55,
  fill: { color: C.navy }, line: { color: C.navy, width: 0 },
});
s.addText("价值主张", {
  x: 5.5, y: 1.7, w: 4, h: 0.3,
  fontSize: 11, fontFace: FH, color: C.coral, bold: true, charSpacing: 4, margin: 0,
});
s.addText("候选人平均节省", {
  x: 5.5, y: 2.1, w: 4, h: 0.35,
  fontSize: 14, fontFace: FH, color: C.ice, margin: 0,
});
s.addText([
  { text: "90", options: { color: C.white, fontSize: 64, bold: true } },
  { text: "%", options: { color: C.white, fontSize: 32, bold: true } },
], {
  x: 5.5, y: 2.45, w: 4, h: 1.4,
  fontFace: FH, margin: 0,
});
s.addText("表单输入时间", {
  x: 5.5, y: 3.95, w: 4, h: 0.3,
  fontSize: 13, fontFace: FH, color: C.ice, margin: 0,
});
s.addText("→ 提高投递完成率\n→ 降低招聘漏斗首层流失", {
  x: 5.5, y: 4.35, w: 4, h: 0.6,
  fontSize: 11, fontFace: FB, color: C.ice, italic: true, margin: 0,
});

// ============================================================
// 5 · 卖点 2 · JD → criteria
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "核心卖点 ②  JD 一键生成筛选标准", "HR 侧 · 把\"结构化条件\"交给 LLM");

// Before
s.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.5, w: 4.3, h: 3.55,
  fill: { color: C.white }, line: { color: C.divider, width: 1 },
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.5, w: 0.08, h: 3.55,
  fill: { color: C.muted }, line: { color: C.muted, width: 0 },
});
s.addText("传统做法", {
  x: 0.75, y: 1.65, w: 4, h: 0.35,
  fontSize: 13, fontFace: FH, color: C.muted, bold: true, charSpacing: 3, margin: 0,
});
s.addText([
  { text: "HR 读 JD 文本", options: { breakLine: true } },
  { text: "手动拆成硬性 / 技能 / 加分", options: { breakLine: true } },
  { text: "一条条敲到后台表单", options: { breakLine: true } },
  { text: "每个岗位重复一遍", options: {} },
], {
  x: 0.75, y: 2.15, w: 3.95, h: 2.3,
  fontSize: 13, fontFace: FB, color: C.text, paraSpaceAfter: 10,
});
s.addText("≈ 10-20 分钟 / 岗", {
  x: 0.75, y: 4.55, w: 3.95, h: 0.35,
  fontSize: 13, fontFace: FH, color: C.muted, italic: true,
});

// After
s.addShape(pres.shapes.RECTANGLE, {
  x: 5.2, y: 1.5, w: 4.3, h: 3.55,
  fill: { color: C.white }, line: { color: C.divider, width: 1 },
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 5.2, y: 1.5, w: 0.08, h: 3.55,
  fill: { color: C.coral }, line: { color: C.coral, width: 0 },
});
s.addText("庭宇的做法", {
  x: 5.45, y: 1.65, w: 4, h: 0.35,
  fontSize: 13, fontFace: FH, color: C.coral, bold: true, charSpacing: 3, margin: 0,
});
s.addText([
  { text: "粘贴整段 JD 自然语言", options: { breakLine: true } },
  { text: "点「生成」按钮", options: { breakLine: true } },
  { text: "LLM 5-10 秒返回 criteria", options: { breakLine: true } },
  { text: "HR 微调即可发布", options: {} },
], {
  x: 5.45, y: 2.15, w: 3.95, h: 2.3,
  fontSize: 13, fontFace: FB, color: C.text, paraSpaceAfter: 10,
});
s.addText("≈ 30 秒 / 岗", {
  x: 5.45, y: 4.55, w: 3.95, h: 0.35,
  fontSize: 13, fontFace: FH, color: C.coral, italic: true, bold: true,
});

s.addText("追加合并（不覆盖 HR 手填）· zod schema 校验 · 失败自动重试", {
  x: 0.5, y: 5.25, w: 9, h: 0.3,
  fontSize: 10, fontFace: FB, color: C.muted, align: "center", italic: true,
});

// ============================================================
// 6 · AI 评分两阶段
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "AI 评分流水线 · 两阶段", "解析（同步，解锁 autofill）+ 评分（异步，不阻塞）");

// Phase 1
s.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.55, w: 4.3, h: 3.55,
  fill: { color: C.white }, line: { color: C.divider, width: 1 },
});
s.addText("阶段 1 · 同步解析", {
  x: 0.75, y: 1.7, w: 4, h: 0.4,
  fontSize: 15, fontFace: FH, bold: true, color: C.teal, margin: 0,
});
s.addText("5-15 秒 · 候选人等候", {
  x: 0.75, y: 2.05, w: 4, h: 0.3,
  fontSize: 10, fontFace: FB, color: C.muted, italic: true, margin: 0,
});
s.addText([
  { text: "输入：", options: { bold: true, color: C.navy } },
  { text: "简历原文（≤ 12000 字）", options: { breakLine: true, color: C.text } },
  { text: "模型：", options: { bold: true, color: C.navy } },
  { text: "智谱 GLM-4-Flash", options: { breakLine: true, color: C.text } },
  { text: "输出：", options: { bold: true, color: C.navy } },
  { text: "ParsedResume JSON", options: { breakLine: true, color: C.text } },
  { text: "校验：", options: { bold: true, color: C.navy } },
  { text: "zod schema + 1 次重试", options: { breakLine: true, color: C.text } },
  { text: "用途：", options: { bold: true, color: C.navy } },
  { text: "autofill 申请表", options: { color: C.text } },
], {
  x: 0.75, y: 2.5, w: 3.95, h: 2.4,
  fontSize: 12, fontFace: FB, paraSpaceAfter: 6,
});

// Phase 2
s.addShape(pres.shapes.RECTANGLE, {
  x: 5.2, y: 1.55, w: 4.3, h: 3.55,
  fill: { color: C.white }, line: { color: C.divider, width: 1 },
});
s.addText("阶段 2 · 异步评分", {
  x: 5.45, y: 1.7, w: 4, h: 0.4,
  fontSize: 15, fontFace: FH, bold: true, color: C.coral, margin: 0,
});
s.addText("fire-and-forget · 不阻塞投递响应", {
  x: 5.45, y: 2.05, w: 4, h: 0.3,
  fontSize: 10, fontFace: FB, color: C.muted, italic: true, margin: 0,
});
s.addText([
  { text: "输入：", options: { bold: true, color: C.navy } },
  { text: "parsed_resume + job.criteria", options: { breakLine: true, color: C.text } },
  { text: "输出：", options: { bold: true, color: C.navy } },
  { text: "5 维度子分 + hard_pass + one_liner", options: { breakLine: true, color: C.text } },
  { text: "失败：", options: { bold: true, color: C.navy } },
  { text: "status=failed 不拖垮投递链路", options: { breakLine: true, color: C.text } },
  { text: "触发：", options: { bold: true, color: C.navy } },
  { text: "投递后 fetch /api/score/[id]", options: { breakLine: true, color: C.text } },
  { text: "后续：", options: { bold: true, color: C.navy } },
  { text: "命中阈值 → 推飞书群", options: { color: C.text } },
], {
  x: 5.45, y: 2.5, w: 3.95, h: 2.4,
  fontSize: 12, fontFace: FB, paraSpaceAfter: 6,
});

s.addText("prompt 工程详见 docs/prompt-engineering.md", {
  x: 0.5, y: 5.25, w: 9, h: 0.3,
  fontSize: 10, fontFace: FB, color: C.muted, align: "center", italic: true,
});

// ============================================================
// 7 · 透明度设计
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "评分透明度设计", "两侧不对等 · 有意为之");

const views = [
  {
    who: "对 HR",
    color: C.navy,
    list: [
      "✓ 总分 + 5 维度子分",
      "✓ 雷达图可视化",
      "✓ AI 一句话评价",
      "✓ 命中关键词高亮",
      "✓ 解析后完整 JSON",
      "✓ 飞书推送日志",
    ],
    why: "便于复核 · 发现算法偏差",
  },
  {
    who: "对 候选人",
    color: C.teal,
    list: [
      "✗ 不显示任何数字分",
      "✗ 不显示维度分解",
      "✓ 状态只有「评估中/已收到」",
      " ",
      " ",
      " ",
    ],
    why: "防反推算法 · 防评分偏见投诉",
  },
];
views.forEach((v, i) => {
  const x = 0.5 + i * 4.65;
  s.addShape(pres.shapes.RECTANGLE, {
    x, y: 1.5, w: 4.1, h: 3.55,
    fill: { color: C.white }, line: { color: C.divider, width: 1 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x, y: 1.5, w: 4.1, h: 0.55,
    fill: { color: v.color }, line: { color: v.color, width: 0 },
  });
  s.addText(v.who, {
    x, y: 1.5, w: 4.1, h: 0.55,
    fontSize: 16, fontFace: FH, bold: true, color: C.white,
    align: "center", valign: "middle", margin: 0,
  });
  s.addText(
    v.list.map((t, idx) => ({
      text: t,
      options: { breakLine: idx < v.list.length - 1 },
    })),
    {
      x: x + 0.3, y: 2.25, w: 3.5, h: 2.2,
      fontSize: 13, fontFace: FB, color: C.text, paraSpaceAfter: 6,
    }
  );
  s.addText("为什么：" + v.why, {
    x: x + 0.3, y: 4.55, w: 3.5, h: 0.4,
    fontSize: 11, fontFace: FB, color: v.color, italic: true, bold: true,
  });
});

// ============================================================
// 8 · 数据模型
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "数据模型 · 5 张表", "Drizzle schema 是 single source of truth");

const tables = [
  { name: "jobs", x: 0.5, y: 1.5, color: C.navy,
    fields: ["id · title · department", "criteria (JSON)", "push_threshold · status"] },
  { name: "applications", x: 3.6, y: 1.5, color: C.coral,
    fields: ["job_id · candidate_id", "parsed_resume · score", "status · pushed_at"] },
  { name: "candidates", x: 6.7, y: 1.5, color: C.teal,
    fields: ["id · email", "name · created_at"] },
  { name: "email_codes", x: 0.5, y: 3.3, color: C.muted,
    fields: ["email · code_hash", "expires_at · consumed"] },
  { name: "feishu_logs", x: 3.6, y: 3.3, color: C.muted,
    fields: ["application_id · job_id", "ok · response · created_at"] },
];

tables.forEach(t => {
  s.addShape(pres.shapes.RECTANGLE, {
    x: t.x, y: t.y, w: 2.8, h: 1.6,
    fill: { color: C.white }, line: { color: C.divider, width: 1 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: t.x, y: t.y, w: 2.8, h: 0.4,
    fill: { color: t.color }, line: { color: t.color, width: 0 },
  });
  s.addText(t.name, {
    x: t.x, y: t.y, w: 2.8, h: 0.4,
    fontSize: 14, fontFace: FM, bold: true, color: C.white,
    align: "center", valign: "middle", margin: 0,
  });
  s.addText(
    t.fields.map((f, idx) => ({
      text: f,
      options: { breakLine: idx < t.fields.length - 1 },
    })),
    {
      x: t.x + 0.15, y: t.y + 0.5, w: 2.55, h: 1.05,
      fontSize: 10, fontFace: FM, color: C.text, paraSpaceAfter: 4,
    }
  );
});

// right-side caption
s.addText([
  { text: "jobs (1:N) applications (N:1) candidates\n", options: { fontSize: 11, color: C.navy, bold: true } },
  { text: "\n简历文件存 COS · 表里只存 object key\n\n", options: { fontSize: 10, color: C.text } },
  { text: "5 张表应用层生成 uuid\nDB schema = SoT\ntypeof jobs.$inferSelect", options: { fontSize: 10, color: C.muted, italic: true } },
], {
  x: 6.7, y: 3.3, w: 2.8, h: 1.6,
  fontFace: FB, valign: "top", margin: 0,
});

// ============================================================
// 9 · 技术栈
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "技术栈 · 全国内栈", "为面试官访问体验考虑 · 不依赖海外 API");

const stack = [
  { layer: "Framework", name: "Next.js 14", sub: "App Router + RSC", color: C.navy },
  { layer: "Language", name: "TypeScript", sub: "Strict mode", color: C.navy },
  { layer: "Database", name: "TiDB Cloud", sub: "Serverless (MySQL)", color: C.teal },
  { layer: "ORM", name: "Drizzle ORM", sub: "schema = SoT", color: C.teal },
  { layer: "Storage", name: "腾讯云 COS", sub: "STS 直传", color: C.coral },
  { layer: "AI", name: "智谱 GLM-4-Flash", sub: "OpenAI 兼容 SDK", color: C.coral },
  { layer: "Auth", name: "自实现 JWT", sub: "密码 + 验证码", color: C.navy },
  { layer: "Push", name: "飞书机器人", sub: "HMAC-SHA256", color: C.teal },
];

stack.forEach((item, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 0.5 + col * 2.3;
  const y = 1.5 + row * 1.65;
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 2.1, h: 1.45,
    fill: { color: C.white }, line: { color: C.divider, width: 1 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 2.1, h: 0.08,
    fill: { color: item.color }, line: { color: item.color, width: 0 },
  });
  s.addText(item.layer, {
    x: x + 0.15, y: y + 0.2, w: 1.8, h: 0.25,
    fontSize: 9, fontFace: FH, color: item.color, bold: true, charSpacing: 2, margin: 0,
  });
  s.addText(item.name, {
    x: x + 0.15, y: y + 0.5, w: 1.8, h: 0.4,
    fontSize: 14, fontFace: FH, color: C.text, bold: true, margin: 0, valign: "top",
  });
  s.addText(item.sub, {
    x: x + 0.15, y: y + 0.95, w: 1.8, h: 0.35,
    fontSize: 10, fontFace: FB, color: C.muted, margin: 0, valign: "top",
  });
});

// ============================================================
// 10 · 关键设计决策
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "关键设计决策", "几个刻意的取舍");

const decisionRows = [
  [
    { text: "决策", options: { bold: true, color: C.white, fill: { color: C.navy } } },
    { text: "选择", options: { bold: true, color: C.white, fill: { color: C.navy } } },
    { text: "为什么", options: { bold: true, color: C.white, fill: { color: C.navy } } },
  ],
  ["核心卖点", "AI 自动填表", "候选人真实痛点在 autofill，不是 matching"],
  ["评分透明度", "HR 全开 / 候选人全闭", "复核需求 vs 防反推、防诉讼"],
  ["评分时机", "解析同步 · 评分异步", "投递响应 < 2s · 评分失败不阻断"],
  ["HR 入口", "首页不露 · footer 小字", "公开门户不该暴露内部系统"],
  ["简历存储", "前端 STS 直传 COS", "省服务器带宽 · 规避 body 上限"],
  ["LLM 鲁棒", "zod schema + 重试 + failed 状态", "LLM 会抖 · 坏数据不连坐"],
  ["鉴权", "共享密码 + 邮箱验证码", "作业场景不需要 RBAC"],
];

s.addTable(decisionRows, {
  x: 0.5, y: 1.5, w: 9, h: 3.7,
  colW: [1.6, 2.4, 5.0],
  fontSize: 11, fontFace: FB, color: C.text,
  border: { pt: 0.5, color: C.divider },
  rowH: 0.45,
  valign: "middle",
});

s.addText("细节 → docs/submission.md", {
  x: 0.5, y: 5.3, w: 9, h: 0.3,
  fontSize: 10, fontFace: FB, color: C.muted, align: "right", italic: true,
});

// ============================================================
// 11 · 演示加固 D6.5
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "演示加固 · D6.5", "假设线上部署 · 4 层护栏防 URL 被薅");

const guards = [
  { title: "HR 只读模式", body: "所有写入 API 返回 403\n仅保留 LLM 生成演示\n顶部黄色 banner 告知", color: C.navy },
  { title: "访问码门禁", body: "全站需 cookie · 缺码跳 /welcome\n链接内嵌 ?k=<code>\n30 天有效 · httpOnly", color: C.coral },
  { title: "投递次数限额", body: "每账号最多 N 次\n/resume/parse + 投递 POST 双挡\n防薅 LLM 账单", color: C.teal },
  { title: "AI 生成日上限", body: "JD→criteria 每日全局 10 次\n进程内存 fixed-window\n超限 429", color: C.gold },
];
guards.forEach((g, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.5 + col * 4.65;
  const y = 1.5 + row * 1.8;
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 4.3, h: 1.6,
    fill: { color: C.white }, line: { color: C.divider, width: 1 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.12, h: 1.6,
    fill: { color: g.color }, line: { color: g.color, width: 0 },
  });
  s.addText(g.title, {
    x: x + 0.32, y: y + 0.15, w: 3.9, h: 0.4,
    fontSize: 15, fontFace: FH, bold: true, color: g.color, margin: 0,
  });
  s.addText(g.body, {
    x: x + 0.32, y: y + 0.6, w: 3.9, h: 1,
    fontSize: 11, fontFace: FB, color: C.text, margin: 0, paraSpaceAfter: 2,
  });
});

s.addText("所有护栏通过 env 开关 · 未设 = 全关 · 本地 dev 无感", {
  x: 0.5, y: 5.3, w: 9, h: 0.3,
  fontSize: 10, fontFace: FB, color: C.muted, align: "center", italic: true,
});

// ============================================================
// 12 · 取舍与边界
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "取舍与边界", "砍了什么 · 为什么");

const trade = [
  [
    { text: "砍掉的", options: { bold: true, color: C.white, fill: { color: C.navy } } },
    { text: "理由", options: { bold: true, color: C.white, fill: { color: C.navy } } },
  ],
  ["候选人账号体系", "邮箱验证码 + 一次性投递已足够"],
  ["多岗位合并简历", "复杂度 vs 时间比不划算"],
  ["在线简历预览", "signed URL 下载已够 · pdfjs 坑多"],
  ["多租户 / RBAC", "单一共享密码够 · RBAC 要再 1 天"],
  ["i18n", "中文单场景"],
  ["流式 LLM 响应", "SSE 复杂度高 · 15s 内用户能等"],
  ["真邮件送达率保证", "Resend 免费够用 · SPF/DKIM 超范围"],
];
s.addTable(trade, {
  x: 0.5, y: 1.5, w: 9, h: 3.7,
  colW: [3, 6],
  fontSize: 12, fontFace: FB, color: C.text,
  border: { pt: 0.5, color: C.divider },
  rowH: 0.45,
  valign: "middle",
});

s.addText("每一项都是有意的 trade-off · 不是忘了做", {
  x: 0.5, y: 5.3, w: 9, h: 0.3,
  fontSize: 11, fontFace: FB, color: C.coral, align: "center", italic: true, bold: true,
});

// ============================================================
// 13 · 未来扩展
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "如果不限时 · 还想加的 5 件事", "招聘场景下的 AI 空间还很大");

const future = [
  { n: "1", title: "面试题 Agent", desc: "基于 parsed_resume + criteria 自动生成 3-5 个个性化面试题给 HR" },
  { n: "2", title: "相似候选人检索", desc: "embedding 检索已入池简历 · 「再找 10 个类似的」" },
  { n: "3", title: "评分版本化", desc: "criteria 改后历史候选人自动重打分 · 带 diff 视图" },
  { n: "4", title: "反馈闭环 → 调权重", desc: "HR 标记「不合适」累积训练集 · 调 criteria 权重" },
  { n: "5", title: "批量筛选", desc: "一次传 50 份 · 并发跑 · 导出 Excel" },
];
future.forEach((f, i) => {
  const y = 1.5 + i * 0.72;
  s.addShape(pres.shapes.OVAL, {
    x: 0.7, y, w: 0.55, h: 0.55,
    fill: { color: C.coral }, line: { color: C.coral, width: 0 },
  });
  s.addText(f.n, {
    x: 0.7, y, w: 0.55, h: 0.55,
    fontSize: 18, fontFace: FH, bold: true, color: C.white,
    align: "center", valign: "middle", margin: 0,
  });
  s.addText(f.title, {
    x: 1.45, y, w: 3.1, h: 0.3,
    fontSize: 14, fontFace: FH, bold: true, color: C.navy, margin: 0, valign: "top",
  });
  s.addText(f.desc, {
    x: 1.45, y: y + 0.3, w: 8, h: 0.35,
    fontSize: 11, fontFace: FB, color: C.text, margin: 0, valign: "top",
  });
});

// ============================================================
// 14 · 时间线
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "项目时间线", "7 天 vibe-coding · 每天 1+ commit");

const days = [
  { d: "D0", t: "脚手架 + 国内栈" },
  { d: "D1", t: "TiDB + 两种 auth" },
  { d: "D2", t: "HR 岗位 CRUD" },
  { d: "D3", t: "候选人投递流" },
  { d: "D4", t: "AI 解析 + 评分" },
  { d: "D5", t: "HR 池 + 飞书推送" },
  { d: "D6", t: "打磨 + 雷达图 + JD 生成" },
  { d: "D6.5", t: "演示加固" },
  { d: "D7", t: "文档 + 录屏" },
];

const tlY = 3.0;
s.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: tlY, w: 9, h: 0.04,
  fill: { color: C.divider }, line: { color: C.divider, width: 0 },
});

days.forEach((day, i) => {
  const x = 0.5 + (9 / (days.length - 1)) * i - 0.1;
  const dotColor = i < days.length - 1 ? C.coral : C.navy;
  s.addShape(pres.shapes.OVAL, {
    x, y: tlY - 0.1, w: 0.24, h: 0.24,
    fill: { color: dotColor }, line: { color: C.cream, width: 1.5 },
  });
  const labelAbove = i % 2 === 0;
  s.addText(day.d, {
    x: x - 0.5, y: labelAbove ? 1.95 : 3.3, w: 1.25, h: 0.3,
    fontSize: 13, fontFace: FH, bold: true, color: C.navy, align: "center", margin: 0,
  });
  s.addText(day.t, {
    x: x - 0.95, y: labelAbove ? 2.3 : 3.6, w: 2.15, h: 0.55,
    fontSize: 9, fontFace: FB, color: C.muted, align: "center", margin: 0, valign: "top",
  });
});

s.addText("Git 历史：git log --oneline 可看每天 1 条 commit 标题", {
  x: 0.5, y: 5.1, w: 9, h: 0.3,
  fontSize: 10, fontFace: FB, color: C.muted, align: "center", italic: true,
});

// ============================================================
// 15 · 提交物
// ============================================================
s = pres.addSlide();
s.background = { color: C.cream };
titleBar(s, "提交物 & 链接", "");

const items = [
  { icon: "GIT", name: "代码仓库", value: "github.com/bangerone/tingyu-resume-screener", note: "public · Git 历史干净" },
  { icon: "DOC", name: "设计文档", value: "docs/submission.md + 本 PPT", note: "产品定位 · 设计决策" },
  { icon: "MP4", name: "演示视频", value: "demo.mp4（约 5 分钟）", note: "本地跑完整流程 + 旁白" },
  { icon: "MD ", name: "面试官导览", value: "docs/interviewer-guide.md", note: "10 分钟走完整产品" },
  { icon: "ARCH", name: "架构 / 任务卡", value: "docs/architecture.md · docs/tasks/", note: "D0-D7 每天 1 张卡" },
];

items.forEach((item, i) => {
  const y = 1.5 + i * 0.72;
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y, w: 9, h: 0.6,
    fill: { color: C.white }, line: { color: C.divider, width: 1 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y, w: 0.8, h: 0.6,
    fill: { color: C.navy }, line: { color: C.navy, width: 0 },
  });
  s.addText(item.icon, {
    x: 0.5, y, w: 0.8, h: 0.6,
    fontSize: 11, fontFace: FM, bold: true, color: C.coral,
    align: "center", valign: "middle", margin: 0, charSpacing: 1,
  });
  s.addText(item.name, {
    x: 1.45, y: y + 0.08, w: 2.3, h: 0.45,
    fontSize: 14, fontFace: FH, bold: true, color: C.navy, margin: 0, valign: "middle",
  });
  s.addText(item.value, {
    x: 3.8, y: y + 0.08, w: 3.9, h: 0.45,
    fontSize: 11, fontFace: FM, color: C.text, margin: 0, valign: "middle",
  });
  s.addText(item.note, {
    x: 7.75, y: y + 0.1, w: 1.7, h: 0.45,
    fontSize: 9, fontFace: FB, color: C.muted, italic: true, margin: 0, valign: "middle",
  });
});

// ============================================================
// 16 · Thank you
// ============================================================
s = pres.addSlide();
s.background = { color: C.navy };
s.addShape(pres.shapes.OVAL, {
  x: -1, y: 3.5, w: 4, h: 4,
  fill: { color: C.coral, transparency: 85 }, line: { color: C.navy, width: 0 },
});
s.addShape(pres.shapes.OVAL, {
  x: 7, y: -1, w: 3.5, h: 3.5,
  fill: { color: C.teal, transparency: 75 }, line: { color: C.navy, width: 0 },
});
s.addText("Thank you.", {
  x: 0.5, y: 1.7, w: 9, h: 0.9,
  fontSize: 54, fontFace: "Georgia", italic: true, color: C.white, align: "center",
});
s.addText("欢迎面聊。", {
  x: 0.5, y: 2.7, w: 9, h: 0.5,
  fontSize: 22, fontFace: FH, color: C.ice, align: "center",
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 4.6, y: 3.55, w: 0.8, h: 0.03,
  fill: { color: C.coral }, line: { color: C.coral, width: 0 },
});
s.addText("庭宇科技面试作业 · 2026.04", {
  x: 0.5, y: 4.7, w: 9, h: 0.3,
  fontSize: 11, fontFace: FH, color: C.ice, align: "center", charSpacing: 3,
});

// ============================================================
await pres.writeFile({ fileName: "F:/tingyu-resume-screener/docs/presentation.pptx" });
console.log("✅ Saved: docs/presentation.pptx (16 slides)");
