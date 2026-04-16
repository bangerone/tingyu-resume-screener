# D4 — AI 简历解析 + 评分（双端到端打通）

## Status: ⏳ Pending

## Goal
1. **移除 D3 的 mock**：`/api/resume/parse` 用真实 LLM 跑通
2. 实现 `/api/score/[id]`：后台异步评分，写回 `applications.score`
3. 投递一份真实简历 → 2 分钟内 HR 在 Supabase 看到完整 parsed_resume + score

## Inputs (必读)
- `CLAUDE.md` §4 两阶段流水线
- **`docs/prompt-engineering.md`** ← 完整 prompt 定义
- `src/types/index.ts` (ParsedResume / ScoreResult)
- `src/lib/ai/provider.ts` 骨架

## Deliverables

### 文本抽取
- `src/lib/ai/extract.ts` — `extractTextFromBuffer(buf, mime): Promise<string>`
  - PDF → `pdf-parse`
  - docx → `mammoth.extractRawText`
  - 其他 → throw unsupported

### Prompts + Schemas
- `src/lib/ai/prompts.ts` — 导出 `PARSE_SYSTEM`, `parseUserPrompt(text)`, `SCORE_SYSTEM`, `scoreUserPrompt(criteria, parsed)`（内容严格照抄 `prompt-engineering.md`）
- `src/lib/ai/schemas.ts` — zod schemas 对齐 `src/types/index.ts`

### 核心封装
- `src/lib/ai/parser.ts` — `parseResume(text): Promise<ParsedResume>`
- `src/lib/ai/scorer.ts` — `scoreResume(parsed, job): Promise<ScoreResult>`
  - 含 sanity clamp：`passed_hard=false` → `total = min(total, 49)`
  - 失败重试 1 次，把上次错误信息塞进 system 提示

### API Routes
- **替换** `src/app/api/resume/parse/route.ts` — 去掉 D3 的 mock，接入 `parser.ts`
- **新增** `src/app/api/score/[id]/route.ts` — POST 执行评分
  - 读取 application → 拿 parsed_resume + job
  - 调 scorer → 写回 score + status
  - （D5 加入飞书推送；D4 只 console.log 占位）

### Fixtures（可选但推荐）
- `src/lib/ai/__fixtures__/parsed-strong.json` — 预期 ≥85 的候选人
- `src/lib/ai/__fixtures__/parsed-hard-fail.json` — 硬性不过
- `src/lib/ai/__fixtures__/parsed-partial.json` — 部分匹配
- `src/app/api/dev/test-scorer/route.ts` — dev-only，POST `{fixture, job_id}` → 返回 ScoreResult（不落库），方便调试

## Steps
1. 装 deps（package.json 已列 `pdf-parse` `mammoth` `zod` `openai`）
2. 写 `extract.ts`，在本地用 `node --input-type=module -e "..."` 快速试跑一份 PDF
3. 复制 `prompt-engineering.md` 内容到 `prompts.ts`（字符串字面量，保持 schema 一字不差）
4. 写 `schemas.ts`，和 `src/types/index.ts` 对齐
5. 写 `parser.ts`：chat completion → `JSON.parse` → zod → 失败重试 1 次
6. 写 `scorer.ts`：同上 + clamp 逻辑
7. 替换 `/api/resume/parse` 里的 mock
8. 写 `/api/score/[id]`：带错误分支（任何 step 失败 → status=failed + fail_reason）
9. 端到端：真机投递一份简历，观察 Supabase 里 parsed_resume + score 都是合法 JSON

## Acceptance
- [ ] D3 投递流程现在用真实 AI 解析填表（不再 mock）
- [ ] 投递成功后 60s 内 `applications` 行的 `score` 字段有 ScoreResult JSON
- [ ] `score.total` 在 0-100，breakdown 各维度完整
- [ ] `passed_hard=false` 时 `total ≤ 49`
- [ ] fixture 测试：强候选人 ≥80、硬性不过 ≤49、部分匹配 30-70
- [ ] 乱码文件 / 空 PDF → status=`failed`, fail_reason 有内容
- [ ] 重跑 POST `/api/score/[id]` → 覆盖更新不重复插入
- [ ] `npm run build` 0 error

## Out of scope
- 不做飞书推送（D5）
- 不做评分结果 UI 展示（D5）
- 不做 JD → criteria 反向生成（D6 加分项）
- 不做多模态（直接喂 PDF 给 LLM）
