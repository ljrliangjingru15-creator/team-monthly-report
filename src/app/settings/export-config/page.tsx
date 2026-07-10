import { defaultExportConfigs } from "@/features/export-config/defaults";
import { summarizeExportConfig } from "@/features/export-config/summary";

const summaries = defaultExportConfigs.map(summarizeExportConfig);

export default function ExportConfigPage() {
  return (
    <section>
      <p className="text-sm text-slate-500">系统配置 / 导出配置</p>
      <h1 className="mt-1 text-3xl font-bold">导出配置中心</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        导出配置用于维护月报、喜报、内部案例和列表导出的字段、模板、样式、
        水印和脱敏规则。对外导出默认隐藏合同金额、电话、账号密码和内部归因。
      </p>

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {summaries.map((summary) => (
          <article
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            key={summary.kind}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{summary.name}</h2>
                <p className="mt-1 text-xs text-slate-500">{summary.kind}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {summary.audience === "external" ? "对外" : "内部"}
              </span>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">导出格式</dt>
                <dd className="font-medium">{summary.outputFormats.join(" / ")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">字段数</dt>
                <dd className="font-medium">{summary.includedFields}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">水印</dt>
                <dd className="font-medium">{summary.watermarkEnabled ? "启用" : "未启用"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
