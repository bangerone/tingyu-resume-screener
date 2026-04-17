"use client";

// ============================================================
// useCandidateSession — client hook
// GET /api/auth/candidate/me 轮询当前候选人 session
// ============================================================

import { useCallback, useEffect, useState } from "react";

export interface CandidateUser {
  id: string;
  email: string;
  name: string;
}

export function useCandidateSession() {
  const [user, setUser] = useState<CandidateUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/candidate/me", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: CandidateUser | null };
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, refresh, setUser };
}

export async function candidateLogout() {
  await fetch("/api/auth/candidate/logout", {
    method: "POST",
    credentials: "same-origin",
  });
}
