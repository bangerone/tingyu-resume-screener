// HR 工作台首页 — 外壳在 admin/layout.tsx，这里只渲染内容
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">HR 工作台</h1>
        <p className="mt-1 text-sm text-slate-500">庭宇智能简历筛选系统</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>快速入口</CardTitle>
          <CardDescription>
            在这里管理岗位、查看候选人评分、推送高分候选人到飞书群。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>
            <Link
              href="/admin/jobs"
              className="text-brand-600 underline underline-offset-2"
            >
              岗位管理 →
            </Link>
          </p>
          <p>
            <Link
              href="/admin/applications"
              className="text-brand-600 underline underline-offset-2"
            >
              候选人池 →
            </Link>
          </p>
          <p>
            候选人门户：
            <Link href="/" className="ml-1 text-brand-600 underline underline-offset-2">
              首页
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
