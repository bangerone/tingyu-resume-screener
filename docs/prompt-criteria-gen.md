# Prompt 设计 · JD → ScreeningCriteria

> D6 亮点：HR 在新建岗位时贴 JD 文本，一键让 LLM 生成结构化 criteria 草稿（hard/skills/bonus/custom），HR 只需在编辑器里微调再保存。对偶于候选人侧「AI 自动解析简历填表」，把「AI 省重复劳动」的卖点延伸到 HR 侧。

## 输入 / 输出

- **输入**：HR 贴的 JD 纯文本（职位描述 + 任职要求，2000 字以内）。
- **输出**：严格符合 `ScreeningCriteria` 形状的 JSON：
  ```ts
  {
    hard: { kind: "education"|"min_years"|"location"|"custom", label, value }[],
    skills: { name, weight: 1-5, level: "must"|"preferred" }[],
    bonus: string[],
    custom: { name, weight: 1-5, description }[],
  }
  ```
- **模型**：`AI_MODELS.score`（默认 `deepseek-chat`，复用现有 provider）。
- **温度**：0.2（要求结构稳定，略保留抽取创造性）。
- **超时**：30s，失败重试 1 次（prompt 追加 zod 错误摘要）。

## Prompt 结构

### System

```
你是一名资深招聘专家。任务：把 HR 贴的「岗位 JD 文本」转成结构化的筛选标准 JSON。

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

输出约束：
- 严格 JSON，不要 markdown code block，不要解释。
- 任何字段找不到，就输出空数组，不要编造。
- 中文字段（label/name/description）全部简体中文。
- skills 去重，name 用规范写法（React 不写成 react / ReactJS）。
```

### User

```
[岗位 JD]
<<<<
{jd_text}
>>>>

[Output JSON Schema]
{
  "hard": [{"kind":"education|min_years|location|custom","label":"string","value":"string or number"}],
  "skills": [{"name":"string","weight":1-5,"level":"must|preferred"}],
  "bonus": ["string"],
  "custom": [{"name":"string","weight":1-5,"description":"string"}]
}
```

## 调用参数

| 参数 | 值 |
|---|---|
| model | `AI_MODELS.score`（deepseek-chat） |
| temperature | 0.2 |
| response_format | `{ type: "json_object" }` |
| max_tokens | 不限（通常 < 1500） |
| timeout | 30s |
| retry | 1 次 + zod 错误摘要回灌 |

## 校验

- 复用 `src/features/jobs/job-schema.ts` 的 `screeningCriteriaSchema` 做 zod 校验。
- 两次都不过就返回 500 给前端弹 toast（不降级）。

## 注意事项

- 前端 JD 输入长度硬截到 2000 字，避免 prompt 爆。
- 生成后 **不是直接覆盖表单**，而是**追加**到当前 criteria（用户可能已经手填了一部分）。
- 生成后 toast 提示"已自动填充草稿，请检查并保存"。

## 禁止

- 不要在生成 criteria 时夹带任何歧视性判据（年龄、性别、院校）—— system 里不提即可，LLM 不会主动加。
- 不要在 API 路由里直接暴露 LLM 原始返回 —— 必须 zod 校验后才吐给前端。
