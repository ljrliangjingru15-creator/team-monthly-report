"use client";

import { useState } from "react";
import {
  previewUploadedWorkbook,
  type UploadedWorkbookPreview,
} from "@/features/import/import-preview-service";
import { buildCommitPlan, type CommitOperation } from "@/features/import/commit-import";

const layoutLabels = {
  STUDENT_MASTER: "总表",
  COUNSELOR_PROGRESS: "顾问进度表",
  UNKNOWN: "未知版式",
};

type UploadPreviewPanelProps = {
  season: string;
};

export function UploadPreviewPanel({ season }: UploadPreviewPanelProps) {
  const [preview, setPreview] = useState<UploadedWorkbookPreview | null>(null);
  const [draft, setDraft] = useState<CommitDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      setDraft(null);
      setPreview(
        previewUploadedWorkbook({
          fileName: file.name,
          buffer,
          season,
          existingStudents: [],
          existingApplications: [],
        }),
      );
    } catch {
      setError("无法读取这个 Excel 文件，请确认文件格式为 .xlsx。");
      setPreview(null);
    } finally {
      setIsParsing(false);
    }
  }

  function handleCreateDraft() {
    if (!preview) return;

    const plan = buildCommitPlan(preview.preview, [
      { conflictId: "*", action: "use_existing" },
    ]);

    if (plan.status === "blocked") {
      setDraft({
        status: "blocked",
        createStudents: 0,
        createApplications: 0,
        updateStudents: 0,
        updateApplications: 0,
        conflictLogs: 0,
      });
      return;
    }

    setDraft(summarizeOperations(plan.operations));
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">第一步</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            上传 Excel 并生成预览
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            当前页面先在写入数据库前做预检查：识别版式、统计新增/更新/冲突、
            拦截电话和密码字段。确认预览后，下一步再接正式提交。
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          选择 Excel 文件
          <input
            accept=".xlsx,.xls"
            aria-label="选择 Excel 文件"
            className="sr-only"
            onChange={handleFileChange}
            type="file"
          />
        </label>
      </div>

      {isParsing ? (
        <p className="mt-5 text-sm text-slate-500">正在解析文件……</p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {preview ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              已识别：{layoutLabels[preview.layout]}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              文件：{preview.fileName}；识别置信度：
              {Math.round(preview.confidence * 100)}%
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <PreviewMetric label="新增学生" value={preview.preview.summary.createdStudents} />
            <PreviewMetric
              label="新增申请项"
              value={`${preview.preview.summary.createdApplications} 个`}
            />
            <PreviewMetric label="更新" value={preview.preview.summary.updatedStudents + preview.preview.summary.updatedApplications} />
            <PreviewMetric label="冲突" value={preview.preview.summary.conflicts} />
            <PreviewMetric
              label="人工确认"
              value={preview.preview.summary.manualReview}
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">敏感字段已拦截</p>
            <p className="mt-1">
              本次识别到 {preview.preview.summary.sensitiveFields} 类敏感字段，
              只保留字段类别用于审计，不保存电话、账号或密码原值。
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                无数据库确认草稿
              </p>
              <p className="mt-1 text-sm text-slate-500">
                先生成本次导入的操作清单，后续接入数据库时直接复用这套确认逻辑。
              </p>
            </div>
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
              onClick={handleCreateDraft}
              type="button"
            >
              生成确认草稿
            </button>
          </div>

          {draft ? <CommitDraftSummary draft={draft} /> : null}
        </div>
      ) : null}
    </div>
  );
}

type CommitDraft = {
  status: "ready" | "blocked";
  createStudents: number;
  createApplications: number;
  updateStudents: number;
  updateApplications: number;
  conflictLogs: number;
};

function summarizeOperations(operations: CommitOperation[]): CommitDraft {
  return {
    status: "ready",
    createStudents: operations.filter((operation) => operation.type === "create_student").length,
    createApplications: operations.filter(
      (operation) => operation.type === "create_application",
    ).length,
    updateStudents: operations.filter((operation) => operation.type === "update_student").length,
    updateApplications: operations.filter(
      (operation) => operation.type === "update_application",
    ).length,
    conflictLogs: operations.filter((operation) => operation.type === "write_conflict_log").length,
  };
}

function CommitDraftSummary({ draft }: { draft: CommitDraft }) {
  if (draft.status === "blocked") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        仍有未处理冲突，暂不能生成提交草稿。
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p className="font-medium">确认草稿已生成</p>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <p>将创建学生：{draft.createStudents}</p>
        <p>将创建申请项：{draft.createApplications}</p>
        <p>将更新学生：{draft.updateStudents}</p>
        <p>将更新申请项：{draft.updateApplications}</p>
        <p>冲突处理记录：{draft.conflictLogs}</p>
        <p>当前没有写入数据库</p>
      </div>
    </div>
  );
}

function PreviewMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}
