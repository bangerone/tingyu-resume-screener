// ============================================================
// Client-side fetch wrapper
// ============================================================
// 用途：
//   const data = await apiJson<Job[]>("/api/jobs");
//   await apiJson("/api/jobs", { method: "POST", body: jobInput });
// 约定：
//   - 自动 JSON.stringify body
//   - 自动加 Content-Type
//   - 非 2xx 抛 ApiError，并 toast.error(message)
//   - 204 返回 null
// ============================================================

import { toast } from "@/components/ui/toast";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface ApiInit extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** 默认 true —— 出错 toast 一次；如果调用方要自己弹错，传 false */
  showErrorToast?: boolean;
}

export async function apiJson<T = unknown>(
  url: string,
  init: ApiInit = {},
): Promise<T> {
  const { body, showErrorToast = true, headers, ...rest } = init;
  const hasBody = body !== undefined && body !== null;

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "网络请求失败";
    if (showErrorToast) toast.error(msg);
    throw new ApiError(0, msg);
  }

  if (res.status === 204) return null as T;

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    let message = `请求失败 (${res.status})`;
    if (data && typeof data === "object" && "error" in data) {
      const errVal = (data as { error: unknown }).error;
      if (typeof errVal === "string" && errVal.length > 0) message = errVal;
    }
    if (showErrorToast) toast.error(message);
    throw new ApiError(res.status, message);
  }

  return data as T;
}
