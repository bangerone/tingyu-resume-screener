"use client";

// ============================================================
// CriteriaEditor —— 筛选标准结构化编辑器
// ============================================================
// 由 JobForm 内嵌；通过 react-hook-form 的 useFieldArray 管理五个列表：
// hard / skills / bonus / custom / schoolTiers。
// 输出形状符合 ScreeningCriteria (见 src/types/index.ts)。
//
// 「AI 新增」高亮：mergeGeneratedCriteria 后，父组件把新增项的 key
// （JSON.stringify 形式）塞进 justAddedKeys。本组件在渲染时对每行计算
// 同样的 key；若命中则加琥珀色左侧色条 + 「AI 新增」pill。用户开始编辑
// 该项后 key 变化，高亮自动消失。
// ============================================================

import { Plus, Trash2, Sparkles, GraduationCap } from "lucide-react";
import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SCHOOL_TIER_LABELS, type SchoolTier } from "@/lib/ai/school-tiers";
import type { JobInput } from "./job-schema";

interface Props {
  control: Control<JobInput>;
  register: UseFormRegister<JobInput>;
  errors: FieldErrors<JobInput>;
  justAddedKeys?: Set<string>;
}

/** 生成用于高亮匹配的稳定 key —— 内容变则 key 变 → 用户一动手高亮就消失。 */
export function itemKey(item: unknown): string {
  if (typeof item === "string") return `s:${item}`;
  return `o:${JSON.stringify(item)}`;
}

// ---------- preset 标签库 ----------

const HARD_PRESETS: {
  label: string;
  kind: "education" | "min_years" | "location";
  value: string | number;
  display: string;
}[] = [
  { label: "本科及以上", kind: "education", value: "本科", display: "本科" },
  { label: "硕士及以上", kind: "education", value: "硕士", display: "硕士" },
  { label: "大专及以上", kind: "education", value: "大专", display: "大专" },
  { label: "1 年以上经验", kind: "min_years", value: 1, display: "1 年+" },
  { label: "3 年以上经验", kind: "min_years", value: 3, display: "3 年+" },
  { label: "5 年以上经验", kind: "min_years", value: 5, display: "5 年+" },
  { label: "坐标上海", kind: "location", value: "上海", display: "上海" },
  { label: "坐标北京", kind: "location", value: "北京", display: "北京" },
  { label: "坐标杭州", kind: "location", value: "杭州", display: "杭州" },
  { label: "坐标深圳", kind: "location", value: "深圳", display: "深圳" },
];

const SKILL_PRESETS = [
  "React",
  "TypeScript",
  "Next.js",
  "Vue",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "SQL",
  "MySQL",
  "Redis",
  "Docker",
  "Kubernetes",
  "AI/LLM",
  "数据分析",
];

const BONUS_PRESETS = [
  "有大厂经验",
  "有技术博客",
  "有开源贡献",
  "有竞赛获奖",
  "有独立作品",
];

const SCHOOL_TIER_PRESETS: { tier: SchoolTier; hint: string }[] = [
  { tier: "c9", hint: "清北复交浙南中科大哈工大西交" },
  { tier: "985", hint: "39 所" },
  { tier: "211", hint: "约 116 所" },
  { tier: "shuangyiliu", hint: "约 147 所" },
  { tier: "qs50", hint: "2026 全球前 50" },
  { tier: "qs100", hint: "2026 全球前 100" },
];

// ---------- 主组件 ----------

export function CriteriaEditor({
  control,
  register,
  errors,
  justAddedKeys,
}: Props) {
  return (
    <div className="space-y-6">
      <HardList
        control={control}
        register={register}
        errors={errors}
        justAddedKeys={justAddedKeys}
      />
      <SkillList
        control={control}
        register={register}
        errors={errors}
        justAddedKeys={justAddedKeys}
      />
      <SchoolTierList control={control} justAddedKeys={justAddedKeys} />
      <BonusList
        control={control}
        register={register}
        justAddedKeys={justAddedKeys}
      />
      <CustomList
        control={control}
        register={register}
        errors={errors}
        justAddedKeys={justAddedKeys}
      />
    </div>
  );
}

// -------------------- Hard requirements --------------------

const EDUCATION_OPTIONS = [
  { value: "大专", label: "大专及以上" },
  { value: "本科", label: "本科及以上" },
  { value: "硕士", label: "硕士及以上" },
  { value: "博士", label: "博士" },
];

