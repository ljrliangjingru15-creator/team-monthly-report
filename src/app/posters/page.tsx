const cards = [
  ["可生成喜报", "0"],
  ["草稿", "0"],
  ["已预览", "0"],
  ["已导出", "0"],
];

export default function PostersPage() {
  return (
    <section>
      <p className="text-sm text-slate-500">喜报/海报</p>
      <h1 className="mt-1 text-3xl font-bold">录取喜报/海报</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        从录取结果一键生成基础喜报，自动带入学校、录取结果、学生背景和顾问信息。
        导出 PNG/PDF 前必须预览并完成脱敏。
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
