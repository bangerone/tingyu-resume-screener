// ============================================================
// 一次性种子脚本：批量补充详细的 demo 岗位
// ============================================================
// 用法：
//   node scripts/seed-jobs.mjs
// 幂等：按 title 去重，已存在则跳过（不覆盖 HR 手工编辑的记录）。
// 第一个"高级前端工程师"如果描述太短会扩写一次。
// ============================================================
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
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

const DEMO_JOBS = [
  {
    title: "高级前端工程师",
    department: "技术中心 · Web",
    location: "上海 / 北京",
    pushThreshold: 80,
    description: `## 关于岗位
负责庭宇核心 SaaS 产品的前端架构与实现，和产品、设计、后端端到端协作，打磨面向企业客户的复杂 Web 体验。加入我们你会跟一个资深的小团队一起，真正拥有 0→1 的设计自由度。

## 你会做什么
- 主导 1-2 条核心产品线的前端架构决策（SSR 策略、状态分层、组件库、构建与部署管线）
- 设计可复用的业务组件，和设计师共建庭宇自己的 Design System
- 关注关键路径的性能、可访问性与监控，持续把 LCP / TBT / CLS 控制在行业前 10%
- Mentor 1-2 名初中级同学，推动 code review 与工程文化

## 我们希望你
- 3 年以上 React + TypeScript 生产经验，至少独立交付过一个中大型项目
- 熟悉 Next.js App Router（或同等 SSR / RSC 方案），理解其渲染/缓存模型
- 对工程化有自己的主张：打包、lint、测试、CI、灰度，任一方向有深度都欢迎
- 有审美，知道"能用"和"好用"的差距在哪里
- 加分：Node 后端经验 / 可视化（D3、Recharts）/ 复杂表单 / 可访问性实战`,
    criteria: {
      hard: [
        { kind: "education", label: "本科及以上", value: "本科" },
        { kind: "min_years", label: "3 年以上相关经验", value: 3 },
      ],
      skills: [
        { name: "React", weight: 5, level: "must" },
        { name: "TypeScript", weight: 5, level: "must" },
        { name: "Next.js", weight: 4, level: "preferred" },
        { name: "Tailwind CSS", weight: 3, level: "preferred" },
        { name: "Node.js", weight: 3, level: "preferred" },
      ],
      bonus: ["有大厂或成熟 SaaS 产品经验", "有开源项目或技术博客", "有组件库建设经验"],
      custom: [
        { name: "工程素养", weight: 4, description: "CI/构建/监控/灰度等工程化实践深度" },
        { name: "产品视角", weight: 3, description: "能在业务上下文里做技术取舍" },
      ],
    },
  },
  {
    title: "全栈工程师（Node + React）",
    department: "技术中心 · 应用",
    location: "上海 / 远程",
    pushThreshold: 78,
    description: `## 关于岗位
跟产品一起从 0 到 1 搭建庭宇的内部 AI 工具矩阵（招聘、客服、销售线索），技术栈自由度极高，更看重你解决问题的速度与质量。

## 你会做什么
- 独立负责 2-3 个小型全栈产品：前后端、数据库、部署一把抓
- 跟大模型打交道：prompt 设计、工具调用、RAG、异步任务编排
- 关键业务逻辑写好自动化测试，保证改动不引发回归
- 根据数据反馈快速迭代，每两周一个可上线版本

## 我们希望你
- 2 年以上全栈经验，前后端都能独立产出（至少一端是主力）
- 熟悉 TypeScript / Node.js / React 任意现代框架
- 熟悉关系型数据库设计（索引、事务、迁移），用过 PostgreSQL 或 MySQL
- 对 LLM 应用有真实上手经验：写过 agent / tool-use / function calling / RAG
- 加分：DevOps、腾讯云 / 阿里云部署、可观测性体系`,
    criteria: {
      hard: [
        { kind: "min_years", label: "2 年以上全栈经验", value: 2 },
      ],
      skills: [
        { name: "TypeScript", weight: 5, level: "must" },
        { name: "Node.js", weight: 5, level: "must" },
        { name: "React", weight: 4, level: "must" },
        { name: "SQL", weight: 4, level: "preferred" },
        { name: "LLM / Prompt", weight: 4, level: "preferred" },
      ],
      bonus: ["有完整交付过 AI 应用", "熟悉国内云（腾讯云/阿里云）部署"],
      custom: [
        { name: "端到端能力", weight: 5, description: "能独立 own 一个小产品从设计到上线" },
        { name: "AI 应用经验", weight: 4, description: "真正写过 agent / RAG 等而非仅调用 API" },
      ],
    },
  },
  {
    title: "AI 产品经理",
    department: "产品中心",
    location: "上海",
    pushThreshold: 82,
    description: `## 关于岗位
负责庭宇 AI 产品线的方向、节奏与落地，直接汇报给 CEO。你将参与定义我们接下来 12 个月的产品蓝图。

## 你会做什么
- 从用户调研到需求拆解到上线复盘，完整 own 一条产品线
- 深入理解 LLM 能力边界，把"技术可能"翻译成"商业价值"
- 用数据指导每一次迭代：打点方案、A/B、留存与转化分析
- 和工程、设计、BD 协作，带着团队把事情做漂亮

## 我们希望你
- 3 年以上 B 端或 SaaS 产品经理经验，至少主导过一个从 0 到 1 的模块
- 有做 AI 相关产品的经历（Copilot 类、Agent 类、内容生成类均可）
- 文档、Figma、SQL、基础数据分析工具都能上手
- 逻辑清晰，沟通直接，对数字敏感
- 加分：有技术背景（CS / 数学） / 出海产品经验 / 用户访谈方法论`,
    criteria: {
      hard: [
        { kind: "education", label: "本科及以上", value: "本科" },
        { kind: "min_years", label: "3 年以上 PM 经验", value: 3 },
      ],
      skills: [
        { name: "B 端产品设计", weight: 5, level: "must" },
        { name: "数据分析 / SQL", weight: 4, level: "must" },
        { name: "AI 产品实战", weight: 5, level: "must" },
        { name: "用户访谈", weight: 3, level: "preferred" },
      ],
      bonus: ["有技术背景", "有出海或跨国 B 端经验"],
      custom: [
        { name: "商业判断力", weight: 5, description: "能为 AI 功能算清 ROI" },
        { name: "落地执行力", weight: 4, description: "拆解需求、协调资源、按节奏交付" },
      ],
    },
  },
  {
    title: "高级后端工程师（Go）",
    department: "技术中心 · 基础架构",
    location: "上海 / 北京",
    pushThreshold: 80,
    description: `## 关于岗位
加入基础架构团队，负责庭宇的网关、任务调度、数据管道等核心后端基础设施。系统承载着公司所有 AI 产品的关键调用。

## 你会做什么
- 设计与实现高并发的 API 网关与异步任务调度系统（QPS 万级起步）
- 优化大模型调用链：缓存、熔断、排队、成本控制
- 跟 SRE 一起完善监控、日志、告警、容量规划
- 参与数据平台选型，和数据工程同学共建

## 我们希望你
- 4 年以上后端开发经验，Go 为主力语言
- 扎实的分布式系统基础：一致性、幂等、限流、降级、熔断
- 至少熟练使用 Kafka / Redis / PostgreSQL 或 TiDB 中的一个
- 读过并理解至少一个开源项目的源码（能聊清楚设计取舍）
- 加分：SRE 经验 / 大模型推理服务经验 / 开源贡献`,
    criteria: {
      hard: [
        { kind: "education", label: "本科及以上", value: "本科" },
        { kind: "min_years", label: "4 年以上后端经验", value: 4 },
      ],
      skills: [
        { name: "Go", weight: 5, level: "must" },
        { name: "分布式系统", weight: 5, level: "must" },
        { name: "PostgreSQL / TiDB", weight: 4, level: "preferred" },
        { name: "Kafka / Redis", weight: 4, level: "preferred" },
        { name: "Kubernetes", weight: 3, level: "preferred" },
      ],
      bonus: ["有开源贡献", "做过大模型推理服务"],
      custom: [
        { name: "系统设计深度", weight: 5, description: "能在白板上画清楚一套 HA 架构" },
        { name: "线上稳定性意识", weight: 4, description: "监控 / 降级 / 容灾等一线实战经验" },
      ],
    },
  },
  {
    title: "资深 UI/UX 设计师",
    department: "设计中心",
    location: "上海",
    pushThreshold: 78,
    description: `## 关于岗位
庭宇第三位设计师，参与定义公司级设计语言，与前端共建 Design System。你会直接影响每一个庭宇产品的"第一印象"。

## 你会做什么
- 主导 1-2 条产品线的视觉与交互设计，端到端 own 体验
- 和 PM 一起做用户研究、可用性测试，把洞察转成设计决策
- 输出高保真 Figma 原型，和前端工程师一起保证像素级还原
- 沉淀并维护庭宇的 Design System（组件、token、文案规范）

## 我们希望你
- 4 年以上 B 端 / SaaS 产品设计经验，有过可晒出的完整 case
- Figma 熟练，懂 auto layout、variants、token 体系
- 审美在线，对排版、留白、动效有自己的理解
- 理解前端实现边界，能和工程师高效协作
- 加分：有 motion / 插画 / 品牌视觉经验`,
    criteria: {
      hard: [
        { kind: "min_years", label: "4 年以上设计经验", value: 4 },
      ],
      skills: [
        { name: "B 端产品设计", weight: 5, level: "must" },
        { name: "Figma", weight: 5, level: "must" },
        { name: "Design System", weight: 4, level: "must" },
        { name: "用户研究", weight: 3, level: "preferred" },
        { name: "Motion 动效", weight: 2, level: "preferred" },
      ],
      bonus: ["有品牌 / 插画背景", "能输出高质量产品物料视频"],
      custom: [
        { name: "作品质量", weight: 5, description: "作品集视觉与交互打磨程度" },
        { name: "协作方式", weight: 3, description: "能把设计决策讲清楚并推动落地" },
      ],
    },
  },
  {
    title: "数据分析工程师",
    department: "数据中心",
    location: "上海 / 远程",
    pushThreshold: 76,
    description: `## 关于岗位
搭建庭宇的数据底座，服务于产品、运营、商业化团队。你的分析会直接出现在每周经营会上。

## 你会做什么
- 从 0 到 1 搭建公司级数据仓库与看板（Metabase / Superset）
- 设计关键业务指标体系：AARRR、北极星指标、健康度模型
- 协助 PM 做 A/B 实验设计与结果分析
- 定期输出洞察报告，推动业务侧行动

## 我们希望你
- 2 年以上数据分析或数据工程经验
- SQL 熟练（窗口函数、CTE、执行计划都聊得清），Python 能写分析脚本
- 有 ETL / 数据建模经验（Dim/Fact、星型模型）
- 沟通清晰，能把数据讲成故事
- 加分：了解 ClickHouse / DuckDB / dbt / 实验平台建设`,
    criteria: {
      hard: [
        { kind: "education", label: "本科及以上", value: "本科" },
        { kind: "min_years", label: "2 年以上数据相关经验", value: 2 },
      ],
      skills: [
        { name: "SQL", weight: 5, level: "must" },
        { name: "Python", weight: 4, level: "must" },
        { name: "数据建模", weight: 4, level: "preferred" },
        { name: "A/B 实验", weight: 3, level: "preferred" },
        { name: "ClickHouse / dbt", weight: 2, level: "preferred" },
      ],
      bonus: ["有数据看板搭建经验", "有实验平台建设经验"],
      custom: [
        { name: "业务敏感度", weight: 4, description: "能从指标异常倒推业务问题" },
        { name: "工程化能力", weight: 3, description: "管道稳定性、可维护性" },
      ],
    },
  },
];