const MIN_YEARS_OPTIONS = [1, 2, 3, 5, 8, 10];

function HardList({
  control,
  register,
  errors,
  justAddedKeys,
}: Props) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "criteria.hard",
  });
  const watched = useWatch({ control, name: "criteria.hard" }) ?? [];

  return (
    <Section
      title="硬性要求"
      hint="不满足直接判负。常见如学历、最低年限、地点。"
      onAdd={() =>
        append({ kind: "education", label: "本科及以上", value: "本科" })
      }
      presets={
        <PresetBar>
          {HARD_PRESETS.map((p) => (
            <PresetChip
              key={p.label}
              onClick={() =>
                append({ kind: p.kind, label: p.label, value: p.value })
              }
            >
              {p.display}
            </PresetChip>
          ))}
        </PresetBar>
      }
    >
      {fields.length === 0 && <Empty text="暂无硬性要求" />}
      {fields.map((f, i) => {
        const cur = watched[i];
        const kind = cur?.kind ?? "education";
        return (
          <Row
            key={f.id}
            onRemove={() => remove(i)}
            highlight={justAddedKeys?.has(itemKey(cur ?? {})) ?? false}
          >
            <div className="col-span-12 md:col-span-3">
              <Label className="text-xs text-slate-500">类别</Label>
              <Select
                value={kind}
                onChange={(e) => {
                  const next = e.target.value as
                    | "education"
                    | "min_years"
                    | "location"
                    | "custom";
                  // 切类别时顺手补一个合理的默认 label / value，避免残留旧类别的值
                  if (next === "education")
                    update(i, {
                      kind: next,
                      label: "本科及以上",
                      value: "本科",
                    });
                  else if (next === "min_years")
                    update(i, {
                      kind: next,
                      label: "3 年以上经验",
                      value: 3,
                    });
                  else if (next === "location")
                    update(i, {
                      kind: next,
                      label: "坐标上海",
                      value: "上海",
                    });
                  else
                    update(i, {
                      kind: next,
                      label: cur?.label ?? "",
                      value: cur?.value ?? "",
                    });
                }}
              >
                <option value="education">学历</option>
                <option value="min_years">最低年限</option>
                <option value="location">工作地点</option>
                <option value="custom">自定义</option>
              </Select>
            </div>
            <div className="col-span-12 md:col-span-4">
              <Label className="text-xs text-slate-500">说明</Label>
              <Input
                placeholder="如：本科及以上"
                {...register(`criteria.hard.${i}.label` as const)}
              />
              <FieldError msg={errors.criteria?.hard?.[i]?.label?.message} />
            </div>
            <div className="col-span-12 md:col-span-5">
              <Label className="text-xs text-slate-500">值</Label>
              {kind === "education" ? (
                <Select {...register(`criteria.hard.${i}.value` as const)}>
                  {EDUCATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : kind === "min_years" ? (
                <Select
                  {...register(`criteria.hard.${i}.value` as const, {
                    valueAsNumber: true,
                  })}
                >
                  {MIN_YEARS_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y} 年以上
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  placeholder={
                    kind === "location" ? "如：上海" : "填一个简洁的值"
                  }
                  {...register(`criteria.hard.${i}.value` as const)}
                />
              )}
              <FieldError msg={errors.criteria?.hard?.[i]?.value?.message} />
            </div>
          </Row>
        );
      })}
    </Section>
  );
}

// -------------------- Skills --------------------

function SkillList({
  control,
  register,
  errors,
  justAddedKeys,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "criteria.skills",
  });
  const watched = useWatch({ control, name: "criteria.skills" }) ?? [];

  return (
    <Section
      title="必备 & 加分技能"
      hint="weight 1-5，level=must 视为硬性，不满足判负。"
      onAdd={() => append({ name: "", weight: 3, level: "preferred" })}
      presets={
        <PresetBar>
          {SKILL_PRESETS.map((name) => (
            <PresetChip
              key={name}
              onClick={() =>
                append({ name, weight: 3, level: "preferred" })
              }
            >
              {name}
            </PresetChip>
          ))}
        </PresetBar>
      }
    >
      {fields.length === 0 && <Empty text="暂无技能要求" />}
      {fields.map((f, i) => (
        <Row
          key={f.id}
          onRemove={() => remove(i)}
          highlight={
            justAddedKeys?.has(itemKey(watched[i] ?? {})) ?? false
          }
        >
          <div className="col-span-12 md:col-span-6">
            <Label className="text-xs text-slate-500">技能</Label>
            <Input
              placeholder="如：React / Python / 数据分析"
              {...register(`criteria.skills.${i}.name` as const)}
            />
            <FieldError msg={errors.criteria?.skills?.[i]?.name?.message} />
          </div>
          <div className="col-span-6 md:col-span-3">
            <Label className="text-xs text-slate-500">权重</Label>
            <Select
              {...register(`criteria.skills.${i}.weight` as const, {
                valueAsNumber: true,
              })}
            >
              <option value={1}>1 · 加分</option>
              <option value={2}>2</option>
              <option value={3}>3 · 中</option>
              <option value={4}>4</option>
              <option value={5}>5 · 关键</option>
            </Select>
          </div>
          <div className="col-span-6 md:col-span-3">
            <Label className="text-xs text-slate-500">级别</Label>
            <Select {...register(`criteria.skills.${i}.level` as const)}>
              <option value="preferred">加分</option>
              <option value="must">必备</option>
            </Select>
          </div>
        </Row>
      ))}
    </Section>
  );
}

