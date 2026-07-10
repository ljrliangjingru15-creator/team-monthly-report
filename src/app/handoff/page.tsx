const cards = [
  ["待处理", "0"],
  ["处理中", "0"],
  ["等待他人", "0"],
  ["已解决", "0"],
];

export default function HandoffPage() {
  return (
    <section>
      <p className="text-sm text-slate-500">交接与问题</p>
      <h1 className="mt-1 text-3xl font-bold">后期定校与交接质量反馈</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        系统会识别定校数量不一致、申请学校缺失或多出、DDL 缺失、申请状态不明确等异常，
        并转成可分派、可处理、可关闭的交接问题。
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