const u = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: u.hostname,
  port: Number(u.port) || 4000,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, "") || "test",
  ssl: { rejectUnauthorized: true },
});

const [existing] = await conn.query(
  "SELECT id, title, CHAR_LENGTH(description) AS len FROM jobs",
);
const byTitle = new Map(existing.map((r) => [r.title, r]));

let created = 0;
let updated = 0;

for (const j of DEMO_JOBS) {
  const hit = byTitle.get(j.title);
  if (hit) {
    // 描述过短（< 200 字）时才覆盖，避免踩掉 HR 手动编辑
    if (hit.len < 200) {
      await conn.query(
        "UPDATE jobs SET description = ?, department = ?, location = ?, criteria = ?, push_threshold = ?, status = 'open' WHERE id = ?",
        [
          j.description,
          j.department,
          j.location,
          JSON.stringify(j.criteria),
          j.pushThreshold,
          hit.id,
        ],
      );
      updated++;
      console.log(`updated: ${j.title}`);
    } else {
      console.log(`skip   : ${j.title} (已有详细描述)`);
    }
    continue;
  }
  await conn.query(
    `INSERT INTO jobs (id, title, department, location, description, criteria, push_threshold, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
    [
      randomUUID(),
      j.title,
      j.department,
      j.location,
      j.description,
      JSON.stringify(j.criteria),
      j.pushThreshold,
    ],
  );
  created++;
  console.log(`created: ${j.title}`);
}

await conn.end();
console.log(`\ndone. created=${created}, updated=${updated}`);
