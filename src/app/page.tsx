const cards = [
  ["学生总数", "0"],
  ["申请单元", "0"],
  ["未来 14 天 DDL", "0"],
  ["红色风险", "0"],
];

export default function HomePage() {
  return (
    <section>
      <p className="text-sm text-slate-500">2027 Fall</p>
      <h1 className="mt-1 text-3xl font-bold">管理看板</h1>
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
