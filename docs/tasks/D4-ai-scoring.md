# D4 — AI 简历解析 + 评分（双端到端打通）

## Status: ✅ Done

## Goal
1. **移除 D3 的 mock**：`/api/resume/parse` 用真实 LLM 跑通
2. 实现 `/api/score/[id]`：后台异步评分，写回 `applications.score`
3. 投递一份真实简历 → 2 分钟内 HR 在 TiDB 看到完整 parsed_resume + score

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
9. 端到端：真机投递一份简历，观察 TiDB 里 parsed_resume + score 都是合法 JSON

## Acceptance
- [x] D3 投递流程现在用真实 AI 解析填表（不再 mock）—— /api/resume/parse 已换成 COS download → pdf-parse/mammoth → LLM，mock 代码完全移除
- [x] 投递成功后 60s 内 `applications` 行的 `score` 字段有 ScoreResult JSON —— E2E 实测：上传 docx 简历 → 自动解析 → 投递 → fire-and-forget 触发评分，<30s 内 `status=scored, total=85`
- [x] `score.total` 在 0-100，breakdown 各维度完整（hard/skills/experience/bonus/custom）
- [x] `passed_hard=false` 时 `total ≤ 49` —— clamp 逻辑在 scorer.ts 实测：hard-fail fixture total=0, partial fixture total=45
- [x] fixture 测试：强候选人 85（≥80）、硬性不过 0（≤49）、部分匹配 45（30-70）
- [x] 乱码文件 / 空 PDF → 400 错误 + 明确文案（上传乱码 bytes 实测返回 `Invalid PDF structure`）；LLM 评分异常 → status=`failed`, fail_reason 有内容（earlier 402 case 实测 fail_reason="score: 402 Insufficient Balance"）
- [x] 重跑 POST `/api/score/[id]` → 覆盖更新不重复插入（DB rowcount 稳定 1 行）
- [x] `npm run build` 0 error

## Notes
- **AI provider**：DeepSeek 账户余额不足，切到 **智谱 GLM-4-Flash**（免费 100 万 tokens/天），通过 `AI_API_KEY / AI_BASE_URL / AI_MODEL_PARSE / AI_MODEL_SCORE` env 覆盖，代码无需改。
- **pdf-parse 坑**：默认 `require('pdf-parse')` 会在 import 时读磁盘 demo 文件触发 ENOENT，统一改用 `pdf-parse/lib/pdf-parse.js` 子模块，配套加了 `src/types/pdf-parse-lib.d.ts`。
- **Fire-and-forget**：`/api/applications` 成功后不 await 地 fetch `/api/score/[id]` 带 `x-internal-score-token` 头（值 = `INTERNAL_SCORE_TOKEN ?? JWT_SECRET`），score route 双鉴权（internal token 或 HR session）。
- **验证脚本**（非核心交付）：`scripts/upload-demo-docx.mjs` / `scripts/upload-garbage.mjs` 用来验证 happy/fail path，可 D7 之前删除或保留作 demo。

## Out of scope
- 不做飞书推送（D5）
- 不做评分结果 UI 展示（D5）
- 不做 JD → criteria 反向生成（D6 加分项）
- 不做多模态（直接喂 PDF 给 LLM）
