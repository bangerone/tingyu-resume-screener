"use client";

// ============================================================
// ApplyForm — 统一投递表单
// ============================================================
// 布局：
//   顶部 · AI 自动填表卡片（可选上传简历 → 解析 → 填充下方表单）
//   下方 · 申请表（始终可见，未上传也能手填）
// 参考小红书 / 腾讯 / 快手 校招申请表结构。
// ============================================================

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sparkles,
  Plus,
  Trash2,
  FileCheck2,
  UploadCloud,
  Loader2,
  CheckCircle2,
  FileText,
  User,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Wrench,
  Target,
  MessageSquare,
  Award,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  applicationSubmitSchema,
  type ApplicationSubmit,
} from "@/lib/validators/application";
import type { ParsedResume } from "@/types";

interface Props {
  jobId: string;
  jobTitle: string;
  defaultEmail: string;
}

const MAX_MB = 10;

export function ApplyForm({ jobId, jobTitle, defaultEmail }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dupeDialog, setDupeDialog] = useState<string | null>(null);

  // 上传 & 解析状态
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const emptyDefaults: ApplicationSubmit = {
    jobId,
    resumeFileKey: "",
    candidateName: "",
    candidatePhone: "",
    parsedResume: {
      name: "",
      email: defaultEmail,
      phone: "",
      location: "",
      gender: "",
      birth_date: "",
      work_status: "",
      expected_city: "",
      expected_salary: "",
      available_from: "",
      self_intro: "",
      education: [{ school: "", degree: "", major: "", period: "" }],
      experience: [],
      skills: [],
      projects: [],
      awards: [],
      raw_text: "",
    },
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<ApplicationSubmit>({
    resolver: zodResolver(applicationSubmitSchema),
    defaultValues: emptyDefaults,
  });

  const eduArr = useFieldArray({ control, name: "parsedResume.education" });
  const expArr = useFieldArray({ control, name: "parsedResume.experience" });
  const projArr = useFieldArray({ control, name: "parsedResume.projects" });
  const awardArr = useFieldArray({ control, name: "parsedResume.awards" });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // ---- 上传 + 解析 ----
  async function handleFile(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`文件超过 ${MAX_MB}MB`);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "doc", "docx"].includes(ext)) {
      toast.error("仅支持 pdf / doc / docx");
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setParsed(false);
    setProgress(8);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const fakeTimer = setInterval(() => {
        setProgress((p) => Math.min(p + 7, 85));
      }, 220);
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      clearInterval(fakeTimer);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `上传失败 (${res.status})`);
      }
      setProgress(100);
      const data = (await res.json()) as { fileKey: string; name: string };
      setValue("resumeFileKey", data.fileKey);
      setUploading(false);

      // 立即开始解析
      setParsing(true);
      try {
        const { parsedResume } = await apiJson<{ parsedResume: ParsedResume }>(
          "/api/resume/parse",
          {
            method: "POST",
            body: { fileKey: data.fileKey },
            showErrorToast: false,
          },
        );
        applyParsedToForm(parsedResume);
        setParsed(true);
        toast.success("AI 已帮你填好，请检查修改");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "简历解析失败，请手动填写";
        toast.error(msg);
      } finally {
        setParsing(false);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "上传失败";
      toast.error(msg);
      setFileName(null);
      setProgress(0);
      setUploading(false);
    }
  }

  function applyParsedToForm(p: ParsedResume) {
    const current = getValues();
    reset({
      ...current,
      candidateName: p.name ?? current.candidateName,
      candidatePhone: p.phone ?? current.candidatePhone,
      parsedResume: {
        ...current.parsedResume,
        name: p.name ?? current.parsedResume.name,
        email: p.email ?? current.parsedResume.email ?? defaultEmail,
        phone: p.phone ?? current.parsedResume.phone,
        location: p.location ?? current.parsedResume.location,
        total_years: p.total_years,
        education:
          p.education && p.education.length > 0
            ? p.education
            : current.parsedResume.education,
        experience: p.experience ?? [],
        projects: p.projects ?? [],
        skills: p.skills ?? [],
        raw_text: p.raw_text ?? "",
      },
    });
    if (p.skills && p.skills.length > 0) setSkills(p.skills);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  // ---- 提交 ----
  async function onSubmit(values: ApplicationSubmit) {
    setSubmitting(true);
    try {
      const check = await apiJson<{
        applied: boolean;
        applicationId: string | null;
      }>(`/api/applications/check?job_id=${encodeURIComponent(jobId)}`, {
        showErrorToast: false,
      });
      if (check.applied && check.applicationId) {
        setDupeDialog(check.applicationId);
        setSubmitting(false);
        return;
      }
    } catch {
      /* ignore */
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
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      if (err?.status === 409) {
        setDupeDialog("__existing__");
      } else {
        toast.error(err?.message ?? "提交失败");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const onInvalid = () => {
    toast.error("请检查标红字段");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="space-y-6"
    >
      {/* ========== 顶部：AI 自动填表 ========== */}
      <Card className="overflow-hidden border-brand-100">
        <div className="flex items-center gap-3 border-b border-brand-100 bg-gradient-to-r from-brand-50 via-white to-sky-50 px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900">
              AI 自动填表 · 可选
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              上传 PDF / Word 简历，AI 会自动帮你填好下面的申请表。没有简历也可以直接往下填。
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !uploading && !parsing && inputRef.current?.click()}
            className={cn(
              "cursor-pointer rounded-xl border-2 border-dashed bg-white px-6 py-8 text-center transition",
              dragOver
                ? "border-brand-500 bg-brand-50/40"
                : parsed
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-300 hover:border-brand-400",
              (uploading || parsing) && "pointer-events-none opacity-80",
            )}
          >
            {parsing ? (
              <div className="flex flex-col items-center gap-2 text-slate-600">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                <div className="text-sm font-medium text-slate-900">
                  AI 正在解析你的简历…
                </div>
                <div className="text-xs text-slate-500">
                  提取姓名、教育背景、工作经历、技能……稍等片刻
                </div>
              </div>
            ) : parsed && fileName ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <div className="text-sm font-medium text-slate-900">
                  已自动填充，请往下检查
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
                  <FileText className="h-3.5 w-3.5 text-brand-500" />
                  {fileName}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  重新上传
                </Button>
              </div>
            ) : uploading ? (
              <div className="flex flex-col items-center gap-3">
                <UploadCloud className="h-8 w-8 text-brand-500" />
                <div className="text-sm font-medium text-slate-900">
                  上传中… {fileName}
                </div>
                <div className="h-2 w-56 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-brand-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                  <FileCheck2 className="h-6 w-6 text-brand-600" />
                </div>
                <div className="text-sm font-medium text-slate-900">
                  点击或拖拽简历到此处
                </div>
                <div className="text-xs text-slate-500">
                  支持 PDF / DOC / DOCX · 最大 {MAX_MB}MB
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  <UploadCloud className="h-4 w-4" /> 选择简历文件
                </Button>
                <div className="mt-1 text-xs text-slate-400">
                  没有简历？直接往下填写也可以
                </div>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      {/* ========== 1. 基本信息 ========== */}
      <SectionCard
        icon={<User className="h-4 w-4" />}
        title="基本信息"
        description="投递 · 岗位「{jobTitle}」"
        jobTitle={jobTitle}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="姓名" required error={errors.candidateName?.message}>
            <Input
              placeholder="请输入真实姓名"
              {...register("candidateName")}
            />
          </Field>
          <Field label="邮箱" hint="已通过邮箱登录">
            <Input value={defaultEmail} disabled readOnly />
          </Field>
          <Field label="手机号" required>
            <Input
              placeholder="11 位手机号"
              {...register("candidatePhone", {
                required: "请填写手机号",
                pattern: {
                  value: /^1[3-9]\d{9}$/,
                  message: "手机号格式不正确",
                },
              })}
            />
            {errors.candidatePhone && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.candidatePhone.message as string}
              </p>
            )}
          </Field>
          <Field label="所在城市" required>
            <Input
              placeholder="如 上海 / 北京"
              {...register("parsedResume.location", {
                required: "请填写所在城市",
              })}
            />
          </Field>
          <Field label="性别">
            <Controller
              control={control}
              name="parsedResume.gender"
              render={({ field }) => (
                <RadioGroup
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={[
                    { value: "男", label: "男" },
                    { value: "女", label: "女" },
                  ]}
                />
              )}
            />
          </Field>
          <Field label="出生年月日">
            <Input
              type="date"
              {...register("parsedResume.birth_date")}
            />
          </Field>
          <Field label="目前状态" hint="方便 HR 联系">
            <Controller
              control={control}
              name="parsedResume.work_status"
              render={({ field }) => (
                <RadioGroup
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={[
                    { value: "在职", label: "在职" },
                    { value: "离职", label: "离职待业" },
                    { value: "在校", label: "在校" },
                  ]}
                />
              )}
            />
          </Field>
        </div>
      </SectionCard>

      {/* ========== 2. 教育经历 ========== */}
      <SectionCard
        icon={<GraduationCap className="h-4 w-4" />}
        title="教育经历"
        description="至少填写 1 条最高学历，倒序填写"
        required
      >
        <div className="space-y-4">
          {eduArr.fields.map((f, i) => (
            <div
              key={f.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/30 p-4 md:grid-cols-2"
            >
              <Field label={`学校 ${i === 0 ? "*" : ""}`}>
                <Input
                  placeholder="如 清华大学"
                  {...register(`parsedResume.education.${i}.school`)}
                />
              </Field>
              <Field label="学历">
                <Controller
                  control={control}
                  name={`parsedResume.education.${i}.degree`}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="">请选择</option>
                      <option value="博士">博士</option>
                      <option value="硕士">硕士</option>
                      <option value="本科">本科</option>
                      <option value="大专">大专</option>
                      <option value="高中">高中及以下</option>
                    </select>
                  )}
                />
              </Field>
              <Field label="专业">
                <Input
                  placeholder="如 计算机科学与技术"
                  {...register(`parsedResume.education.${i}.major`)}
                />
              </Field>
              <Field label="起止时间" hint="如 2020.09 - 2024.06">
                <Input
                  placeholder="2020.09 - 2024.06"
                  {...register(`parsedResume.education.${i}.period`)}
                />
              </Field>
              {eduArr.fields.length > 1 && (
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => eduArr.remove(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> 删除此条
                  </Button>
                </div>
              )}
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
        </div>
      </SectionCard>

      {/* ========== 3. 工作 / 实习经历 ========== */}
      <SectionCard
        icon={<Briefcase className="h-4 w-4" />}
        title="工作 / 实习经历"
        description="应届生可只填实习经历，选填"
      >
        <div className="space-y-4">
          {expArr.fields.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-500">
              还没有经历？点下面的按钮开始添加（也可跳过）
            </p>
          )}
          {expArr.fields.map((f, i) => (
            <div
              key={f.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/30 p-4 md:grid-cols-2"
            >
              <Field label="公司">
                <Input
                  placeholder="如 腾讯"
                  {...register(`parsedResume.experience.${i}.company`)}
                />
              </Field>
              <Field label="职位">
                <Input
                  placeholder="如 后端工程师"
                  {...register(`parsedResume.experience.${i}.title`)}
                />
              </Field>
              <Field label="起止时间" hint="如 2024.07 - 至今">
                <Input
                  placeholder="2024.07 - 至今"
                  {...register(`parsedResume.experience.${i}.period`)}
                />
              </Field>
              <div />
              <div className="md:col-span-2">
                <Field label="工作内容" hint="简述职责、成果，可以用 STAR 法">
                  <Textarea
                    rows={3}
                    placeholder="例如：负责订单中台核心链路，QPS 峰值 5w，主导 xxx 优化使 P99 从 300ms 降到 80ms……"
                    {...register(`parsedResume.experience.${i}.summary`)}
                  />
                </Field>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => expArr.remove(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> 删除此条
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
            <Plus className="h-3.5 w-3.5" /> 添加一段经历
          </Button>
        </div>
      </SectionCard>

      {/* ========== 4. 项目经历 ========== */}
      <SectionCard
        icon={<FolderGit2 className="h-4 w-4" />}
        title="项目经历"
        description="可写公司项目 / 开源项目 / 个人作品，选填"
      >
        <div className="space-y-4">
          {projArr.fields.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-500">
              还没有项目？点下面的按钮添加（选填）
            </p>
          )}
          {projArr.fields.map((f, i) => (
            <div
              key={f.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/30 p-4 md:grid-cols-2"
            >
              <Field label="项目名称">
                <Input
                  placeholder="如 短视频推荐系统"
                  {...register(`parsedResume.projects.${i}.name`)}
                />
              </Field>
              <Field label="担任角色">
                <Input
                  placeholder="如 后端主力 / 项目负责人"
                  {...register(`parsedResume.projects.${i}.role`)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="项目描述" hint="技术栈、职责、量化结果">
                  <Textarea
                    rows={3}
                    placeholder="技术栈、做了什么、达成的结果……"
                    {...register(`parsedResume.projects.${i}.summary`)}
                  />
                </Field>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => projArr.remove(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> 删除此条
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              projArr.append({ name: "", role: "", summary: "" })
            }
          >
            <Plus className="h-3.5 w-3.5" /> 添加项目
          </Button>
        </div>
      </SectionCard>

      {/* ========== 5. 获奖记录 ========== */}
      <SectionCard
        icon={<Award className="h-4 w-4" />}
        title="获奖记录"
        description="竞赛、奖学金、荣誉称号……选填"
      >
        <div className="space-y-4">
          {awardArr.fields.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-500">
              暂无获奖记录？可跳过本项
            </p>
          )}
          {awardArr.fields.map((f, i) => (
            <div
              key={f.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/30 p-4 md:grid-cols-2"
            >
              <Field label="奖项名称">
                <Input
                  placeholder="如 国家奖学金 / ACM-ICPC 银奖"
                  {...register(`parsedResume.awards.${i}.title`)}
                />
              </Field>
              <Field label="获奖时间" hint="如 2023.06">
                <Input
                  placeholder="2023.06"
                  {...register(`parsedResume.awards.${i}.date`)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="说明" hint="选填，简要描述奖项级别和意义">
                  <Textarea
                    rows={2}
                    placeholder="如 全国性学科竞赛，年度获奖率 < 5%"
                    {...register(`parsedResume.awards.${i}.description`)}
                  />
                </Field>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => awardArr.remove(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> 删除此条
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              awardArr.append({ title: "", date: "", description: "" })
            }
          >
            <Plus className="h-3.5 w-3.5" /> 添加获奖记录
          </Button>
        </div>
      </SectionCard>

      {/* ========== 6. 技能 ========== */}
      <SectionCard
        icon={<Wrench className="h-4 w-4" />}
        title="专业技能"
        description="回车或逗号分隔；点标签可删除"
      >
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
          className="mt-3"
          placeholder="如 Go、Kubernetes、React，输入后回车添加"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              const v = skillInput.trim().replace(/,$/, "");
              if (v && !skills.includes(v)) setSkills([...skills, v]);
              setSkillInput("");
            }
          }}
        />
      </SectionCard>

      {/* ========== 6. 求职意向 ========== */}
      <SectionCard
        icon={<Target className="h-4 w-4" />}
        title="求职意向"
        description="选填，帮 HR 更好地匹配你"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="期望城市">
            <Input
              placeholder="如 上海 / 北京"
              {...register("parsedResume.expected_city")}
            />
          </Field>
          <Field label="期望月薪" hint="如 25-35K">
            <Input
              placeholder="25-35K"
              {...register("parsedResume.expected_salary")}
            />
          </Field>
          <Field label="最快到岗">
            <Controller
              control={control}
              name="parsedResume.available_from"
              render={({ field }) => (
                <select
                  {...field}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="">请选择</option>
                  <option value="随时">随时</option>
                  <option value="两周内">两周内</option>
                  <option value="一个月内">一个月内</option>
                  <option value="两个月以上">两个月以上</option>
                </select>
              )}
            />
          </Field>
        </div>
      </SectionCard>

      {/* ========== 7. 自我介绍 ========== */}
      <SectionCard
        icon={<MessageSquare className="h-4 w-4" />}
        title="自我介绍"
        description="选填，80-200 字最佳"
      >
        <Textarea
          rows={5}
          placeholder="聊聊你最擅长什么、近期的成长、为什么想加入我们……"
          {...register("parsedResume.self_intro")}
        />
      </SectionCard>

      {/* 底部提交 */}
      <div className="sticky bottom-0 -mx-6 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-xs text-slate-500 sm:block">
            投递成功后，AI 会在后台评估你的匹配度，高分候选人将被优先联系。
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/jobs/${jobId}`)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "提交中..." : "确认投递"}
            </Button>
          </div>
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

/* -------- helpers -------- */

function SectionCard({
  icon,
  title,
  description,
  jobTitle,
  required,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  jobTitle?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </span>
        <div className="flex-1">
          <CardTitle className="text-base">
            {title}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </CardTitle>
          {description && (
            <CardDescription className="mt-0.5">
              {jobTitle
                ? description.replace("{jobTitle}", jobTitle)
                : description}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
        {hint && (
          <span className="ml-1 font-normal text-slate-400">· {hint}</span>
        )}
      </Label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "h-9 rounded-md border px-3 text-sm transition",
              active
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-brand-300",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
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
        <h3 className="text-base font-semibold text-slate-900">
          你已投过该岗位
        </h3>
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
