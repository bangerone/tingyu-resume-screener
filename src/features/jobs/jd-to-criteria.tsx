"use client";

// ============================================================
// JdToCriteria —— D6 加分项
// HR 在新建岗位时贴 JD，一键让 LLM 生成 criteria 草稿，追加进表单。
// ============================================================

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { apiJson } from "@/lib/api";
import type { ScreeningCriteria } from "@/types";

interface Props {
  /** 调用方拿到生成的 criteria 后自行决定「合并 / 覆盖」。 */
  onGenerated: (criteria: ScreeningCriteria) => void;
}

const MAX_CHARS = 2000;

export function JdToCriteria({ onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    const text = jd.trim();
    if (text.length < 20) {
      toast.error("JD 内容太短，至少 20 个字");
      return;
    }
    setLoading(true);
    try {
      const { criteria } = await apiJson<{ criteria: ScreeningCriteria }>(
        "/api/jobs/generate-criteria",
        { method: "POST", body: { jd: text.slice(0, MAX_CHARS) } },
      );
      onGenerated(criteria);
      toast.success("已自动填充草稿，请检查并保存");
      setOpen(false);
    } catch {
      // apiJson 内部已 toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50/30 p-4">
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-semibold text-slate-900">
            AI 一键生成筛选标准
          </span>
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
            加分项
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {!open && (
        <p className="mt-1 text-xs text-slate-500">
          把 JD 粘到这里，AI 会抽取硬性、技能、加分项、软性维度，省掉一条条填。
        </p>
      )}

      {open && (
        <div className="mt-3 space-y-3">
          <Textarea
            rows={8}
            value={jd}
            onChange={(e) => setJd(e.target.value.slice(0, MAX_CHARS))}
            placeholder="把完整的岗位 JD（职责 + 任职要求）粘进来..."
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {jd.length} / {MAX_CHARS}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setJd("");
                }}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={run}
                disabled={loading || jd.trim().length < 20}
              >
                {loading ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse" /> AI 解析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> 生成草稿
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            生成结果会<span className="font-medium">追加</span>到现有筛选标准，不会覆盖你已填的内容。
          </p>
        </div>
      )}
    </div>
  );
}
