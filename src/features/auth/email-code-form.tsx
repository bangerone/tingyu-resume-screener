"use client";

// ============================================================
// EmailCodeForm — 两段式候选人登录
//   ① 邮箱输入 → POST /api/auth/candidate/request-code
//   ② 6 格验证码 + 60s 倒计时重发 → POST /api/auth/candidate/verify-code
// 成功后调用 onSuccess()（由外层刷新 session）
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiJson } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Props {
  onSuccess?: () => void;
  /** 预填邮箱 */
  defaultEmail?: string;
}

export function EmailCodeForm({ onSuccess, defaultEmail = "" }: Props) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(defaultEmail);
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  // demo 模式下由 server 下发的验证码（仅在未配 Resend 时返回）
  const [devCode, setDevCode] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function requestCode() {
    if (!email.trim()) {
      toast.error("请输入邮箱");
      return;
    }
    setBusy(true);
    try {
      const res = await apiJson<{ ok: true; devCode?: string }>(
        "/api/auth/candidate/request-code",
        {
          method: "POST",
          body: { email: email.trim().toLowerCase() },
        },
      );
      if (res?.devCode) {
        setDevCode(res.devCode);
        toast.success("Demo 模式：验证码已下发，点击下方「一键填入」即可登录");
      } else {
        setDevCode(null);
        toast.success("验证码已发送，请检查邮箱");
      }
      setStep("code");
      setCooldown(60);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch {
      // apiJson 已 toast
    } finally {
      setBusy(false);
    }
  }

  function fillDevCode() {
    if (!devCode) return;
    const next = Array(6).fill("");
    for (let i = 0; i < devCode.length && i < 6; i++) next[i] = devCode[i];
    setCodeDigits(next);
    setTimeout(() => inputs.current[5]?.focus(), 10);
  }

  async function verifyCode() {
    const code = codeDigits.join("");
    if (code.length !== 6) {
      toast.error("请输入 6 位验证码");
      return;
    }
    setBusy(true);
    try {
      await apiJson("/api/auth/candidate/verify-code", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), code },
      });
      toast.success("登录成功");
      onSuccess?.();
    } catch {
      // apiJson 已 toast；清空输入
      setCodeDigits(Array(6).fill(""));
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } finally {
      setBusy(false);
    }
  }

  function setDigit(i: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(0, 1);
    setCodeDigits((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < 5) {
      inputs.current[i + 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCodeDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  }

  if (step === "email") {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) requestCode();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <p className="text-xs text-slate-500">
            我们将向此邮箱发送 6 位验证码用于登录投递流程。
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "发送中..." : "获取验证码"}
        </Button>
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) verifyCode();
      }}
    >
      <div>
        <Label>验证码已发送至</Label>
        <p className="mt-1 text-sm font-medium text-slate-900">{email}</p>
      </div>

      {devCode ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-amber-900">Demo 模式验证码</div>
              <div className="mt-0.5 text-xs text-amber-700">
                此环境未配置邮件发送（Resend），任何邮箱都可直接登录演示。
              </div>
            </div>
            <div className="font-mono text-xl font-bold tracking-[0.2em] text-amber-900">
              {devCode}
            </div>
          </div>
          <button
            type="button"
            onClick={fillDevCode}
            className="mt-2 w-full rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
          >
            一键填入
          </button>
        </div>
      ) : null}

      <div className="flex gap-2" onPaste={handleCodePaste}>
        {codeDigits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !codeDigits[i] && i > 0) {
                inputs.current[i - 1]?.focus();
              }
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            className={cn(
              "h-12 w-10 rounded-lg border border-slate-200 bg-white text-center text-lg font-semibold",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            )}
            disabled={busy}
          />
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "验证中..." : "登录"}
      </Button>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <button
          type="button"
          className="hover:text-slate-700"
          onClick={() => {
            setStep("email");
            setCodeDigits(Array(6).fill(""));
          }}
          disabled={busy}
        >
          ← 修改邮箱
        </button>
        <button
          type="button"
          className="text-brand-600 disabled:text-slate-400"
          onClick={requestCode}
          disabled={busy || cooldown > 0}
        >
          {cooldown > 0 ? `重新发送 (${cooldown}s)` : "重新发送"}
        </button>
      </div>
    </form>
  );
}
