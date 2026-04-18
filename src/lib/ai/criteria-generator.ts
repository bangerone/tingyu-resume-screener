// ============================================================
// Call #3 — JD → ScreeningCriteria
// ------------------------------------------------------------
// HR 在新建岗位时贴 JD，一键让 LLM 填筛选标准草稿。
// prompt 设计见 docs/prompt-criteria-gen.md。
// ============================================================

import { z } from "zod";
import { getAiClient, AI_MODELS } from "./provider";
import { screeningCriteriaSchema } from "@/features/jobs/job-schema";
import type { ScreeningCriteria } from "@/types";

export class CriteriaGenError extends Error {
  detail?: string;
  constructor(message: string, detail?: string) {
    super(message);
    this.name = "CriteriaGenError";
    this.detail = detail;
  }
}

const JD_MAX_CHARS = 2000;
const REQUEST_TIMEOUT_MS = 30_000;

const SYSTEM = `你是一名资深招聘专家。任务：把 HR 贴的「岗位 JD 文本」转成结构化的筛选标准 JSON。

抽取原则：
1. hard 只填「不满足即淘汰」的刚性条件。常见是学历 / 最低年限 / 工作地点。
   - kind="education"：value 用「大专 / 本科 / 硕士 / 博士」之一。
   - kind="min_years"：value 是整数年数。
   - kind="location"：value 是城市名。
   - 其它写 kind="custom"。
   - 如果 JD 只说"本科优先"这种软条件，不要放 hard，放 bonus。
2. skills 列 JD 里提到的所有技术/工具/方法。
   - level="must"：JD 用「熟练掌握 / 精通 / 必备 / 要求」描述的。
   - level="preferred"：JD 用「加分 / 了解 / 熟悉者优先」描述的。
   - weight：1(加分) / 3(重要) / 5(关键)，按 JD 语气判断，默认 3。
3. bonus 是非技术性的加分项：大厂背景 / 博客 / 开源贡献 / 竞赛获奖 / 独立作品等。
4. custom 填 JD 里提到、但不属于 hard/skills/bonus 的软性考察点：沟通能力、主动性、
   抗压、跨团队协作、业务理解等。每条给 description 告诉评估 AI 怎么判断。
5. schoolTiers 是**学校档次**要求。只在 JD 明确提及时才填，不要主观发挥。
   - tier 枚举（**必须全部小写**）：c9 / 985 / 211 / shuangyiliu / qs50 / qs100。
     · "C9" 写成 "c9"，"QS50/QS100" 写成 "qs50/qs100"，"双一流" 写成 "shuangyiliu"。
   - level="must"：JD 里写「只招 985/211」「仅 C9」等强制措辞 → 硬性。
   - level="bonus"：JD 里写「985/211 优先」「QS100 加分」「重点院校优先」等软性措辞 → 加分。
   - 不要把「本科及以上」之类的学历条件放这里（那是 hard.education）。

输出约束：
- 严格 JSON，不要 markdown code block，不要解释。
- 任何字段找不到，就输出空数组，不要编造。
- 中文字段（label/name/description）全部简体中文。
- skills 去重，name 用规范写法（React 不写成 react / ReactJS）。`;

function userPrompt(jd: string): string {
  return `[岗位 JD]
<<<<
${jd}
>>>>

[Output JSON Schema]
{
  "hard": [{"kind":"education|min_years|location|custom","label":"string","value":"string or number"}],
  "skills": [{"name":"string","weight":1-5,"level":"must|preferred"}],
  "bonus": ["string"],
  "custom": [{"name":"string","weight":1-5,"description":"string"}],
  "schoolTiers": [{"tier":"c9|985|211|shuangyiliu|qs50|qs100","level":"must|bonus"}]
}`;
}

async function callOnce(jd: string, retryHint?: string): Promise<unknown> {
  const client = getAiClient();
  const system = retryHint
    ? `${SYSTEM}\n\n[重试提示] 上次返回不符合 schema：${retryHint}。请严格按 schema 输出 JSON。`
    : SYSTEM;

  const res = await client.chat.completions.create(
    {
      model: AI_MODELS.score,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt(jd) },
      ],
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );

  const raw = res.choices[0]?.message?.content ?? "";
  if (!raw) throw new CriteriaGenError("LLM 返回空内容");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new CriteriaGenError(
      "LLM 返回不是合法 JSON",
      e instanceof Error ? e.message : String(e),
    );
  }
}

function summarizeZod(err: z.ZodError): string {
  return err.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

export async function generateCriteriaFromJD(
  jdRaw: string,
): Promise<ScreeningCriteria> {
  const jd = (jdRaw ?? "").trim().slice(0, JD_MAX_CHARS);
  if (jd.length < 20) {
    throw new CriteriaGenError("JD 内容太短，至少 20 个字");
  }

  let lastErr: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    let json: unknown;
    try {
      json = await callOnce(jd, lastErr);
    } catch (e) {
      if (e instanceof CriteriaGenError) {
        lastErr = e.message + (e.detail ? ` (${e.detail})` : "");
        continue;
      }
      throw e;
    }

    const parsed = screeningCriteriaSchema.safeParse(json);
    if (parsed.success) {
      // screeningCriteriaSchema 已是 ScreeningCriteria 形状（hard.value 可能是
      // string | number，和 runtime 类型保持一致）
      return parsed.data as ScreeningCriteria;
    }
    lastErr = summarizeZod(parsed.error);
  }

  throw new CriteriaGenError("生成结果两次均不符合 schema", lastErr);
}
