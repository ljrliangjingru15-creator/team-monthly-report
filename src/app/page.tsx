const cards = [
  ["学生总数", "0"],
  ["申请单元", "0"],
  ["高风险", "0"],
  ["已逾期", "0"],
  ["未来 7 天 DDL", "0"],
  ["交接待处理", "0"],
  ["待生成月报", "0"],
  ["可生成喜报", "0"],
];

export default function HomePage() {
  return (
    <section>
      <p className="text-sm text-slate-500">2027 Fall</p>
      <h1 className="mt-1 text-3xl font-bold">首页看板</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        用于汇总学生、申请、DDL 风险、交接问题、月度反馈和喜报/案例待办。
        风险规则分为正常、关注、高风险和已逾期四档。
      </p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
