const applicationCards = [
  ["申请项", "0"],
  ["未来 DDL", "0"],
  ["未提交", "0"],
  ["已有结果", "0"],
];

export default function ApplicationsPage() {
  return (
    <section>
      <p className="text-sm text-slate-500">申请管理</p>
      <h1 className="mt-1 text-3xl font-bold">申请项列表</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        支持按学生、学校、顾问、DDL、轮次、状态、结果和风险筛选。
        顾问只能看到自己学生的申请项，组长可查看全团队并切换本人视角。
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-4">
        {applicationCards.map(([label, value]) => (
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