// -------------------- School tier --------------------

function SchoolTierList({
  control,
  justAddedKeys,
}: {
  control: Control<JobInput>;
  justAddedKeys?: Set<string>;
}) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "criteria.schoolTiers",
  });
  const watched = useWatch({ control, name: "criteria.schoolTiers" }) ?? [];

  // 已选的 tier 集合，防止重复添加
  const takenTiers = new Set(watched.map((x) => x.tier));

  return (
    <Section
      icon={<GraduationCap className="h-4 w-4 text-brand-600" />}
      title="学校档次"
      hint="系统自动匹配 C9/985/211/双一流/QS50/QS100，HR 无需维护学校名单。"
      onAdd={() => {
        const next = SCHOOL_TIER_PRESETS.find(
          (p) => !takenTiers.has(p.tier),
        )?.tier;
        if (next) append({ tier: next, level: "bonus" });
      }}
      presets={
        <PresetBar>
          {SCHOOL_TIER_PRESETS.map((p) => (
            <PresetChip
              key={p.tier}
              disabled={takenTiers.has(p.tier)}
              onClick={() => append({ tier: p.tier, level: "bonus" })}
              title={p.hint}
            >
              {SCHOOL_TIER_LABELS[p.tier]}
            </PresetChip>
          ))}
        </PresetBar>
      }
    >
      {fields.length === 0 && (
        <Empty text="暂无学校档次要求（可直接点上面的快捷按钮添加）" />
      )}
      {fields.map((f, i) => {
        const cur = watched[i];
        if (!cur) return null;
        const highlight =
          justAddedKeys?.has(itemKey(cur)) ?? false;
        return (
          <Row
            key={f.id}
            onRemove={() => remove(i)}
            highlight={highlight}
          >
            <div className="col-span-12 md:col-span-6 flex items-center gap-2">
              <span className="inline-flex h-8 items-center rounded-md bg-brand-50 px-3 text-sm font-medium text-brand-700">
                {SCHOOL_TIER_LABELS[cur.tier]}
              </span>
              <span className="text-xs text-slate-500">
                候选人教育经历里任一所学校命中该档即生效
              </span>
            </div>
            <div className="col-span-12 md:col-span-6">
              <div className="flex gap-2">
                {(["bonus", "must"] as const).map((lvl) => {
                  const active = cur.level === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() =>
                        update(i, { tier: cur.tier, level: lvl })
                      }
                      className={
                        "flex-1 rounded-md border px-3 py-1.5 text-xs transition " +
                        (active
                          ? lvl === "must"
                            ? "border-rose-500 bg-rose-50 text-rose-700"
                            : "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand-300")
                      }
                    >
                      {lvl === "must" ? "硬性要求" : "加分项"}
                    </button>
                  );
                })}
              </div>
            </div>
          </Row>
        );
      })}
    </Section>
  );
}

// -------------------- Bonus (string chips) --------------------

