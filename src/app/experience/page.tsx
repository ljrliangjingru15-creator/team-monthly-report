const cards = [
  ["成功案例", "0"],
  ["院校经验", "0"],
  ["风险处理", "0"],
  ["交接经验", "0"],
];

export default function ExperiencePage() {
  return (
    <section>
      <p className="text-sm text-slate-500">案例/经验库</p>
      <h1 className="mt-1 text-3xl font-bold">成功案例库与经验库</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        从录取结果、交接问题、特殊申请过程和顾问手动记录中沉淀可复用经验。
        顾问管理自己范围内案例，组长可查看团队经验库。
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
