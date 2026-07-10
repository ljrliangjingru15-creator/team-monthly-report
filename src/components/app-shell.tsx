"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const navigation = [
  "首页看板",
  "学生管理",
  "申请管理",
  "交接与问题",
  "录取结果",
  "月度反馈",
  "喜报/海报",
  "案例/经验库",
  "导入中心",
  "日志记录",
  "系统配置",
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/monthly-reports") {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="bg-slate-900 px-5 py-7 text-white">
        <div className="mb-2 text-lg font-bold">2027 申请管理</div>
        <div className="mb-8 text-xs text-slate-400">
          模块化一体式后期系统
        </div>
        <nav aria-label="主导航" className="grid gap-1">
          {navigation.map((item, index) => (
            <span
              className={`rounded-lg px-3 py-2.5 text-sm ${
                index === 0 ? "bg-blue-600" : "text-slate-300"
              }`}
              key={item}
            >
              {item}
            </span>
          ))}
        </nav>
      </aside>
      <main className="p-6 lg:p-10">{children}</main>
    </div>
  );
}
