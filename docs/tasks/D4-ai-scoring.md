# D4 — AI 解析 + 评分流水线（核心）

## Status: ⏳ Pending

## Goal
投递触发的 `/api/score/[id]` 端到端跑通：从 storage 拉文件 → 抽文本 → LLM 解析 → LLM 评分 → 写回 DB。

## Inputs (必读)
- `CLAUDE.md` §4 评分流水线
- `docs/prompt-engineering.md` ⚠️ **重点读**
- `src/types/index.ts` (ParsedResume / ScoreResult)
- `src/lib/ai/provider.ts` 骨架

## Deliverables
- `src/app/api/score/[id]/route.ts` — POST 触发评分
- `src/lib/ai/extract.ts` — `extractTextFromBuffer(buf, mimeType): Promise<string>`
  - PDF → `pdf-parse`
  - docx → `mammoth.extractRawText`
- `src/lib/ai/prompts.ts` — `PARSE_SYSTEM`, `parseUserPrompt(text)`, `SCORE_SYSTEM`, `scoreUserPrompt(criteria, parsed)`
- `src/lib/ai/parser.ts` — `parseResume(text): Promise<ParsedResume>` （封装 Call #1 + zod）
- `src/lib/ai/scorer.ts` — `scoreResume(parsed, job): Promise<ScoreResult>` （封装 Call #2 + zod + clamp）
- `src/lib/ai/schemas.ts` — zod schemas for ParsedResume / ScoreResult
- `src/lib/ai/__fixtures__/` — 3 份示例 ParsedResume json
- `src/lib/ai/__tests__/scorer.test.ts`（可选 vitest，或 dev-only `/api/dev/test-scorer` 路由）

## Steps
1. 装 `pdf-parse mammoth zod`（package.json 已列）
2. 写 extract + 用一份本地 PDF 测试
3. 写 prompts.ts 完全照搬 `docs/prompt-engineering.md`
4. 写 schemas.ts，**严格反映** types/index.ts
5. 写 parser.ts：调 LLM + `JSON.parse` + zod 校验，失败重试 1 次
6. 写 scorer.ts：同上，外加 sanity clamp（`passed_hard=false` 强制 total ≤ 49）
7. 写 `/api/score/[id]`：
   ```ts
   POST /api/score/[id]
   1. update status='parsing'
   2. download file from storage
   3. extract text → parseResume → save parsed_resume
   4. update status='scoring'
   5. fetch job → scoreResume → save score
   6. update status='scored'
   7. if push criteria met → call feishu (D5 实现，D4 先 console.log 占位)
   ```
8. 异常分支：任何 step 失败 → status='failed', fail_reason 写入

## Acceptance
- [ ] 在 D3 投递一份真实简历，30s 内 Supabase 看到 `parsed_resume` 和 `score` 都是合法 JSON
- [ ] `score.total` 在 0-100，passed_hard 与 hard requirement 实际匹配一致
- [ ] 用 fixture 跑 scorer，强候选人 ≥80，硬性不达标候选人 ≤49
- [ ] 故意上传一份乱码文件 → status 变 `failed`，fail_reason 有信息
- [ ] 重跑同一 application id（POST `/api/score/<id>` 二次）→ 覆盖更新，不重复创建

## Out of scope
- 不做飞书推送（D5）
- 不做评分结果可视化 UI（D5）
- 不做批量重跑队列
- 不做多模态（PDF 直传 LLM），坚持「文本抽取 → LLM」
