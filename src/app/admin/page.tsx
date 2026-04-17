// HR 工作台 — D1 占位页
// 真正的导航和数据在 D2 (岗位管理) / D4 (候选人池) 填充
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">HR 工作台</h1>
            <p className="text-sm text-slate-500 mt-1">庭宇智能简历筛选系统</p>
          </div>
          <form action="/api/admin/logout" method="post">
            <Button variant="outline" size="sm" type="submit">
              退出
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>D1 · 基础设施已就位</CardTitle>
            <CardDescription>
              TiDB 表建好、HR 登录通、候选人邮箱验证码通。D2 起补岗位 / 候选人池 / 飞书推送。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>
              冒烟状态：
              <Link
                href="/api/dev/ping"
                className="text-brand-600 underline ml-1"
                target="_blank"
              >
                /api/dev/ping
              </Link>
            </p>
            <p>候选人门户：
              <Link href="/" className="text-brand-600 underline ml-1">
                首页
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
