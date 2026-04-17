"use client";

// ============================================================
// CriteriaEditor —— 筛选标准结构化编辑器
// ============================================================
// 由 JobForm 内嵌；通过 react-hook-form 的 useFieldArray 管理四个列表。
// 输出形状符合 ScreeningCriteria (见 src/types/index.ts)。
//
// D6：新增「常用标签库」快捷按钮 —— 一键追加常见学历/年限/技能/加分项。
// ============================================================

import { Plus, Trash2, Sparkles } from "lucide-react";
import {
  useFieldArray,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { JobInput } from "./job-schema";

interface Props {
  control: Control<JobInput>;
  register: UseFormRegister<JobInput>;
  errors: FieldErrors<JobInput>;
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

// ---------- 主组件 ----------

export function CriteriaEditor({ control, register, errors }: Props) {
  return (
    <div className="space-y-6">
      <HardList control={control} register={register} errors={errors} />
      <SkillList control={control} register={register} errors={errors} />
      <BonusList control={control} register={register} />
      <CustomList control={control} register={register} errors={errors} />
    </div>
  );
}

// -------------------- Hard requirements --------------------

function HardList({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "criteria.hard",
  });

  return (
    <Section
      title="硬性要求"
      hint="不满足直接判负。常见如学历、最低年限、地点。"
      onAdd={() => append({ kind: "education", label: "", value: "" })}
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
      {fields.map((f, i) => (
        <Row key={f.id} onRemove={() => remove(i)}>
          <div className="col-span-12 md:col-span-3">
            <Label className="text-xs text-slate-500">类别</Label>
            <Select {...register(`criteria.hard.${i}.kind` as const)}>
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
            <Input
              placeholder="如：本科 / 3 / 上海"
              {...register(`criteria.hard.${i}.value` as const)}
            />
            <FieldError msg={errors.criteria?.hard?.[i]?.value?.message} />
          </div>
        </Row>
      ))}
    </Section>
  );
}

// -------------------- Skills --------------------

function SkillList({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "criteria.skills",
  });

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
        <Row key={f.id} onRemove={() => remove(i)}>
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

// -------------------- Bonus (string chips) --------------------

function BonusList({
  control,
  register,
}: Pick<Props, "control" | "register">) {
  const { fields, append, remove } = useFieldArray({
    control,
    // useFieldArray 要 object 形的 name，但 criteria.bonus 是 string[]
    // 这里用类型断言 —— RHF 对 primitive array 的支持通过 `as never`
    name: "criteria.bonus" as never,
  });

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
        <Row key={f.id} onRemove={() => remove(i)}>
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

function CustomList({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "criteria.custom",
  });

  return (
    <Section
      title="自定义维度"
      hint="HR 自定义的考察维度，AI 会按 description 打分 0-100。"
      onAdd={() => append({ name: "", weight: 3, description: "" })}
    >
      {fields.length === 0 && <Empty text="暂无自定义维度" />}
      {fields.map((f, i) => (
        <Row key={f.id} onRemove={() => remove(i)}>
          <div className="col-span-12 md:col-span-5">
            <Label className="text-xs text-slate-500">名称</Label>
            <Input
              placeholder="如：文化契合度"
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
  onAdd,
  presets,
  children,
}: {
  title: string;
  hint?: string;
  onAdd: () => void;
  presets?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
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
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
    >
      + {children}
    </button>
  );
}

function Row({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-3 rounded-md border border-slate-200 bg-white p-3">
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
