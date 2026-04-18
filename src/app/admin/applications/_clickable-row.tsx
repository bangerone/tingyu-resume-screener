"use client";

// 让整行可点击跳详情（RSC 表格里嵌套 client <tr>）。
import { useRouter } from "next/navigation";

export function ClickableRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
      tabIndex={0}
      role="link"
      className="cursor-pointer hover:bg-slate-50/70 focus:bg-slate-50 focus:outline-none"
    >
      {children}
    </tr>
  );
}
