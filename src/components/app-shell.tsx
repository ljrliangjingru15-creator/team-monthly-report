import type { ReactNode } from "react";

const navigation = [
  "管理看板",
  "学生列表",
  "申请单元",
  "数据导入",
  "导入记录",
  "月度反馈",
  "修改日志",
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="bg-slate-900 px-5 py-7 text-white">
        <div className="mb-8 text-lg font-bold">2027 申请管理</div>
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
