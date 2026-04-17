"use client";

// ============================================================
// AutofillForm — Step 3：检查并完善 AI 解析出的申请表
// - defaultValues = ParsedResume
// - 字段上带 ✨（Sparkles icon）表示 AI 已填写
// - 教育/经历/项目数组可增删
// - 提交 → POST /api/applications（先 check 去重，409 弹窗）
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiJson } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import {
  applicationSubmitSchema,
  type ApplicationSubmit,
} from "@/lib/validators/application";
import type { ParsedResume } from "@/types";

interface Props {
  jobId: string;
  resumeFileKey: string;
  parsedResume: ParsedResume;
  defaultEmail: string;
}

function AiMark() {
  return (
    <span
      className="ml-1 inline-flex items-center text-brand-500"
      title="AI 已填写"
    >
      <Sparkles className="h-3.5 w-3.5" />
    </span>
  );
}

export function AutofillForm({
  jobId,
  resumeFileKey,
  parsedResume,
  defaultEmail,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [dupeDialog, setDupeDialog] = useState<string | null>(null);

  const defaults: ApplicationSubmit = {
    jobId,
    resumeFileKey,
    candidateName: parsedResume.name ?? "",
    candidatePhone: parsedResume.phone ?? "",
    parsedResume: {
      name: parsedResume.name ?? "",
      email: parsedResume.email ?? defaultEmail,
      phone: parsedResume.phone ?? "",
      location: parsedResume.location ?? "",
      total_years: parsedResume.total_years,
      education: parsedResume.education ?? [],
      experience: parsedResume.experience ?? [],
      skills: parsedResume.skills ?? [],
      projects: parsedResume.projects ?? [],
      raw_text: parsedResume.raw_text ?? "",
    },
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationSubmit>({
    resolver: zodResolver(applicationSubmitSchema),
    defaultValues: defaults,
  });

  const eduArr = useFieldArray({ control, name: "parsedResume.education" });
  const expArr = useFieldArray({ control, name: "parsedResume.experience" });
  const projArr = useFieldArray({ control, name: "parsedResume.projects" });

  const [skills, setSkills] = useState<string[]>(defaults.parsedResume.skills);
  const [skillInput, setSkillInput] = useState("");

  async function onSubmit(values: ApplicationSubmit) {
    setSubmitting(true);
    // 去重检查 (client 预检 — server 还会再判)
    try {
      const check = await apiJson<{ applied: boolean; applicationId: string | null }>(
        `/api/applications/check?job_id=${encodeURIComponent(jobId)}`,
        { showErrorToast: false },
      );
      if (check.applied && check.applicationId) {
        setDupeDialog(check.applicationId);
        setSubmitting(false);
        return;
      }
    } catch {
      // 忽略 check 错误，继续走 submit
    }

    const payload: ApplicationSubmit = {
      ...values,
      parsedResume: { ...values.parsedResume, skills },
    };

    try {
      const res = await apiJson<{ id: string }>("/api/applications", {
        method: "POST",
        body: payload,
        showErrorToast: false,
      });
      toast.success("投递成功");
      router.push(`/applied/${res.id}`);
    } catch (e: any) {
      if (e?.status === 409) {
        setDupeDialog("__existing__");
      } else {
        toast.error(e?.message ?? "提交失败");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>个人信息</CardTitle>
          <CardDescription>
            带 <Sparkles className="inline h-3.5 w-3.5 text-brand-500" /> 的字段由 AI 自动填写，请检查并修正。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label>
              姓名 * <AiMark />
            </Label>
            <Input {...register("candidateName")} />
            {errors.candidateName && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.candidateName.message}
              </p>
            )}
          </div>
          <div>
            <Label>邮箱（已登录）</Label>
            <Input value={defaultEmail} disabled readOnly />
          </div>
          <div>
            <Label>
              手机 <AiMark />
            </Label>
            <Input {...register("candidatePhone")} />
          </div>
          <div>
            <Label>
              所在城市 <AiMark />
            </Label>
            <Input {...register("parsedResume.location")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            教育经历 <AiMark />
          </CardTitle>
          <CardDescription>可以增删条目</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {eduArr.fields.map((f, i) => (
            <div
              key={f.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2"
            >
              <div>
                <Label className="text-xs">学校</Label>
                <Input {...register(`parsedResume.education.${i}.school`)} />
              </div>
              <div>
                <Label className="text-xs">学历</Label>
                <Input {...register(`parsedResume.education.${i}.degree`)} />
              </div>
              <div>
                <Label className="text-xs">专业</Label>
                <Input {...register(`parsedResume.education.${i}.major`)} />
              </div>
              <div>
                <Label className="text-xs">时间</Label>
                <Input {...register(`parsedResume.education.${i}.period`)} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => eduArr.remove(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> 删除
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              eduArr.append({ school: "", degree: "", major: "", period: "" })
            }
          >
            <Plus className="h-3.5 w-3.5" /> 添加教育经历
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            工作/实习经历 <AiMark />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {expArr.fields.map((f, i) => (
            <div
              key={f.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2"
            >
              <div>
                <Label className="text-xs">公司</Label>
                <Input {...register(`parsedResume.experience.${i}.company`)} />
              </div>
              <div>
                <Label className="text-xs">职位</Label>
                <Input {...register(`parsedResume.experience.${i}.title`)} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">时间</Label>
                <Input {...register(`parsedResume.experience.${i}.period`)} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">负责内容</Label>
                <Textarea
                  rows={3}
                  {...register(`parsedResume.experience.${i}.summary`)}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => expArr.remove(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> 删除
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              expArr.append({
                company: "",
                title: "",
                period: "",
                summary: "",
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> 添加经历
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            项目 <AiMark />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projArr.fields.map((f, i) => (
            <div
              key={f.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2"
            >
              <div>
                <Label className="text-xs">项目名</Label>
                <Input {...register(`parsedResume.projects.${i}.name`)} />
              </div>
              <div>
                <Label className="text-xs">角色</Label>
                <Input {...register(`parsedResume.projects.${i}.role`)} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">项目描述</Label>
                <Textarea
                  rows={3}
                  {...register(`parsedResume.projects.${i}.summary`)}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => projArr.remove(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> 删除
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => projArr.append({ name: "", role: "", summary: "" })}
          >
            <Plus className="h-3.5 w-3.5" /> 添加项目
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            技能 <AiMark />
          </CardTitle>
          <CardDescription>回车或逗号分隔，点标签可删除</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSkills(skills.filter((x) => x !== s))}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
              >
                {s} <span className="text-brand-400">×</span>
              </button>
            ))}
          </div>
          <Input
            placeholder="输入技能后回车"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                const v = skillInput.trim();
                if (v && !skills.includes(v)) setSkills([...skills, v]);
                setSkillInput("");
              }
            }}
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-6 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-end gap-3">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "提交中..." : "确认投递"}
          </Button>
        </div>
      </div>

      {dupeDialog ? (
        <DupeDialog
          onView={() => {
            if (dupeDialog && dupeDialog !== "__existing__") {
              router.push(`/applied/${dupeDialog}`);
            } else {
              router.push("/my-applications");
            }
          }}
          onClose={() => setDupeDialog(null)}
        />
      ) : null}
    </form>
  );
}

function DupeDialog({
  onView,
  onClose,
}: {
  onView: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-base font-semibold text-slate-900">你已投过该岗位</h3>
        <p className="mt-2 text-sm text-slate-600">
          同一岗位 30 天内只能投递一次。如需了解当前进度，请前往「我的投递」查看。
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            关闭
          </Button>
          <Button type="button" onClick={onView}>
            查看我的投递
          </Button>
        </div>
      </div>
    </div>
  );
}