function BonusList({
  control,
  register,
  justAddedKeys,
}: {
  control: Control<JobInput>;
  register: UseFormRegister<JobInput>;
  justAddedKeys?: Set<string>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    // useFieldArray 要 object 形的 name，但 criteria.bonus 是 string[]
    // 这里用类型断言 —— RHF 对 primitive array 的支持通过 `as never`
    name: "criteria.bonus" as never,
  });
  const watched =
    (useWatch({ control, name: "criteria.bonus" }) as string[] | undefined) ??
    [];

  return (
    <Section
      title="加分项"
      hint="一行一条，自由文本。如：有大厂经验加分。"
      onAdd={() => append("" as never)}
      presets={
        <PresetBar>
          {BONUS_PRESETS.map((b) => (
            <PresetChip key={b} onClick={() => append(b as never)}>
              {b}
            </PresetChip>
          ))}
        </PresetBar>
      }
    >
      {fields.length === 0 && <Empty text="暂无加分项" />}
      {fields.map((f, i) => (
        <Row
          key={f.id}
          onRemove={() => remove(i)}
          highlight={
            justAddedKeys?.has(itemKey(watched[i] ?? "")) ?? false
          }
        >
          <div className="col-span-12">
            <Input
              placeholder="如：有技术博客 / 曾贡献开源"
              {...register(`criteria.bonus.${i}` as const)}
            />
          </div>
        </Row>
      ))}
    </Section>
  );
}

// -------------------- Custom dimensions --------------------

function CustomList({
  control,
  register,
  errors,
  justAddedKeys,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "criteria.custom",
  });
  const watched = useWatch({ control, name: "criteria.custom" }) ?? [];

  return (
    <Section
      title="自定义维度"
      hint="HR 自定义的考察维度，AI 会按 description 打分 0-100。"
      onAdd={() => append({ name: "", weight: 3, description: "" })}
    >
      {fields.length === 0 && <Empty text="暂无自定义维度" />}
      {fields.map((f, i) => (
        <Row
          key={f.id}
          onRemove={() => remove(i)}
          highlight={
            justAddedKeys?.has(itemKey(watched[i] ?? {})) ?? false
          }
        >
          <div className="col-span-12 md:col-span-5">
            <Label className="text-xs text-slate-500">名称</Label>
            <Input
              placeholder="如:文化契合度"
              {...register(`criteria.custom.${i}.name` as const)}
            />
            <FieldError
              msg={errors.criteria?.custom?.[i]?.name?.message}
            />
          </div>
          <div className="col-span-6 md:col-span-2">
            <Label className="text-xs text-slate-500">权重</Label>
            <Select
              {...register(`criteria.custom.${i}.weight` as const, {
                valueAsNumber: true,
              })}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </Select>
          </div>
          <div className="col-span-12 md:col-span-5">
            <Label className="text-xs text-slate-500">描述</Label>
            <Textarea
              rows={2}
              placeholder="给 AI 判断的依据。如：看候选人是否在项目中展示主动性"
              {...register(`criteria.custom.${i}.description` as const)}
            />
          </div>
        </Row>
      ))}
    </Section>
  );
}

// -------------------- 共用小件 --------------------

function Section({
  title,
  hint,
  icon,
  onAdd,
  presets,
  children,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  onAdd: () => void;
  presets?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {icon}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
          </div>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4" /> 添加
        </Button>
      </div>
      {presets && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center gap-1 text-xs text-slate-500">
            <Sparkles className="h-3 w-3" /> 常用标签（点击一键添加）
          </div>
          {presets}
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PresetBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function PresetChip({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={
        "rounded-full border px-2.5 py-1 text-xs transition " +
        (disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : "border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700")
      }
    >
      {disabled ? "✓ " : "+ "}
      {children}
    </button>
  );
}

function Row({
  children,
  onRemove,
  highlight,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "relative grid grid-cols-12 gap-3 rounded-md border bg-white p-3 " +
        (highlight
          ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200"
          : "border-slate-200")
      }
    >
      {highlight && (
        <>
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-[3px] rounded-l-md bg-amber-400"
          />
          <span className="absolute right-3 top-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            <Sparkles className="h-2.5 w-2.5" /> AI 新增
          </span>
        </>
      )}
      {children}
      <div className="col-span-12 flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onRemove}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="h-4 w-4" /> 删除
        </Button>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-slate-400">{text}</p>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-rose-600">{msg}</p>;
}
