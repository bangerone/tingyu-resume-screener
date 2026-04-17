import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">页面不存在</h1>
        <p className="mt-2 text-sm text-slate-500">
          你访问的链接已失效或岗位已下架。
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
          <Link href="/jobs">
            <Button variant="outline">看看在招岗位</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
