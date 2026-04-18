"use client";

// ============================================================
// JobForm —— 新建/编辑岗位的通用表单
// ============================================================
// - 基础字段：title / department / location / description
// - 嵌 CriteriaEditor
// - 阈值 range + 数字显示
// - 底部：保存草稿 / 保存并发布 / 取消
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiJson } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { CriteriaEditor, itemKey } from "./criteria-editor";
import { JdToCriteria } from "./jd-to-criteria";
import {
  emptyJobInput,
  jobInputSchema,
  type JobInput,
} from "./job-schema";
import type { ScreeningCriteria } from "@/types";

interface Props {
  mode: "create" | "edit";
  jobId?: string;
  defaultValues?: JobInput;
}

export function JobForm({ mode, jobId, defaultValues }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<"draft" | "open" | null>(null);
  const [justAddedKeys, setJustAddedKeys] = useState<Set<string>>(new Set());

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<JobInput>({
    resolver: zodResolver(jobInputSchema),
    defaultValues: defaultValues ?? emptyJobInput,
  });

  const pushThreshold = watch("pushThreshold") ?? 80;

  // JD → criteria 生成后，追加到现有字段（不覆盖 HR 已填的）
  function mergeGeneratedCriteria(gen: ScreeningCriteria) {
    const cur = getValues("criteria") ?? {
      hard: [],
      skills: [],
      bonus: [],
      custom: [],
      schoolTiers: [],
    };
    const curSchoolTiers = cur.schoolTiers ?? [];
    const genSchoolTiers = gen.schoolTiers ?? [];
    const seen = {
      hard: new Set(cur.hard.map((h) => `${h.kind}|${h.label}`)),
      skills: new Set(cur.skills.map((s) => s.name.toLowerCase())),
      bonus: new Set(cur.bonus),
      custom: new Set(cur.custom.map((c) => c.name)),
      schoolTiers: new Set(curSchoolTiers.map((t) => t.tier)),
    };
    const newHard = gen.hard.filter(
      (h) => !seen.hard.has(`${h.kind}|${h.label}`),
    );
    const newSkills = gen.skills.filter(
      (s) => !seen.skills.has(s.name.toLowerCase()),
    );
    const newBonus = gen.bonus.filter((b) => !seen.bonus.has(b));
    const newCustom = gen.custom.filter((c) => !seen.custom.has(c.name));
    const newSchoolTiers = genSchoolTiers.filter(
      (t) => !seen.schoolTiers.has(t.tier),
    );

    const merged: ScreeningCriteria = {
      hard: [...cur.hard, ...newHard],
      skills: [...cur.skills, ...newSkills],
      bonus: [...cur.bonus, ...newBonus],
      custom: [...cur.custom, ...newCustom],
      schoolTiers: [...curSchoolTiers, ...newSchoolTiers],
    };
    // setValue 不会同步 useFieldArray 内部 fields（RHF 已知限制），用 reset 强制重挂；
    // keepDefaultValues 避免污染 "dirty" 基准；其它字段从 getValues 原样带回。
    reset(
      { ...getValues(), criteria: merged },
      { keepDefaultValues: true, keepErrors: true, keepTouched: true },
    );
    setValue("criteria", merged, { shouldDirty: true });

    // 给新增项打「AI 新增」标记，用户一编辑即自动消失
    const keys = new Set<string>();
    newHard.forEach((x) => keys.add(itemKey(x)));
    newSkills.forEach((x) => keys.add(itemKey(x)));
    newBonus.forEach((x) => keys.add(itemKey(x)));
    newCustom.forEach((x) => keys.add(itemKey(x)));
    newSchoolTiers.forEach((x) => keys.add(itemKey(x)));
    setJustAddedKeys(keys);
  }

  async function save(target: "draft" | "open") {
    return handleSubmit(async (values) => {
      setSubmitting(target);
      try {
        const payload: JobInput = { ...values, status: target };
        if (mode === "create") {
          const created = await apiJson<{ id: string }>("/api/jobs", {
            method: "POST",
            body: payload,
          });
          toast.success(target === "open" ? "已发布" : "已保存草稿");
          router.push(`/admin/jobs/${created.id}`);
          router.refresh();
        } else {
          await apiJson(`/api/jobs/${jobId}`, {
            method: "PATCH",
            body: payload,
          });
          toast.success(target === "open" ? "已发布" : "已保存");
          router.refresh();
        }
      } catch {
        // apiJson 已 toast
      } finally {
        setSubmitting(null);
      }
    })();
  }

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Card>
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
          <CardDescription>候选人看到的岗位卡片内容</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <Label htmlFor="title">岗位标题 *</Label>
              <Input id="title" {...register("title")} placeholder="如：前端工程师" />
              {errors.title && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="col-span-12 md:col-span-3">
              <Label htmlFor="department">部门</Label>
              <Input
                id="department"
                {...register("department")}
                placeholder="技术中心"
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <Label htmlFor="location">工作地点</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="上海"
              />
            </div>
            <div className="col-span-12">
              <Label>招聘类型 *</Label>
              <div className="mt-1 flex gap-2">
                {(["social", "campus"] as const).map((v) => {
                  const active = watch("hiringType") === v;
                  const label = v === "campus" ? "校园招聘" : "社会招聘";
                  const desc =
                    v === "campus"
                      ? "面向应届毕业生 / 实习生"
                      : "面向有工作经验的候选人";
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setValue("hiringType", v, { shouldDirty: true })
                      }
                      className={
                        "flex-1 rounded-lg border px-4 py-3 text-left transition " +
                        (active
                          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200"
                          : "border-slate-200 bg-white hover:border-brand-300")
                      }
                    >
                      <div
                        className={
                          "text-sm font-semibold " +
                          (active ? "text-brand-700" : "text-slate-900")
                        }
                      >
                        {label}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">岗位描述 *</Label>
            <Textarea
              id="description"
              rows={8}
              {...register("description")}
              placeholder="支持 markdown。描述职责、要求、团队、待遇等。"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.description.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>筛选标准</CardTitle>
          <CardDescription>
            AI 会基于下列维度给候选人打分。所有字段都可以留空，但越具体评分越准。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <JdToCriteria onGenerated={mergeGeneratedCriteria} />
          <CriteriaEditor
            control={control}
            register={register}
            errors={errors}
            justAddedKeys={justAddedKeys}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>推送阈值</CardTitle>
          <CardDescription>
            总分 &ge; 该值 且 硬性通过 时，自动推送到飞书。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={pushThreshold}
              onChange={(e) =>
                setValue("pushThreshold", Number(e.target.value), {
                  shouldDirty: true,
                })
              }
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
            />
            <span className="w-14 text-right text-lg font-semibold tabular-nums text-brand-600">
              {pushThreshold}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/jobs")}
          disabled={submitting !== null}
        >
          取消
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => save("draft")}
          disabled={submitting !== null}
        >
          {submitting === "draft" ? "保存中..." : "保存草稿"}
        </Button>
        <Button
          type="button"
          onClick={() => save("open")}
          disabled={submitting !== null}
        >
          {submitting === "open" ? "发布中..." : "保存并发布"}
        </Button>
      </div>
    </form>
  );
}
