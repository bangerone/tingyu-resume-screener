"use client";

import { useRouter } from "next/navigation";
import { EmailCodeForm } from "@/features/auth";

export function MyApplicationsLogin() {
  const router = useRouter();
  return (
    <EmailCodeForm
      onSuccess={() => {
        router.refresh();
      }}
    />
  );
}
