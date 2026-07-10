const studentCards = [
  ["全部学生", "0"],
  ["我的学生", "0"],
  ["定校待确认", "0"],
  ["高风险", "0"],
];

export default function StudentsPage() {
  return (
    <section>
      <p className="text-sm text-slate-500">学生管理</p>
      <h1 className="mt-1 text-3xl font-bold">学生列表</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        支持按姓名、申请季、顾问、申请类别、阶段和交接状态筛选。
        合同金额和邮箱会按角色权限显示。
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-4">
        {studentCards.map(([label, value]) => (
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
