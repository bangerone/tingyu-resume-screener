# Prompt Engineering — 简历解析 + 评分

两次 LLM 调用，各自单一职责。**禁止**用一个 prompt 同时干两件事。

## Call #1 — 简历结构化

**Model**: `AI_MODEL_PARSE`（默认 `deepseek-chat`）
**温度**: 0.1（事实抽取，需要稳定）
**响应格式**: 强制 JSON Object（`response_format: { type: "json_object" }`）

### System

```
你是一名资深 HR 信息抽取专家。任务：把简历纯文本转成结构化 JSON。
要求：
1. 严格按给定 schema 输出，不要多任何字段。
2. 找不到的字段填空字符串或空数组，不要编造。
3. total_years = 所有工作经历去重合并后的总年限（数字，保留 1 位小数）。
4. 项目和实习都算 experience。
5. raw_text 直接复制原文（截断到 4000 字以内）。
```

### User

```
JSON Schema:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "total_years": number,
  "education": [{ "school":"string","degree":"string","major":"string","period":"string" }],
  "experience": [{ "company":"string","title":"string","period":"string","summary":"string" }],
  "skills": ["string"],
  "projects": [{ "name":"string","role":"string","summary":"string" }],
  "raw_text": "string"
}

简历原文：
<<<<
{{ resume_text_truncated_12000 }}
>>>>
```

### 后处理

- 用 `zod` 校验返回的 JSON。失败则重试 1 次，把上次的错误信息塞进 system 提示。
- 二次失败 → 标记 `application.status = failed`，`fail_reason = 'parse_failed'`。

---

## Call #2 — 岗位匹配评分

**Model**: `AI_MODEL_SCORE`（默认 `deepseek-chat`）
**温度**: 0.2
**响应格式**: JSON Object

### System

```
你是一名严格、公平的招聘评估官。基于「岗位筛选标准」对「候选人结构化简历」打分。
打分原则：
1. 先判断硬性要求 (criteria.hard) 是否全部满足。任一未满足 → passed_hard=false，且 total 不超过 50。
2. skills 中 level=must 的，未掌握每项扣 15 分；level=preferred 的，掌握每项加 weight*2 分（满分制按比例归一）。
3. experience 子分 0-100：经验年限、项目相关性、岗位 title 匹配度综合打。
4. bonus 命中每条加 3 分（最多加 15）。
5. custom 维度按 description 自行判断 0-100。
6. total = round( hard_clamp( 0.4 * skills + 0.3 * experience + 0.15 * bonus + 0.15 * custom_avg ) )
   - hard_clamp：若 passed_hard=false，min(total, 49)。
7. reasoning 用一句话（不超过 60 字）说明亮点 + 主要缺口。
8. 严禁基于姓名/性别/年龄/院校歧视，仅基于 criteria 描述的能力判断。
9. 输出严格 JSON，不要 markdown，不要解释。
```

### User

```
[岗位]
title: {{ job.title }}
description: {{ job.description }}

[筛选标准]
{{ JSON.stringify(job.criteria, null, 2) }}

[候选人结构化简历]
{{ JSON.stringify(parsed_resume, null, 2) }}

[Output JSON Schema]
{
  "total": number 0-100,
  "passed_hard": boolean,
  "breakdown": {
    "hard": [{"label":"string","pass":boolean,"reason":"string"}],
    "skills": [{"name":"string","required_weight":number,"matched":boolean}],
    "experience": {"score":number,"reason":"string"},
    "bonus": [{"item":"string","hit":boolean}],
    "custom": [{"name":"string","score":number,"reason":"string"}]
  },
  "highlights": ["string"],
  "red_flags": ["string"],
  "reasoning": "string"
}
```

### 后处理

- zod 严格校验，失败重试 1 次。
- 计算 score 后再做一次 sanity check：
  - 若 `passed_hard === false && total > 49` → 强制 `total = 49`
  - `total` clamp 到 `[0, 100]`

---

## 测试 fixture（D4 用）

`src/lib/ai/__fixtures__/`：
- `parsed-strong-react.json` — 强候选人（应得 85+）
- `parsed-junior.json` — 经验不足（应被 hard 拒）
- `parsed-mismatch.json` — 技能不匹配（应得 30-50）

D4 任务里写 3 个 unit-ish test 直接喂这些 fixture 给 scorer，验证产出在预期区间。

---

## 成本估算

| Call | 输入 tokens | 输出 tokens | 单价（DeepSeek） |
|---|---|---|---|
| Parse | ~3000 | ~1000 | ¥0.003 + ¥0.002 |
| Score | ~2000 | ~600 | ¥0.002 + ¥0.0012 |
| 合计 | — | — | **~¥0.008/简历** |

100 份简历约 ¥1，符合 demo 成本预期。
