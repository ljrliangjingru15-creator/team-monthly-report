const roleCards = [
  ["管理员", "创建账号、停用账号、维护导入/导出配置、查看全部数据"],
  ["组长 + 顾问", "查看全后期团队，同时保留本人顾问工作台"],
  ["顾问", "只查看和处理本人负责学生、申请、月报、喜报和案例"],
];

export default function UsersAdminPage() {
  return (
    <section>
      <p className="text-sm text-slate-500">系统配置 / 账号管理</p>
      <h1 className="mt-1 text-3xl font-bold">账号与权限</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        管理员在这里创建账号、分配角色并停用账号。当前是页面骨架；
        Task 3 已先完成底层权限规则，后续任务会接入真实数据操作。
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {roleCards.map(([title, description]) => (
          <article
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            key={title}
          >
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
