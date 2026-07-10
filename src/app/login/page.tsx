export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm text-slate-500">账号登录</p>
      <h1 className="mt-2 text-2xl font-bold">登录申请管理系统</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        第一批采用管理员创建账号、用户名和密码登录。当前页面是登录入口骨架，
        后续会接入真实会话和数据库账号。
      </p>

      <form className="mt-7 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          登录账号
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-base"
            name="username"
            placeholder="请输入账号"
            type="text"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          密码
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-base"
            name="password"
            placeholder="请输入密码"
            type="password"
          />
        </label>
        <button
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white"
          type="button"
        >
          登录
        </button>
      </form>
    </section>
  );
}
