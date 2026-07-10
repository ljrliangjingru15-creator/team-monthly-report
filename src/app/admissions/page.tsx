const cards = [
  ["录取结果", "0"],
  ["录取", "0"],
  ["Waitlist / Defer", "0"],
  ["可生成喜报", "0"],
];

export default function AdmissionsPage() {
  return (
    <section>
      <p className="text-sm text-slate-500">录取结果</p>
      <h1 className="mt-1 text-3xl font-bold">录取结果统计</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        申请项结果会自动同步到这里，并作为录取喜报和内部案例生成入口。
        顾问只能查看自己学生的结果，组长可查看全团队。
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
