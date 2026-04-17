"use client";

// ============================================================
// ApplyStepper — 候选人投递三步容器
//   Step 0 (未登录): EmailCodeForm
//   Step 1: ResumeUpload
//   Step 2: loading 动画 + POST /api/resume/parse
//   Step 3: AutofillForm
// ============================================================

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
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
import { EmailCodeForm, useCandidateSession } from "@/features/auth";
import type { ParsedResume } from "@/types";
import { ResumeUpload } from "./resume-upload";
import { AutofillForm } from "./autofill-form";

interface Props {
  jobId: string;
  jobTitle: string;
}

type Stage = "login" | "upload" | "parsing" | "review";

export function ApplyStepper({ jobId, jobTitle }: Props) {
  const { user, loading, refresh } = useCandidateSession();
  const [stage, setStage] = useState<Stage>("upload");
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);

  // 初始化 stage：没 user → login
  useEffect(() => {
    if (loading) return;
    setStage((prev) => {
      if (!user) return "login";
      // 已登录，stay on upload/... 不回退
      if (prev === "login") return "upload";
      return prev;
    });
  }, [loading, user]);

  async function afterUpload(key: string) {
    setFileKey(key);
    setStage("parsing");
    try {
      const { parsedResume } = await apiJson<{ parsedResume: ParsedResume }>(
        "/api/resume/parse",
        {
          method: "POST",
          body: { fileKey: key },
          showErrorToast: false,
        },
      );
      setParsed(parsedResume);
      setStage("review");
    } catch (e: any) {
      toast.error(e?.message ?? "简历解析失败，请重试");
      setStage("upload");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-slate-500">
          加载中...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StepIndicator stage={stage} />

      {stage === "login" && (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>登录后继续投递</CardTitle>
            <CardDescription>
              投递 <span className="font-medium text-slate-900">{jobTitle}</span>
              ，我们将用邮箱验证码确认你的身份。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailCodeForm
              onSuccess={async () => {
                await refresh();
                setStage("upload");
              }}
            />
          </CardContent>
        </Card>
      )}

      {stage === "upload" && user && (
        <Card>
          <CardHeader>
            <CardTitle>上传简历</CardTitle>
            <CardDescription>
              支持 PDF / DOCX，最大 10MB。上传后 AI 会自动解析并预填申请表。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeUpload onUploaded={afterUpload} />
          </CardContent>
        </Card>
      )}

      {stage === "parsing" && (
        <Card>
          <CardContent className="py-12">
            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
              <div className="relative">
                <Sparkles className="h-10 w-10 animate-pulse text-brand-600" />
              </div>
              <div className="mt-4 text-lg font-semibold text-slate-900">
                AI 正在解析你的简历…
              </div>
              <div className="mt-2 text-sm text-slate-500">
                提取姓名、教育背景、工作经历、技能……稍等片刻。
              </div>
              <div className="mt-6 w-full space-y-2">
                <SkeletonLine className="w-3/4" />
                <SkeletonLine className="w-full" />
                <SkeletonLine className="w-5/6" />
                <SkeletonLine className="w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === "review" && parsed && fileKey && user && (
        <AutofillForm
          jobId={jobId}
          resumeFileKey={fileKey}
          parsedResume={parsed}
          defaultEmail={user.email}
        />
      )}
    </div>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-3 animate-pulse rounded bg-slate-200", className)}
    />
  );
}

function StepIndicator({ stage }: { stage: Stage }) {
  const stageIndex =
    stage === "login" ? 0 : stage === "upload" ? 1 : stage === "parsing" ? 2 : 3;

  const steps = [
    { label: "登录" },
    { label: "上传简历" },
    { label: "AI 解析" },
    { label: "检查投递" },
  ];

  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => {
        const active = i <= stageIndex;
        return (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full font-semibold",
                active
                  ? "bg-brand-600 text-white"
                  : "bg-slate-200 text-slate-500",
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "font-medium",
                active ? "text-slate-900" : "text-slate-500",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mx-1 h-px w-8",
                  i < stageIndex ? "bg-brand-400" : "bg-slate-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
