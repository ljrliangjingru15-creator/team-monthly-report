const cards = [
  ["修改日志", "0"],
  ["导入记录", "0"],
  ["导出记录", "0"],
  ["配置修改", "0"],
];

export default function LogsPage() {
  return (
    <section>
      <p className="text-sm text-slate-500">日志记录</p>
      <h1 className="mt-1 text-3xl font-bold">日志与审计</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        记录导入、手动修改、冲突确认、月报生成、喜报生成、案例生成和导出动作。
        密码、电话、账号密码组合和对外敏感字段不得进入日志。
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <article
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            key={label}
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
