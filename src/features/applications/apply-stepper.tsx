"use client";

// ============================================================
// ApplyStepper — 候选人投递容器
//   未登录 → EmailCodeForm
//   已登录 → ApplyForm（统一表单：上传 + 手填）
// ============================================================

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmailCodeForm, useCandidateSession } from "@/features/auth";
import { ApplyForm } from "./apply-form";

interface Props {
  jobId: string;
  jobTitle: string;
}

export function ApplyStepper({ jobId, jobTitle }: Props) {
  const { user, loading, refresh } = useCandidateSession();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-slate-500">
          加载中...
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>登录后继续投递</CardTitle>
          <CardDescription>
            投递 <span className="font-medium text-slate-900">{jobTitle}</span>
            ，我们将用邮箱验证码确认你的身份。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailCodeForm onSuccess={() => refresh()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <ApplyForm
      jobId={jobId}
      jobTitle={jobTitle}
      defaultEmail={user.email}
    />
  );
}
