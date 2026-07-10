import { UploadPreviewPanel } from "./upload-preview-panel";

export default function ImportPage() {
  return (
    <section>
      <p className="text-sm text-slate-500">导入中心</p>
      <h1 className="mt-1 text-3xl font-bold">Excel 导入预览</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        上传 Excel 后，系统会先解析并生成预览：新增、更新、冲突、跳过字段、
        敏感字段丢弃和需人工处理项。确认冲突前不会写入正式数据。
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-4">
        {["新增", "更新", "冲突", "需人工处理"].map((label) => (
          <article
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            key={label}
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </article>
        ))}
      </div>

      <UploadPreviewPanel season="2027 Fall" />
    </section>
  );
}
