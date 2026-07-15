"use client";

import {
  ArrowDown,
  ArrowUp,
  Bold as BoldIcon,
  Check,
  Download,
  FileText,
  GripVertical,
  Paperclip,
  Palette,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Underline as UnderlineIcon,
  Upload,
  Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  APPLICATION_TYPE_OPTIONS,
  getMonthlyReportApplicationConfig,
  type MonthlyReportApplicationType,
  type MonthlyReportTheme,
} from "@/features/monthly-reports/application-types";

type EditableReportContent = {
  title: string;
  studentName: string;
  season: string;
  departmentLabel: string;
  completedThisMonth: string;
  nextMonthPlan: string;
  nextStageFocus: string;
  clientTasks: string;
  recognizedApplicationStatus: string;
  studentBasicInfo: string;
  materialCollectionStatus: string;
  additionalRecognizedFields: string;
};

type AttachmentItem = {
  id: string;
  name: string;
  size: number;
  type: string;
};

type TimelineStatus = "completed" | "current" | "pending";

type TimelineItem = {
  id: string;
  label: string;
  status: TimelineStatus;
  note: string;
};

type RecognizedField = {
  id: string;
  label: string;
  value: string;
  selected: boolean;
};

type ModuleVisibility = {
  studentName: boolean;
  season: boolean;
  applicationType: boolean;
  stageFocus: boolean;
  summary: boolean;
  timeline: boolean;
  basicInfo: boolean;
  materialCollection: boolean;
  completedThisMonth: boolean;
  nextMonthPlan: boolean;
  clientTasks: boolean;
  attachments: boolean;
};

type TextFormattingKey =
  | "completedThisMonth"
  | "nextMonthPlan"
  | "clientTasks"
  | "studentBasicInfo"
  | "materialCollectionStatus";

type TextFormatting = {
  color: string;
  bold: boolean;
  underline: boolean;
};

type TextFormattingMap = Record<TextFormattingKey, TextFormatting>;

type ReportModuleKey =
  | "stageFocus"
  | "summary"
  | "timeline"
  | "basicInfo"
  | "materialCollection"
  | "completedThisMonth"
  | "nextMonthPlan"
  | "clientTasks"
  | "attachments";

type ExportFormat = "PDF" | "PNG";

type KeyValueRow = {
  label: string;
  value: string;
};

type MaterialStatusKey = "done" | "active" | "pending" | "later" | "blocked" | "na";

type MaterialReportRow = {
  item: string;
  status: MaterialStatusKey;
  statusLabel: string;
  remark: string;
};

const initialApplicationType: MonthlyReportApplicationType = "美国本科新生";
const companyLogoSrc = "/new-oriental-logo-2026.png";

const departmentLabelByApplicationType: Record<
  MonthlyReportApplicationType,
  string
> = {
  美国本科新生: "广州新东方前途出国美国本科部",
  美国本科转学: "广州新东方前途出国美国本科部",
  美国中学: "广州新东方前途出国美国中学部",
  加拿大中学: "广州新东方前途出国加拿大部",
  加拿大本科: "广州新东方前途出国加拿大部",
  美国硕博: "广州新东方前途出国美国研究生部",
  加拿大硕博: "广州新东方前途出国加拿大部",
  综合评价申请: "大湾区中外合办升学指导中心",
  中外合办申请: "大湾区中外合办升学指导中心",
};

const timelineStatusOptions: Array<{
  label: string;
  value: TimelineStatus;
}> = [
  { label: "已完成", value: "completed" },
  { label: "当前重点", value: "current" },
  { label: "待推进", value: "pending" },
];

const themeColorFields: Array<{
  key: keyof Omit<MonthlyReportTheme, "themeName" | "fontFamily">;
  label: string;
}> = [
  { key: "primaryColor", label: "主色" },
  { key: "secondaryColor", label: "辅助色" },
  { key: "backgroundColor", label: "页面背景" },
  { key: "cardColor", label: "报告底色" },
  { key: "titleColor", label: "标题色" },
  { key: "textColor", label: "正文色" },
  { key: "mutedTextColor", label: "辅助文字色" },
  { key: "accentColor", label: "强调色" },
  { key: "timelineCompletedColor", label: "已完成节点" },
  { key: "timelineCurrentColor", label: "当前节点" },
  { key: "timelinePendingColor", label: "待推进节点" },
];

const studentNameField = "学生姓名";

const studentBasicInfoFields = [
  "就读年级",
  "就读学校",
  "国籍",
  "生日",
  "语言成绩（托福/雅思/Duoligo目前最高分）",
  "标化考试（SAT/ACT目前最高分）",
  "AP分数",
  "目前GPA",
];

const materialCollectionFields = [
  "简历信息表",
  "文书信息表",
  "推荐人信息表",
  "推荐人信息",
  "语言/标化成绩单",
  "G9-12成绩单",
  "校外课程成绩单",
  "护照",
  "美签页",
  "I-20",
  "存款证明",
  "信用卡",
  "活动和获奖证明",
];

const fieldAliases: Record<string, string> = {
  姓名: studentNameField,
  学生姓名: studentNameField,
  年级: "就读年级",
  就读年级: "就读年级",
  学校: "就读学校",
  就读学校: "就读学校",
  国籍: "国籍",
  生日: "生日",
  出生日期: "生日",
  "托福/雅思/Duolingo目前最高分": "语言成绩（托福/雅思/Duoligo目前最高分）",
  "托福/雅思/Duoligo目前最高分": "语言成绩（托福/雅思/Duoligo目前最高分）",
  语言成绩: "语言成绩（托福/雅思/Duoligo目前最高分）",
  "SAT/ACT目前最高分": "标化考试（SAT/ACT目前最高分）",
  标化考试: "标化考试（SAT/ACT目前最高分）",
  AP分数: "AP分数",
  目前GPA: "目前GPA",
  GPA: "目前GPA",
  获奖和活动证明: "活动和获奖证明",
  活动和获奖证明: "活动和获奖证明",
  护照及美签页: "护照",
};

const materialCollectionAliases = [
  "材料收集情况",
  "材料收集状态",
  "材料收集",
];

const applicationProgressFields = [
  "申请进度",
  "申请院校提交情况",
  "院校提交情况",
  "申请提交情况",
  "提交情况",
  "申请状态",
  "阶段性反馈",
  "本月完成情况",
];

const defaultModules: ModuleVisibility = {
  studentName: true,
  season: true,
  applicationType: true,
  stageFocus: true,
  summary: true,
  timeline: true,
  basicInfo: true,
  materialCollection: true,
  completedThisMonth: true,
  nextMonthPlan: true,
  clientTasks: true,
  attachments: false,
};

const moduleLabels: Array<{
  key: keyof ModuleVisibility;
  label: string;
}> = [
  { key: "studentName", label: "展示学生姓名" },
  { key: "season", label: "展示申请季度" },
  { key: "applicationType", label: "在最终报告中展示申请类型" },
  { key: "stageFocus", label: "展示当前阶段重点和下一步建议" },
  { key: "summary", label: "展示关键摘要" },
  { key: "timeline", label: "展示申请时间轴" },
  { key: "basicInfo", label: "展示基础信息" },
  { key: "materialCollection", label: "展示材料收集" },
  { key: "completedThisMonth", label: "展示阶段性反馈" },
  { key: "nextMonthPlan", label: "展示下一阶段计划" },
  { key: "clientTasks", label: "展示需要学生/家庭配合" },
  { key: "attachments", label: "展示附件列表" },
];

const defaultReportModuleOrder: ReportModuleKey[] = [
  "stageFocus",
  "summary",
  "timeline",
  "basicInfo",
  "materialCollection",
  "completedThisMonth",
  "nextMonthPlan",
  "clientTasks",
  "attachments",
];

const reportModuleLabels: Record<ReportModuleKey, string> = {
  stageFocus: "当前阶段重点和下一步建议",
  summary: "关键摘要",
  timeline: "申请时间轴",
  basicInfo: "基础信息",
  materialCollection: "材料收集",
  completedThisMonth: "阶段性反馈",
  nextMonthPlan: "下一阶段计划",
  clientTasks: "需要学生/家庭配合",
  attachments: "附件",
};

const reportModuleToggleLabels: Record<ReportModuleKey, string> = {
  stageFocus: "展示当前阶段重点和下一步建议",
  summary: "展示关键摘要",
  timeline: "展示申请时间轴",
  basicInfo: "展示基础信息",
  materialCollection: "展示材料收集",
  completedThisMonth: "展示阶段性反馈",
  nextMonthPlan: "展示下一阶段计划",
  clientTasks: "展示需要学生/家庭配合",
  attachments: "展示附件列表",
};

const exportDate = "20260707";
const emptySectionPlaceholder = "待填写";
const defaultStudentBasicInfo = [
  "就读年级：",
  "就读学校：",
  "语言成绩：",
  "标化考试：",
  "AP分数：",
  "GPA：",
].join("\n");

const statusStyles: Record<MaterialStatusKey, { label: string; bg: string; color: string }> = {
  done: { label: "已完成", bg: "#ddf7ed", color: "#047857" },
  active: { label: "进行中", bg: "#eef2ff", color: "#3730a3" },
  pending: { label: "待提供", bg: "#fff4d6", color: "#b45309" },
  later: { label: "后续提供", bg: "#e0f2fe", color: "#0369a1" },
  blocked: { label: "需关注", bg: "#fee2e2", color: "#b91c1c" },
  na: { label: "不适用", bg: "#f1f5f9", color: "#64748b" },
};

function buildDefaultContent(
  applicationType: MonthlyReportApplicationType,
): EditableReportContent {
  const config = getMonthlyReportApplicationConfig(applicationType);

  return {
    title: "测试学生甲申请季阶段性反馈报告",
    studentName: "测试学生甲",
    season: "2027秋",
    departmentLabel: departmentLabelByApplicationType[applicationType],
    completedThisMonth: config.defaultContent.completedThisMonth,
    nextMonthPlan: config.defaultContent.nextMonthPlan,
    nextStageFocus: config.defaultContent.nextStageFocus,
    clientTasks: config.defaultContent.clientTasks.join("\n"),
    recognizedApplicationStatus: "",
    studentBasicInfo: defaultStudentBasicInfo,
    materialCollectionStatus: "",
    additionalRecognizedFields: "",
  };
}

function buildDefaultTextFormatting(color: string): TextFormattingMap {
  const createFormatting = (): TextFormatting => ({
    color,
    bold: false,
    underline: false,
  });

  return {
    completedThisMonth: createFormatting(),
    nextMonthPlan: createFormatting(),
    clientTasks: createFormatting(),
    studentBasicInfo: createFormatting(),
    materialCollectionStatus: createFormatting(),
  };
}

type ReportTextEditorProps = {
  id: string;
  label: string;
  value: string;
  formatting: TextFormatting;
  className?: string;
  minHeightClass?: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  onFormattingChange: (formatting: TextFormatting) => void;
};

function ReportTextEditor({
  id,
  label,
  value,
  formatting,
  className = "",
  minHeightClass = "min-h-28",
  placeholder,
  onValueChange,
  onFormattingChange,
}: ReportTextEditorProps) {
  return (
    <section className={`grid gap-2 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <label
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-white shadow-sm"
            title={`${label}文字颜色`}
          >
            <Palette className="h-4 w-4" aria-hidden />
            <input
              aria-label={`${label}文字颜色`}
              className="absolute h-px w-px opacity-0"
              type="color"
              value={formatting.color}
              onChange={(event) =>
                onFormattingChange({ ...formatting, color: event.target.value })
              }
            />
          </label>
          <button
            aria-label={`${label}加粗`}
            aria-pressed={formatting.bold}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm aria-pressed:bg-slate-900 aria-pressed:text-white"
            title="加粗"
            type="button"
            onClick={() =>
              onFormattingChange({ ...formatting, bold: !formatting.bold })
            }
          >
            <BoldIcon className="h-4 w-4" aria-hidden />
          </button>
          <button
            aria-label={`${label}下划线`}
            aria-pressed={formatting.underline}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm aria-pressed:bg-slate-900 aria-pressed:text-white"
            title="下划线"
            type="button"
            onClick={() =>
              onFormattingChange({
                ...formatting,
                underline: !formatting.underline,
              })
            }
          >
            <UnderlineIcon className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <textarea
        aria-label={label}
        className={`${minHeightClass} rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6`}
        id={id}
        placeholder={placeholder}
        style={{
          color: formatting.color,
          fontWeight: formatting.bold ? 700 : 400,
          textDecoration: formatting.underline ? "underline" : "none",
        }}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </section>
  );
}

function buildDefaultTimeline(
  applicationType: MonthlyReportApplicationType,
): TimelineItem[] {
  const config = getMonthlyReportApplicationConfig(applicationType);

  return config.timeline.map((label, index) => ({
    id: `${applicationType}-${index}-${label}`,
    label,
    status: index < 3 ? "completed" : index === 3 ? "current" : "pending",
    note: "",
  }));
}

function extractFeedbackFromCommunication(rawText: string, fallback: EditableReportContent) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const matchingLines = (patterns: RegExp[]) =>
    lines.filter((line) => patterns.some((pattern) => pattern.test(line)));
  const completedLines = matchingLines([/完成|已推进|已确认|已提交|梳理|整理/]);
  const nextPlanLines = matchingLines([/下月|下周|下一步|计划|继续推进/]);
  const focusLines = matchingLines([/重点|关注|风险|提醒|节点|阶段/]);
  const clientTaskLines = matchingLines([
    /(^请|需要|待学生|待家长|补充|上传|提供|证明)/,
  ]);
  const completedThisMonth =
    completedLines.join("\n") ||
    fallback.completedThisMonth;
  const nextMonthPlan =
    nextPlanLines.join("\n") ||
    fallback.nextMonthPlan;
  const nextStageFocus =
    focusLines.join("\n") ||
    fallback.nextStageFocus;

  return {
    completedThisMonth,
    nextMonthPlan,
    nextStageFocus,
    clientTasks: clientTaskLines.join("\n") || fallback.clientTasks,
  };
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function sanitizeFileNameSegment(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
}

function filesToAttachments(files: FileList | File[] | null | undefined) {
  return Array.from(files ?? []).map((file, index) => ({
    id: `${file.name}-${file.size}-${index}`,
    name: file.name,
    size: file.size,
    type: file.type || "未知类型",
  }));
}

function shouldReadUploadedFileAsText(file: File) {
  const textExtensions = [".txt", ".md", ".csv", ".html", ".htm"];
  const lowerName = file.name.toLowerCase();

  return (
    file.type.startsWith("text/") ||
    textExtensions.some((extension) => lowerName.endsWith(extension))
  );
}

function isSpreadsheetFile(file: File) {
  const lowerName = file.name.toLowerCase();

  return (
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".xls") ||
    lowerName.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type.includes("spreadsheet")
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isMeaningfulRecognizedValue(value: string) {
  const normalized = value.trim();
  return Boolean(normalized) && !/^(无|未填写|暂无|N\/A|NA|-|—|--|空)$/i.test(normalized);
}

function extractLabeledValue(rawText: string, labels: string[]) {
  const normalized = rawText.replace(/\r/g, "\n").replace(/\u2028/g, "\n");
  const segments = normalized
    .split(/[\n；;|｜]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const label of labels) {
    const escapedLabel = escapeRegExp(label);
    const segment = segments.find((item) =>
      new RegExp(`^${escapedLabel}[ \\t]*[:：]`).test(item),
    );
    const segmentValue = segment?.replace(
      new RegExp(`^${escapedLabel}[ \\t]*[:：][ \\t]*`),
      "",
    );
    if (segmentValue && isMeaningfulRecognizedValue(segmentValue)) {
      return segmentValue.trim();
    }

    const pattern = new RegExp(`${escapedLabel}[ \\t]*[:：][ \\t]*([^\\n；;|｜]+)`);
    const match = normalized.match(pattern);
    if (match?.[1]?.trim() && isMeaningfulRecognizedValue(match[1])) {
      return match[1].trim();
    }
  }

  return "";
}

function extractFieldList(rawText: string, labels: string[]) {
  return labels
    .map((label) => {
      const value = extractLabeledValue(rawText, [label]);
      return value ? `${label}：${value}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

function normalizeRecognizedLabel(label: string) {
  return label.replace(/\s+/g, "").trim();
}

function canonicalizeRecognizedLabel(label: string) {
  const normalizedLabel = normalizeRecognizedLabel(label);
  const alias = Object.entries(fieldAliases).find(
    ([sourceLabel]) => normalizeRecognizedLabel(sourceLabel) === normalizedLabel,
  );

  return alias?.[1] ?? label.replace(/\s+/g, " ").trim();
}

function formatRecognizedFields(fields: RecognizedField[]) {
  return fields.map((field) => `${field.label}：${field.value}`).join("\n");
}

function parseAllRecognizedFields(rawText: string): RecognizedField[] {
  const normalized = rawText
    .replace(/\r/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(th|td)>\s*<t[hd][^>]*>/gi, "：")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ");
  const segments = normalized
    .split(/[\n；;|｜]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const fields: RecognizedField[] = [];
  const seenLabels = new Set<string>();

  segments.forEach((segment, index) => {
    const match = segment.match(/^(.{1,56}?)[ \t]*[:：][ \t]*(.+)$/);
    if (!match) return;
    const label = canonicalizeRecognizedLabel(match[1]);
    const value = match[2].replace(/\s+/g, " ").trim();
    if (!label || !isMeaningfulRecognizedValue(value)) return;
    if (/^(http|https|data|blob)$/i.test(label)) return;
    const normalizedLabel = normalizeRecognizedLabel(label);
    if (seenLabels.has(normalizedLabel)) return;
    seenLabels.add(normalizedLabel);
    fields.push({
      id: `${sanitizeFileNameSegment(label) || "field"}-${index}`,
      label,
      value,
      selected: true,
    });
  });

  return fields;
}

function normalizeSpreadsheetValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function parseCsvRows(text: string) {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) =>
      line
        .split(",")
        .map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"').trim()),
    )
    .filter((row) => row.some((cell) => cell.trim()));
}

function isFieldContentHeader(row: string[]) {
  const normalized = row.map(normalizeRecognizedLabel);
  return normalized[0] === "字段" && ["内容", "信息", "值"].includes(normalized[1] ?? "");
}

function fieldsFromKeyValueRows(rows: string[][]) {
  const fields: RecognizedField[] = [];

  rows.slice(isFieldContentHeader(rows[0] ?? []) ? 1 : 0).forEach((row, index) => {
    const label = canonicalizeRecognizedLabel(normalizeSpreadsheetValue(row[0]));
    const value = normalizeSpreadsheetValue(row[1]);
    if (!label || !isMeaningfulRecognizedValue(value)) return;
    fields.push({
      id: `${sanitizeFileNameSegment(label) || "excel-field"}-${index}`,
      label,
      value,
      selected: true,
    });
  });

  return fields;
}

function findSpreadsheetHeaderRow(rows: string[][]) {
  return rows.findIndex((row) => {
    const labels = row.map(normalizeRecognizedLabel);
    return labels.includes("学生姓名") || labels.includes("姓名");
  });
}

function fieldsFromTableRows(rows: string[][], studentName: string) {
  const headerIndex = findSpreadsheetHeaderRow(rows);
  if (headerIndex < 0) return [];

  const headers = rows[headerIndex].map((header) =>
    canonicalizeRecognizedLabel(normalizeSpreadsheetValue(header)),
  );
  const nameIndex = headers.findIndex((header) =>
    ["学生姓名", "姓名"].includes(normalizeRecognizedLabel(header)),
  );
  const records = rows
    .slice(headerIndex + 1)
    .filter((row) => row.some((cell) => normalizeSpreadsheetValue(cell)));
  const normalizedStudentName = normalizeRecognizedLabel(studentName);
  const matchedRecord =
    records.find((row) => {
      const rowName = normalizeRecognizedLabel(row[nameIndex] ?? "");
      return (
        rowName === normalizedStudentName ||
        Boolean(rowName && normalizedStudentName && rowName.includes(normalizedStudentName))
      );
    }) ?? records[0];

  if (!matchedRecord) return [];

  const fields: RecognizedField[] = [];

  headers.forEach((label, index) => {
    const value = normalizeSpreadsheetValue(matchedRecord[index]);
    if (!label || !isMeaningfulRecognizedValue(value)) return;
    fields.push({
      id: `${sanitizeFileNameSegment(label) || "excel-field"}-${index}`,
      label,
      value,
      selected: true,
    });
  });

  return fields;
}

function fieldsFromSpreadsheetRows(rows: string[][], studentName: string) {
  if (rows.length === 0) return [];
  if (isFieldContentHeader(rows[0]) || (rows[0]?.length ?? 0) === 2) {
    const keyValueFields = fieldsFromKeyValueRows(rows);
    if (keyValueFields.length > 0) return keyValueFields;
  }

  return fieldsFromTableRows(rows, studentName);
}

async function parseSpreadsheetFile(file: File, studentName: string) {
  if (file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv") {
    return fieldsFromSpreadsheetRows(parseCsvRows(await file.text()), studentName);
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const rows = workbook.SheetNames.flatMap((sheetName) =>
    XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
      defval: "",
    }),
  );

  return fieldsFromSpreadsheetRows(
    rows.map((row) => row.map(normalizeSpreadsheetValue)),
    studentName,
  );
}

function buildContentFromRecognizedFields(fields: RecognizedField[]) {
  const selectedFields = fields.filter((field) => field.selected);
  const studentLabels = new Set(studentBasicInfoFields.map(normalizeRecognizedLabel));
  const materialLabels = new Set(
    [...materialCollectionFields, ...materialCollectionAliases].map(
      normalizeRecognizedLabel,
    ),
  );
  const progressLabels = new Set(applicationProgressFields.map(normalizeRecognizedLabel));
  const studentName = selectedFields.find(
    (field) => normalizeRecognizedLabel(field.label) === normalizeRecognizedLabel(studentNameField),
  )?.value;
  const studentBasicInfo = selectedFields
    .filter((field) => studentLabels.has(normalizeRecognizedLabel(field.label)))
    .map((field) => `${field.label}：${field.value}`)
    .join("\n");
  const materialCollectionStatus = selectedFields
    .filter((field) => materialLabels.has(normalizeRecognizedLabel(field.label)))
    .map((field) => `${field.label}：${field.value}`)
    .join("\n");
  const applicationProgress = selectedFields
    .filter((field) => progressLabels.has(normalizeRecognizedLabel(field.label)))
    .map((field) => `${field.label}：${field.value}`)
    .join("\n");

  return {
    recognizedApplicationStatus: formatRecognizedFields(selectedFields),
    studentName,
    studentBasicInfo,
    materialCollectionStatus,
    additionalRecognizedFields: "",
    applicationProgress,
  };
}

function isReportRecognizedField(field: RecognizedField) {
  const label = normalizeRecognizedLabel(field.label);
  const allowedLabels = [
    studentNameField,
    ...studentBasicInfoFields,
    ...materialCollectionFields,
    ...materialCollectionAliases,
    ...applicationProgressFields,
  ].map(normalizeRecognizedLabel);

  return allowedLabels.includes(label);
}

function mergeRecognizedFields(
  currentFields: RecognizedField[],
  nextFields: RecognizedField[],
) {
  const byLabel = new Map(
    currentFields.map((field) => [normalizeRecognizedLabel(field.label), field]),
  );

  nextFields.forEach((field) => {
    const key = normalizeRecognizedLabel(field.label);
    const previous = byLabel.get(key);
    byLabel.set(key, {
      ...field,
      id: previous?.id ?? field.id,
      selected: previous?.selected ?? field.selected,
    });
  });

  return Array.from(byLabel.values());
}

const previousReportHeadings = [
  "基础信息",
  "学生基础信息",
  "材料收集",
  "材料收集情况",
  "申请截图识别",
  "截图识别结果",
  "阶段性反馈",
  "本次阶段性进度",
  "本月完成情况",
  "下一阶段计划",
  "下月计划",
  "下一阶段重点",
  "当前阶段重点和下一步建议",
  "顾问阶段性反馈 / 本次阶段性进度",
  "本阶段后续动作 / 下一阶段计划",
  "学生/家庭待办",
  "学生/家庭待办 / 需要学生/家庭配合",
  "需要学生/家庭配合",
];

function normalizeReportText(rawText: string) {
  return rawText
    .replace(/\r/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/t[hd]>\s*<t[hd][^>]*>/gi, "：")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|section|table)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function normalizeReportHeading(line: string) {
  return line.replace(/[：:]\s*$/, "").trim();
}

function isReportHeadingMatch(line: string, heading: string) {
  const normalizedLine = normalizeReportHeading(line);
  const normalizedHeading = normalizeReportHeading(heading);
  return (
    normalizedLine === normalizedHeading ||
    normalizedLine.includes(normalizedHeading) ||
    normalizedLine
      .split("/")
      .map((part) => part.trim())
      .includes(normalizedHeading)
  );
}

function extractReportSection(rawText: string, heading: string) {
  const normalized = normalizeReportText(rawText);
  const lines = normalized
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const startIndex = lines.findIndex((line) =>
    isReportHeadingMatch(line, heading),
  );

  if (startIndex >= 0) {
    const bodyLines: string[] = [];
    for (let index = startIndex + 1; index < lines.length; index += 1) {
      if (
        previousReportHeadings.some((knownHeading) =>
          isReportHeadingMatch(lines[index], knownHeading),
        )
      ) {
        break;
      }
      bodyLines.push(lines[index]);
    }
    return bodyLines.join("\n").trim();
  }

  return extractLabeledValue(normalized, [heading]);
}

function parseApplicationScreenshotStatus(rawText: string, fileName: string) {
  const materialStatus = extractLabeledValue(rawText, [
    "材料收集情况",
    "材料收集状态",
    "材料收集",
  ]);
  const submissionStatus = extractLabeledValue(rawText, [
    "申请院校提交情况",
    "院校提交情况",
    "申请提交情况",
    "提交情况",
  ]);
  const lines = [
    materialStatus ? `材料收集情况：${materialStatus}` : "",
    submissionStatus ? `申请院校提交情况：${submissionStatus}` : "",
  ].filter(Boolean);

  if (lines.length > 0) return lines.join("\n");
  if (/材料|提交|申请|院校/.test(fileName)) {
    return `已上传申请截图：${fileName}\n未识别到材料收集或院校提交文字，可在此处手动补充。`;
  }

  return "";
}

function parseApplicationScreenshotContent(rawText: string, fileName: string) {
  const studentBasicInfo = extractFieldList(rawText, studentBasicInfoFields);
  const materialCollectionStatus = extractFieldList(rawText, materialCollectionFields);
  const hasStructuredFields = Boolean(studentBasicInfo || materialCollectionStatus);
  const statusSummary = hasStructuredFields
    ? ""
    : parseApplicationScreenshotStatus(rawText, fileName);
  const recognizedApplicationStatus = [
    studentBasicInfo,
    materialCollectionStatus,
    statusSummary,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    studentBasicInfo,
    materialCollectionStatus,
    recognizedApplicationStatus,
  };
}

async function recognizeImageText(file: File) {
  if (
    typeof fetch === "undefined" ||
    typeof navigator === "undefined" ||
    navigator.userAgent.toLowerCase().includes("jsdom") ||
    !file.type.startsWith("image/")
  ) {
    return "";
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/monthly-reports/ocr", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) return "";
    const payload = (await response.json()) as { text?: string };
    return payload.text ?? "";
  } catch {
    return "";
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dataUrlToBlob(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "application/octet-stream";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  underline = false,
) {
  const paragraphs = text.split(/\n/);
  let currentY = y;

  const drawLine = (line: string) => {
    context.fillText(line, x, currentY);
    if (underline) {
      const lineWidth = context.measureText(line).width;
      context.beginPath();
      context.moveTo(x, currentY + 3);
      context.lineTo(x + lineWidth, currentY + 3);
      context.strokeStyle = context.fillStyle as string;
      context.lineWidth = 1;
      context.stroke();
    }
  };

  paragraphs.forEach((paragraph) => {
    let line = "";
    Array.from(paragraph).forEach((character) => {
      const nextLine = `${line}${character}`;
      if (context.measureText(nextLine).width > maxWidth && line) {
        drawLine(line);
        line = character;
        currentY += lineHeight;
      } else {
        line = nextLine;
      }
    });
    if (line) {
      drawLine(line);
      currentY += lineHeight;
    } else {
      currentY += lineHeight;
    }
  });

  return currentY;
}

function splitReportLines(text: string) {
  return text
    .split(/\r?\n|；|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseKeyValueRows(text: string): KeyValueRow[] {
  return splitReportLines(text).map((line) => {
    const separatorIndex = line.search(/[:：]/);
    if (separatorIndex < 0) {
      return { label: line.trim(), value: emptySectionPlaceholder };
    }

    const label = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    return { label, value: value || emptySectionPlaceholder };
  });
}

function normalizeMaterialStatus(value: string): MaterialStatusKey {
  const normalized = value.trim();
  if (!normalized || /^(\/|-|—|不适用|无需|NA|N\/A)$/i.test(normalized)) return "na";
  if (/风险|异常|无法|缺失|逾期|需关注|问题/.test(normalized)) return "blocked";
  if (/申请季提供|后续提供|之后提供|后补|后续/.test(normalized)) return "later";
  if (/等待提供|暂未提供|待补充|待提供|未提供|缺|待/.test(normalized)) return "pending";
  if (/进行中|处理中|准备中|沟通中/.test(normalized)) return "active";
  if (/√|已提供|已收集|已完成|完成|已有|OK|ok|提交/.test(normalized)) return "done";
  return "active";
}

function parseMaterialRows(text: string): MaterialReportRow[] {
  return parseKeyValueRows(text).map((row) => {
    const status = normalizeMaterialStatus(row.value);
    return {
      item: row.label,
      status,
      statusLabel: statusStyles[status].label,
      remark: row.value,
    };
  });
}

function findInfoValue(rows: KeyValueRow[], labels: string[]) {
  const normalizedLabels = labels.map(normalizeRecognizedLabel);
  return (
    rows.find((row) =>
      normalizedLabels.includes(normalizeRecognizedLabel(row.label)),
    )?.value ?? emptySectionPlaceholder
  );
}

function buildMetricSummary(infoRows: KeyValueRow[], materialRows: MaterialReportRow[]) {
  const completedMaterials = materialRows.filter((row) => row.status === "done").length;
  const totalMaterials = materialRows.length;
  const materialText =
    totalMaterials > 0 ? `${completedMaterials}/${totalMaterials}` : emptySectionPlaceholder;
  const school = findInfoValue(infoRows, ["就读学校", "学校"]);
  const gpa = findInfoValue(infoRows, ["目前GPA", "GPA"]);
  const grade = findInfoValue(infoRows, ["就读年级", "年级"]);
  const language = findInfoValue(infoRows, [
    "语言成绩（托福/雅思/Duoligo目前最高分）",
    "托福/雅思/Duolingo目前最高分",
    "托福/雅思/Duoligo目前最高分",
    "语言成绩",
  ]);
  const academicItems = [
    gpa !== emptySectionPlaceholder ? `GPA ${gpa}` : "",
    grade !== emptySectionPlaceholder ? `${grade}年级` : "",
    language !== emptySectionPlaceholder ? language : "",
  ].filter(Boolean);

  return {
    materialText,
    materialPercent: totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0,
    academicText: academicItems.join(" / ") || emptySectionPlaceholder,
    school,
  };
}

function getCurrentTimelineItem(timelineItems: TimelineItem[]) {
  return (
    timelineItems.find((item) => item.status === "current") ??
    timelineItems.find((item) => item.status === "pending") ??
    timelineItems[timelineItems.length - 1]
  );
}

function buildActionItems(text: string) {
  const lines = splitReportLines(text);
  return lines.length > 0 ? lines : [emptySectionPlaceholder];
}

function summarizeAdvisorFeedback(text: string) {
  const normalized = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
  if (!normalized) return emptySectionPlaceholder;
  return normalized;
}

export function MonthlyReportWorkspace() {
  const [applicationType, setApplicationType] =
    useState<MonthlyReportApplicationType>(initialApplicationType);
  const [content, setContent] = useState(() => buildDefaultContent(initialApplicationType));
  const [timelineItems, setTimelineItems] = useState(() =>
    buildDefaultTimeline(initialApplicationType),
  );
  const [theme, setTheme] = useState(
    () => getMonthlyReportApplicationConfig(initialApplicationType).theme,
  );
  const [textFormatting, setTextFormatting] = useState(() =>
    buildDefaultTextFormatting(
      getMonthlyReportApplicationConfig(initialApplicationType).theme.textColor,
    ),
  );
  const [communicationText, setCommunicationText] = useState("");
  const [screenshotRecognitionText, setScreenshotRecognitionText] = useState("");
  const [recognizedFields, setRecognizedFields] = useState<RecognizedField[]>([]);
  const [recognitionStatus, setRecognitionStatus] =
    useState("等待上传沟通记录或申请截图。");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [modules, setModules] = useState<ModuleVisibility>(defaultModules);
  const [reportModuleOrder, setReportModuleOrder] = useState<ReportModuleKey[]>(
    defaultReportModuleOrder,
  );
  const [highlightedModules, setHighlightedModules] = useState<
    Record<ReportModuleKey, boolean>
  >({
    stageFocus: false,
    summary: false,
    timeline: false,
    basicInfo: false,
    materialCollection: false,
    completedThisMonth: false,
    nextMonthPlan: false,
    clientTasks: false,
    attachments: false,
  });
  const [draggedModule, setDraggedModule] = useState<ReportModuleKey | null>(null);
  const [exportFormats, setExportFormats] = useState<Record<ExportFormat, boolean>>({
    PDF: true,
    PNG: false,
  });
  const [exportStatus, setExportStatus] = useState("");
  const [pendingApplicationType, setPendingApplicationType] =
    useState<MonthlyReportApplicationType | null>(null);
  const [, setIsDirty] = useState(false);

  const config = useMemo(
    () => getMonthlyReportApplicationConfig(applicationType),
    [applicationType],
  );

  const previewStyle = {
    backgroundColor: theme.cardColor,
    borderColor: theme.primaryColor,
    color: theme.textColor,
    fontFamily: theme.fontFamily,
  };

  function updateContent(field: keyof EditableReportContent, value: string) {
    setContent((current) => ({ ...current, [field]: value }));
    setIsDirty(true);
  }

  function updateTextFormatting(
    field: TextFormattingKey,
    formatting: TextFormatting,
  ) {
    setTextFormatting((current) => ({ ...current, [field]: formatting }));
    setIsDirty(true);
  }

  function getTextFormattingStyle(field: TextFormattingKey) {
    const formatting = textFormatting[field];
    return {
      color: formatting.color,
      fontWeight: formatting.bold ? 700 : 400,
      textDecoration: formatting.underline ? "underline" : "none",
      textUnderlineOffset: "2px",
    };
  }

  function getTextFormattingCss(field: TextFormattingKey) {
    const formatting = textFormatting[field];
    return `color:${formatting.color};font-weight:${formatting.bold ? 700 : 400};text-decoration:${formatting.underline ? "underline" : "none"};text-underline-offset:2px`;
  }

  function applyApplicationType(
    nextApplicationType: MonthlyReportApplicationType,
    resetContent: boolean,
  ) {
    const nextConfig = getMonthlyReportApplicationConfig(nextApplicationType);
    setApplicationType(nextApplicationType);
    setTheme(nextConfig.theme);
    setTimelineItems(buildDefaultTimeline(nextApplicationType));
    if (resetContent) {
      setContent(buildDefaultContent(nextApplicationType));
      setTextFormatting(buildDefaultTextFormatting(nextConfig.theme.textColor));
      setCommunicationText("");
      setScreenshotRecognitionText("");
      setRecognizedFields([]);
      setRecognitionStatus("等待上传沟通记录或申请截图。");
      setIsDirty(false);
    } else {
      setContent((current) => ({
        ...current,
        departmentLabel: departmentLabelByApplicationType[nextApplicationType],
      }));
    }
  }

  function handleApplicationTypeChange(value: string) {
    const nextApplicationType = value as MonthlyReportApplicationType;
    if (nextApplicationType === applicationType) return;
    setPendingApplicationType(nextApplicationType);
  }

  function usePendingApplicationTemplate() {
    if (!pendingApplicationType) return;
    applyApplicationType(pendingApplicationType, false);
    setPendingApplicationType(null);
  }

  function usePendingApplicationThemeOnly() {
    if (!pendingApplicationType) return;
    setTheme(getMonthlyReportApplicationConfig(pendingApplicationType).theme);
    setPendingApplicationType(null);
    setIsDirty(true);
  }

  function generateFeedback() {
    const extracted = extractFeedbackFromCommunication(communicationText, content);
    const parsedFields = parseAllRecognizedFields(
      [
        screenshotRecognitionText,
        content.recognizedApplicationStatus,
        content.studentBasicInfo,
        content.materialCollectionStatus,
        content.additionalRecognizedFields,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    const nextFields =
      recognizedFields.length > 0
        ? mergeRecognizedFields(recognizedFields, parsedFields)
        : parsedFields;
    const reportFields = nextFields.filter(isReportRecognizedField);
    const recognized = buildContentFromRecognizedFields(reportFields);
    setRecognizedFields(reportFields);
    setContent((current) => ({
      ...current,
      ...extracted,
      studentName: recognized.studentName || current.studentName,
      recognizedApplicationStatus:
        recognized.recognizedApplicationStatus || current.recognizedApplicationStatus,
      studentBasicInfo: recognized.studentBasicInfo || current.studentBasicInfo,
      materialCollectionStatus:
        recognized.materialCollectionStatus || current.materialCollectionStatus,
      additionalRecognizedFields: "",
      completedThisMonth:
        recognized.applicationProgress || extracted.completedThisMonth,
    }));
    const recognizedSections = [
      recognized.studentBasicInfo ? "基础信息" : "",
      recognized.materialCollectionStatus ? "材料收集" : "",
      extracted.completedThisMonth !== content.completedThisMonth ? "沟通反馈" : "",
    ].filter(Boolean);
    setRecognitionStatus(
      recognizedSections.length > 0
        ? `已生成：${recognizedSections.join("、")}。`
        : "未识别到可自动填充的结构化字段，请检查截图清晰度，或在下方识别结果中手动补充。",
    );
    setIsDirty(true);
  }

  function updateTimelineItem(
    id: string,
    field: "label" | "status" | "note",
    value: string,
  ) {
    setTimelineItems((current) =>
      current.map((item, index) => {
        if (item.id !== id) return item;
        if (field === "status") {
          return { ...item, status: value as TimelineStatus };
        }
        return { ...item, [field]: value };
      }),
    );
    setIsDirty(true);
  }

  function setCurrentTimelineStage(currentIndex: number) {
    setTimelineItems((current) =>
      current.map((item, index) => ({
        ...item,
        status:
          index < currentIndex
            ? "completed"
            : index === currentIndex
              ? "current"
              : "pending",
      })),
    );
    setIsDirty(true);
  }

  function updateThemeColor(
    key: keyof Omit<MonthlyReportTheme, "themeName" | "fontFamily">,
    value: string,
  ) {
    setTheme((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
  }

  function addTimelineItem() {
    setTimelineItems((current) => [
      ...current,
      {
        id: `custom-${Date.now()}-${current.length}`,
        label: "新增时间点",
        status: "pending",
        note: "",
      },
    ]);
    setIsDirty(true);
  }

  function removeTimelineItem(id: string) {
    setTimelineItems((current) =>
      current.length > 1 ? current.filter((item) => item.id !== id) : current,
    );
    setIsDirty(true);
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const nextAttachments = current.filter((attachment) => attachment.id !== id);
      if (nextAttachments.length === 0) {
        setModules((currentModules) => ({ ...currentModules, attachments: false }));
      }
      return nextAttachments;
    });
    setIsDirty(true);
  }

  function applyRecognizedFields(nextFields: RecognizedField[]) {
    const reportFields = nextFields.filter(isReportRecognizedField);
    const recognized = buildContentFromRecognizedFields(reportFields);
    setRecognizedFields(reportFields);
    setContent((current) => ({
      ...current,
      studentName: recognized.studentName || current.studentName,
      completedThisMonth: recognized.applicationProgress || current.completedThisMonth,
      recognizedApplicationStatus: recognized.recognizedApplicationStatus,
      studentBasicInfo: recognized.studentBasicInfo,
      materialCollectionStatus: recognized.materialCollectionStatus,
      additionalRecognizedFields: "",
    }));
    setIsDirty(true);
  }

  function toggleRecognizedField(id: string) {
    const nextFields = recognizedFields.map((field) =>
      field.id === id ? { ...field, selected: !field.selected } : field,
    );
    applyRecognizedFields(nextFields);
  }

  function handleAttachmentUpload(files: FileList | null) {
    const nextAttachments = filesToAttachments(files);
    setAttachments(nextAttachments);
    setModules((current) => ({ ...current, attachments: nextAttachments.length > 0 }));
    setIsDirty(true);
  }

  async function handleCommunicationFileUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setRecognitionStatus(`正在读取沟通记录：${file.name}...`);

    if (typeof file.text === "function") {
      const text = await file.text();
      setCommunicationText(text || `已上传沟通记录：${file.name}`);
      setRecognitionStatus(`已上传沟通记录：${file.name}，可点击“识别并生成反馈”。`);
      setIsDirty(true);
      return;
    }

    if (typeof FileReader === "undefined") {
      setCommunicationText(`已上传沟通记录：${file.name}`);
      setRecognitionStatus(`已上传沟通记录：${file.name}，可点击“识别并生成反馈”。`);
      setIsDirty(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCommunicationText(String(reader.result ?? ""));
      setRecognitionStatus(`已上传沟通记录：${file.name}，可点击“识别并生成反馈”。`);
      setIsDirty(true);
    };
    reader.readAsText(file);
  }

  async function handleApplicationScreenshotUpload(files: FileList | null) {
    const uploadedFiles = Array.from(files ?? []);
    if (uploadedFiles.length === 0) return;
    setRecognitionStatus(
      `正在识别申请截图：${uploadedFiles.map((file) => file.name).join("、")}...`,
    );
    const recognizedTexts: string[] = [];
    const parsedFields: RecognizedField[] = [];

    for (const file of uploadedFiles) {
      let rawText = await recognizeImageText(file);
      if (shouldReadUploadedFileAsText(file)) {
        try {
          rawText = [rawText, await file.text()].filter(Boolean).join("\n");
        } catch {
          rawText = rawText || "";
        }
      }
      if (rawText) recognizedTexts.push(rawText);
      const allFields = parseAllRecognizedFields(rawText);
      if (allFields.length > 0) {
        parsedFields.push(...allFields);
        continue;
      }
      const parsedStatus = rawText
        ? parseApplicationScreenshotContent(rawText, file.name)
        : {
            recognizedApplicationStatus: "",
            studentBasicInfo: "",
            materialCollectionStatus: "",
          };
      if (parsedStatus.recognizedApplicationStatus) {
        parsedFields.push(...parseAllRecognizedFields(parsedStatus.recognizedApplicationStatus));
      }
    }

    if (parsedFields.length === 0) {
      setRecognitionStatus(
        `已上传申请截图：${uploadedFiles.map((file) => file.name).join("、")}。未识别到“字段：内容”形式的信息，请检查截图清晰度，或手动补充识别结果。`,
      );
      setScreenshotRecognitionText(recognizedTexts.join("\n"));
      setIsDirty(true);
      return;
    }

    const nextFields = mergeRecognizedFields(recognizedFields, parsedFields);
    applyRecognizedFields(nextFields);
    setScreenshotRecognitionText(recognizedTexts.join("\n"));
    setRecognitionStatus(
      `已识别申请截图：${uploadedFiles.map((file) => file.name).join("、")}。已提取 ${parsedFields.length} 个字段，可在“识别字段筛选”中选择是否展示。`,
    );
    setIsDirty(true);
  }

  async function handleSpreadsheetUpload(files: FileList | null) {
    const uploadedFiles = Array.from(files ?? []);
    if (uploadedFiles.length === 0) return;
    setRecognitionStatus(
      `正在读取 Excel 表格：${uploadedFiles.map((file) => file.name).join("、")}...`,
    );
    const parsedFields: RecognizedField[] = [];

    for (const file of uploadedFiles) {
      if (!isSpreadsheetFile(file)) continue;
      try {
        parsedFields.push(...(await parseSpreadsheetFile(file, content.studentName)));
      } catch {
        setRecognitionStatus(
          `读取 Excel 表格失败：${file.name}。请确认文件为 xlsx、xls 或 csv。`,
        );
        setIsDirty(true);
        return;
      }
    }

    if (parsedFields.length === 0) {
      setRecognitionStatus(
        `已上传 Excel 表格：${uploadedFiles.map((file) => file.name).join("、")}。未读取到可填充字段，请检查表头或字段列。`,
      );
      setIsDirty(true);
      return;
    }

    const nextFields = mergeRecognizedFields(recognizedFields, parsedFields);
    applyRecognizedFields(nextFields);
    const recognized = buildContentFromRecognizedFields(
      nextFields.filter(isReportRecognizedField),
    );
    setContent((current) => ({
      ...current,
      completedThisMonth: recognized.applicationProgress || current.completedThisMonth,
    }));
    setRecognitionStatus(
      `已读取 Excel 表格：${uploadedFiles.map((file) => file.name).join("、")}。已提取 ${parsedFields.length} 个字段，可在“识别字段筛选”中选择是否展示。`,
    );
    setIsDirty(true);
  }

  async function handlePreviousReportUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setRecognitionStatus(`正在读取此前报告：${file.name}...`);

    let rawText = "";
    const ocrText = await recognizeImageText(file);
    if (shouldReadUploadedFileAsText(file) || file.type === "application/pdf") {
      try {
        rawText = [ocrText, await file.text()].filter(Boolean).join("\n");
      } catch {
        rawText = ocrText;
      }
    } else {
      rawText = ocrText;
    }

    if (!rawText.trim()) {
      setRecognitionStatus(
        `已上传此前报告：${file.name}。未读取到文本内容，请上传 txt、md、html 或清晰的报告截图。`,
      );
      setIsDirty(true);
      return;
    }

    const previousContent = {
      studentBasicInfo:
        extractReportSection(rawText, "基础信息") ||
        extractReportSection(rawText, "学生基础信息"),
      materialCollectionStatus:
        extractReportSection(rawText, "材料收集") ||
        extractReportSection(rawText, "材料收集情况"),
      additionalRecognizedFields: "",
      recognizedApplicationStatus:
        extractReportSection(rawText, "申请截图识别") ||
        extractReportSection(rawText, "截图识别结果"),
      completedThisMonth:
        extractReportSection(rawText, "阶段性反馈") ||
        extractReportSection(rawText, "本次阶段性进度") ||
        extractReportSection(rawText, "本月完成情况"),
      nextMonthPlan:
        extractReportSection(rawText, "下一阶段计划") ||
        extractReportSection(rawText, "下月计划"),
      nextStageFocus:
        extractReportSection(rawText, "下一阶段重点") ||
        extractReportSection(rawText, "当前阶段重点和下一步建议"),
      clientTasks:
        extractReportSection(rawText, "学生/家庭待办") ||
        extractReportSection(rawText, "需要学生/家庭配合"),
    };
    const fieldsFromReport = parseAllRecognizedFields(
      [
        previousContent.studentBasicInfo,
        previousContent.materialCollectionStatus,
        previousContent.additionalRecognizedFields,
        previousContent.recognizedApplicationStatus,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    const nextFields = mergeRecognizedFields(recognizedFields, fieldsFromReport);
    const reportFields = nextFields.filter(isReportRecognizedField);
    const recognized = buildContentFromRecognizedFields(reportFields);

    setRecognizedFields(reportFields);
    setContent((current) => ({
      ...current,
      completedThisMonth:
        previousContent.completedThisMonth || current.completedThisMonth,
      nextMonthPlan: previousContent.nextMonthPlan || current.nextMonthPlan,
      nextStageFocus: previousContent.nextStageFocus || current.nextStageFocus,
      clientTasks: previousContent.clientTasks || current.clientTasks,
      recognizedApplicationStatus:
        recognized.recognizedApplicationStatus ||
        previousContent.recognizedApplicationStatus ||
        current.recognizedApplicationStatus,
      studentName: recognized.studentName || current.studentName,
      studentBasicInfo:
        recognized.studentBasicInfo ||
        previousContent.studentBasicInfo ||
        current.studentBasicInfo,
      materialCollectionStatus:
        recognized.materialCollectionStatus ||
        previousContent.materialCollectionStatus ||
        current.materialCollectionStatus,
      additionalRecognizedFields:
        "",
    }));
    setRecognitionStatus(
      `已读取此前报告：${file.name}。已回填可识别内容，并提取 ${fieldsFromReport.length} 个可筛选字段。`,
    );
    setIsDirty(true);
  }

  function toggleModule(key: keyof ModuleVisibility) {
    setModules((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleHighlightModule(key: ReportModuleKey) {
    setHighlightedModules((current) => ({ ...current, [key]: !current[key] }));
    setIsDirty(true);
  }

  function moveReportModule(key: ReportModuleKey, direction: -1 | 1) {
    setReportModuleOrder((current) => {
      const index = current.indexOf(key);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
    setIsDirty(true);
  }

  function moveReportModuleTo(source: ReportModuleKey, target: ReportModuleKey) {
    if (source === target) return;
    setReportModuleOrder((current) => {
      const sourceIndex = current.indexOf(source);
      const targetIndex = current.indexOf(target);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [item] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
    setIsDirty(true);
  }

  function getTimelineColor(status: TimelineStatus) {
    if (status === "completed") return theme.timelineCompletedColor;
    if (status === "current") return theme.timelineCurrentColor;
    return theme.timelinePendingColor;
  }

  const attachmentNames = attachments.map((attachment) => attachment.name).join("、");
  const exportBaseName = [
    content.studentName,
    applicationType,
    content.season,
    "反馈报告",
    exportDate,
  ]
    .map(sanitizeFileNameSegment)
    .filter(Boolean)
    .join("_");
  const selectedFormats = (Object.keys(exportFormats) as ExportFormat[]).filter(
    (format) => exportFormats[format],
  );
  const exportFileNames = selectedFormats.map(
    (format) => `${exportBaseName}.${format.toLowerCase()}`,
  );
  const studentInfoRows = parseKeyValueRows(content.studentBasicInfo);
  const materialRows = parseMaterialRows(content.materialCollectionStatus);
  const metricSummary = buildMetricSummary(studentInfoRows, materialRows);
  const currentTimelineItem = getCurrentTimelineItem(timelineItems);
  const nextActionItems = buildActionItems(content.nextMonthPlan);
  const advisorFeedback = summarizeAdvisorFeedback(content.completedThisMonth);
  const reportTitle =
    content.title.trim() || `${content.studentName}申请季阶段性反馈报告`;
  const timelineProgress = timelineItems.length
    ? Math.round(
        ((timelineItems.filter((item) => item.status === "completed").length +
          (currentTimelineItem ? 1 : 0)) /
          timelineItems.length) *
          100,
      )
    : 0;

  function toggleExportFormat(format: ExportFormat) {
    setExportFormats((current) => {
      const next = { ...current, [format]: !current[format] };
      if (!next.PDF && !next.PNG) return current;
      return next;
    });
  }

  function buildReportHtml() {
    const timelineHtml = timelineItems
      .map(
        (item) =>
          `<li class="timeline-item ${item.status}">
            ${item.note.trim() ? `<span class="timeline-note">${escapeHtml(item.note)}</span>` : ""}
            <span class="timeline-dot"></span>
            <span class="timeline-label">${escapeHtml(item.label)}</span>
            <span class="timeline-status">${escapeHtml(timelineStatusOptions.find((option) => option.value === item.status)?.label ?? "")}</span>
          </li>`,
      )
      .join("");
    const infoRowsHtml =
      studentInfoRows.length > 0
        ? studentInfoRows
            .map(
              (row) =>
                `<tr><th>${escapeHtml(row.label)}</th><td style="${getTextFormattingCss("studentBasicInfo")}">${escapeHtml(row.value)}</td></tr>`,
            )
            .join("")
        : `<tr><th>基础信息</th><td>${emptySectionPlaceholder}</td></tr>`;
    const materialRowsHtml =
      materialRows.length > 0
        ? materialRows
            .map((row) => {
              const style = statusStyles[row.status];
              return `<tr style="${getTextFormattingCss("materialCollectionStatus")}">
                <td>${escapeHtml(row.item)}</td>
                <td><span class="status-pill" style="background:${style.bg};color:${style.color}">${escapeHtml(row.statusLabel)}</span></td>
                <td>${escapeHtml(row.remark)}</td>
              </tr>`;
            })
            .join("")
        : `<tr><td>材料收集</td><td><span class="status-pill">${emptySectionPlaceholder}</span></td><td>${emptySectionPlaceholder}</td></tr>`;
    const nextActionsHtml = nextActionItems
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    const attachmentHtml = escapeHtml(attachmentNames);
    const sectionClass = (key: ReportModuleKey) =>
      highlightedModules[key] ? "section-card highlighted" : "section-card";
    const renderReportModule = (key: ReportModuleKey) => {
      if (!modules[key]) return "";
      if (key === "stageFocus") {
        return `<section class="${sectionClass(key)}"><h2 class="section-title">当前阶段重点和下一步建议</h2><div class="focus-grid"><div><h3>当前阶段重点</h3><p>${escapeHtml(currentTimelineItem?.label ?? emptySectionPlaceholder)}</p></div><div><h3>下一步建议</h3><p>${escapeHtml(content.nextStageFocus)}</p></div></div></section>`;
      }
      if (key === "summary") {
        return `<section class="${sectionClass(key)}" aria-label="关键摘要"><h2 class="section-title">关键摘要</h2><div class="metrics"><div class="metric">材料收集完整度<strong>${escapeHtml(metricSummary.materialText)}</strong><div class="progress"><span style="width:${metricSummary.materialPercent}%"></span></div></div><div class="metric">核心学术信息<strong>${escapeHtml(metricSummary.academicText)}</strong></div><div class="metric">当前就读学校<strong>${escapeHtml(metricSummary.school)}</strong></div></div></section>`;
      }
      if (key === "timeline") {
        return `<section class="${sectionClass(key)}"><h2 class="section-title">${escapeHtml(config.moduleTitles.timeline)}</h2><ol class="timeline">${timelineHtml}</ol></section>`;
      }
      if (key === "basicInfo") {
        return `<section class="${sectionClass(key)}" data-layout="${modules.materialCollection ? "half" : "full"}"><h2 class="section-title">基础信息</h2><table>${infoRowsHtml}</table></section>`;
      }
      if (key === "materialCollection") {
        return `<section class="${sectionClass(key)}" data-layout="${modules.basicInfo ? "half" : "full"}"><h2 class="section-title">材料收集</h2><table><thead><tr><th>材料项目</th><th>状态</th><th>备注</th></tr></thead><tbody>${materialRowsHtml}</tbody></table></section>`;
      }
      if (key === "completedThisMonth") {
        return `<section class="${sectionClass(key)}"><h2 class="section-title">阶段性反馈</h2><p style="${getTextFormattingCss("completedThisMonth")}">${escapeHtml(content.completedThisMonth)}</p></section>`;
      }
      if (key === "nextMonthPlan") {
        return `<section class="${sectionClass(key)}"><h2 class="section-title">下一阶段计划</h2><ul style="${getTextFormattingCss("nextMonthPlan")}">${nextActionsHtml}</ul></section>`;
      }
      if (key === "clientTasks") {
        return `<section class="${sectionClass(key)}"><h2 class="section-title">需要学生/家庭配合</h2><p style="${getTextFormattingCss("clientTasks")}">${escapeHtml(content.clientTasks)}</p></section>`;
      }
      if (key === "attachments" && attachmentNames) {
        return `<section class="${sectionClass(key)} attachments"><h2 class="section-title">附件</h2><p>${attachmentHtml}</p></section>`;
      }
      return "";
    };
    const shouldPairInformationSections = modules.basicInfo && modules.materialCollection;
    let renderedInformationPair = false;
    const renderedReportModules = reportModuleOrder
      .map((key) => {
        if (
          shouldPairInformationSections &&
          (key === "basicInfo" || key === "materialCollection")
        ) {
          if (renderedInformationPair) return "";
          renderedInformationPair = true;
          return `<div class="paired-sections">${renderReportModule("basicInfo")}${renderReportModule("materialCollection")}</div>`;
        }
        return renderReportModule(key);
      })
      .join("");

    return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(reportTitle)}</title>
<style>
@page{size:A4;margin:0}
body{font-family:Arial,"PingFang SC","Microsoft YaHei",sans-serif;margin:0;color:${theme.textColor};background:${theme.backgroundColor}}
.report{width:210mm;min-height:297mm;margin:auto;background:${theme.cardColor};padding:12mm;box-sizing:border-box;border-top:2px solid ${theme.primaryColor}}
.header{display:flex;align-items:center;justify-content:space-between;gap:18px}
.brand{display:flex;align-items:center;gap:12px;color:${theme.mutedTextColor};font-size:12px}
.logo{width:112px;height:auto}
.badge{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;background:${theme.primarySoftColor};color:${theme.primaryColor};font-size:12px;font-weight:700}
.badge.accent{background:${theme.secondarySoftColor};color:${theme.accentColor}}
.hero{margin-top:14px;border-radius:18px;padding:20px;background:${theme.gradient};color:white}
.eyebrow{font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.82}
h1{margin:8px 0 10px;font-size:28px;line-height:1.2}
.meta{display:flex;flex-wrap:wrap;gap:8px;font-size:12px;opacity:.9}
.section-card{margin-top:12px;border:1px solid #e2e8f0;border-radius:16px;background:white;padding:14px;box-shadow:0 2px 8px rgba(15,23,42,.04)}
.section-card.highlighted{background:${theme.secondarySoftColor};border-color:${theme.accentColor};box-shadow:0 12px 28px rgba(15,23,42,.10)}
.paired-sections{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:stretch;gap:12px;margin-top:12px}
.paired-sections .section-card{height:100%;margin-top:0;box-sizing:border-box}
.focus-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.focus-grid h3{margin:0 0 6px;color:${theme.titleColor};font-size:13px}
.focus-grid p,.section-card p{margin:0;font-size:12px;line-height:1.8;white-space:pre-line}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.metric{border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:${theme.primarySoftColor}}
.metric strong{display:block;margin-top:6px;color:${theme.titleColor};font-size:16px}
.progress{height:7px;margin-top:9px;overflow:hidden;border-radius:999px;background:#e2e8f0}
.progress span{display:block;height:100%;background:${theme.primaryColor}}
.section-title{margin:0 0 10px;color:${theme.titleColor};font-size:15px}
.timeline{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;list-style:none;margin:0;padding:0}
.timeline-item{position:relative;border:1px solid #e2e8f0;border-radius:10px;padding:9px 8px;background:#f8fafc;font-size:10px;line-height:1.35}
.timeline-note{display:inline-block;margin-bottom:6px;border-radius:999px;background:${theme.secondarySoftColor};color:${theme.accentColor};padding:4px 7px;font-weight:700}
.timeline-dot{display:block;width:9px;height:9px;border-radius:999px;margin-bottom:6px;background:${theme.timelinePendingColor}}
.timeline-item.completed .timeline-dot{background:${theme.timelineCompletedColor}}
.timeline-item.current{border-color:${theme.primaryColor};background:${theme.primarySoftColor}}
.timeline-item.current .timeline-dot{background:${theme.timelineCurrentColor}}
.timeline-status{display:block;margin-top:5px;color:${theme.mutedTextColor}}
table{width:100%;border-collapse:collapse;font-size:11px}
th,td{border-bottom:1px solid #e2e8f0;padding:8px 6px;text-align:left;vertical-align:top;line-height:1.55}
th{width:36%;color:${theme.mutedTextColor};font-weight:600}
.status-pill{display:inline-flex;border-radius:999px;padding:4px 8px;background:#f1f5f9;color:#64748b;font-size:10px;font-weight:700;white-space:nowrap}
.section-card ul{margin:0;padding-left:18px;font-size:12px;line-height:1.8}
</style>
</head>
<body>
<main class="report">
<header class="header">
<div class="brand"><img class="logo" src="${companyLogoSrc}" alt="新东方" /><span>${escapeHtml(content.departmentLabel)}</span></div>
<div><span class="badge accent">${escapeHtml(content.season)}</span> <span class="badge">${escapeHtml(applicationType)}</span></div>
</header>
<section class="hero">
<div>
<div class="eyebrow">Application Progress Report</div>
<h1>${escapeHtml(reportTitle)}</h1>
<div class="meta">
${modules.studentName ? `<span>学生姓名：${escapeHtml(content.studentName)}</span>` : ""}
${modules.season ? `<span>申请季度：${escapeHtml(content.season)}</span>` : ""}
${modules.applicationType ? `<span>申请类型：${escapeHtml(applicationType)}</span>` : ""}
<span>报告日期：${exportDate}</span>
</div>
</div>
</section>
${renderedReportModules}
</main>
</body>
</html>`;
  }

  async function renderReportPngBlob() {
    if (
      typeof navigator !== "undefined" &&
      navigator.userAgent.toLowerCase().includes("jsdom")
    ) {
      return new Blob([buildReportHtml()], { type: "text/html;charset=utf-8" });
    }

    const canvasWidth = 1240;
    const heroY = 198;
    const heroHeight = 238;
    const cardGap = 24;
    const initialContentY = heroY + heroHeight + 42;
    const shouldPairInformationSections = modules.basicInfo && modules.materialCollection;
    const estimateWrappedLines = (text: string, charactersPerLine: number) =>
      splitReportLines(text).reduce(
        (total, line) => total + Math.max(1, Math.ceil(line.length / charactersPerLine)),
        0,
      ) || 1;
    const estimateCardHeight = (key: ReportModuleKey) => {
      if (!modules[key]) return 0;
      if (key === "attachments" && !attachmentNames) return 0;
      if (key === "stageFocus") {
        return Math.max(150, 90 + estimateWrappedLines(content.nextStageFocus, 38) * 23);
      }
      if (key === "summary") return 150;
      if (key === "timeline") {
        return 62 + Math.max(1, Math.ceil(timelineItems.length / 5)) * 88;
      }
      if (key === "basicInfo") {
        const rows = studentInfoRows.length || 1;
        return 62 + rows * 30;
      }
      if (key === "materialCollection") {
        const rows = materialRows.length || 1;
        return 92 + rows * 28;
      }
      if (key === "completedThisMonth") {
        return Math.max(136, 72 + estimateWrappedLines(advisorFeedback, 62) * 25);
      }
      if (key === "nextMonthPlan") {
        return Math.max(
          136,
          72 + estimateWrappedLines(nextActionItems.map((item) => `• ${item}`).join("\n"), 62) * 25,
        );
      }
      if (key === "clientTasks") {
        return Math.max(122, 72 + estimateWrappedLines(content.clientTasks, 62) * 25);
      }
      return Math.max(96, 72 + estimateWrappedLines(attachmentNames, 62) * 25);
    };
    let estimatedInformationPair = false;
    const estimatedContentEnd =
      initialContentY +
      reportModuleOrder.reduce((total, key) => {
        if (
          shouldPairInformationSections &&
          (key === "basicInfo" || key === "materialCollection")
        ) {
          if (estimatedInformationPair) return total;
          estimatedInformationPair = true;
          return (
            total +
            Math.max(
              estimateCardHeight("basicInfo"),
              estimateCardHeight("materialCollection"),
            ) +
            cardGap
          );
        }
        const height = estimateCardHeight(key);
        return total + (height > 0 ? height + cardGap : 0);
      }, 0);
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = Math.max(1754, Math.ceil(estimatedContentEnd + 90));
    const context = canvas.getContext("2d");
    if (!context) {
      return new Blob([buildReportHtml()], { type: "text/html;charset=utf-8" });
    }
    const canvasContext = context;

    const pageX = 70;
    const pageY = 70;
    const pageWidth = canvas.width - 140;
    const contentX = 110;
    const contentWidth = canvas.width - 220;

    function roundedRect(
      x: number,
      rectY: number,
      width: number,
      height: number,
      radius: number,
    ) {
      canvasContext.beginPath();
      canvasContext.moveTo(x + radius, rectY);
      canvasContext.lineTo(x + width - radius, rectY);
      canvasContext.quadraticCurveTo(x + width, rectY, x + width, rectY + radius);
      canvasContext.lineTo(x + width, rectY + height - radius);
      canvasContext.quadraticCurveTo(
        x + width,
        rectY + height,
        x + width - radius,
        rectY + height,
      );
      canvasContext.lineTo(x + radius, rectY + height);
      canvasContext.quadraticCurveTo(x, rectY + height, x, rectY + height - radius);
      canvasContext.lineTo(x, rectY + radius);
      canvasContext.quadraticCurveTo(x, rectY, x + radius, rectY);
      canvasContext.closePath();
    }

    function drawRoundedBox(
      x: number,
      rectY: number,
      width: number,
      height: number,
      fill: string,
      stroke: string,
      radius = 18,
    ) {
      roundedRect(x, rectY, width, height, radius);
      canvasContext.fillStyle = fill;
      canvasContext.fill();
      canvasContext.strokeStyle = stroke;
      canvasContext.lineWidth = 1;
      canvasContext.stroke();
    }

    function applyCanvasTextFormatting(field: TextFormattingKey, size: number) {
      const formatting = textFormatting[field];
      canvasContext.fillStyle = formatting.color;
      canvasContext.font = `${formatting.bold ? "bold " : ""}${size}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      return formatting.underline;
    }

    context.fillStyle = theme.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = theme.cardColor;
    context.fillRect(pageX, pageY, pageWidth, canvas.height - 140);

    await new Promise<void>((resolve) => {
      const logo = new Image();
      logo.onload = () => {
        context.drawImage(logo, contentX, 102, 170, 68);
        resolve();
      };
      logo.onerror = () => resolve();
      logo.src = companyLogoSrc;
    });

    context.fillStyle = theme.textColor;
    context.font = '20px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(content.departmentLabel, 300, 142);

    context.font = 'bold 16px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    const applicationBadgeWidth = Math.max(
      118,
      context.measureText(applicationType).width + 34,
    );
    const seasonBadgeWidth = Math.max(88, context.measureText(content.season).width + 34);
    const applicationBadgeX = contentX + contentWidth - applicationBadgeWidth;
    const seasonBadgeX = applicationBadgeX - seasonBadgeWidth - 12;
    drawRoundedBox(
      seasonBadgeX,
      112,
      seasonBadgeWidth,
      42,
      theme.secondarySoftColor,
      theme.secondarySoftColor,
      21,
    );
    context.fillStyle = theme.accentColor;
    context.textAlign = "center";
    context.fillText(content.season, seasonBadgeX + seasonBadgeWidth / 2, 139);
    drawRoundedBox(
      applicationBadgeX,
      112,
      applicationBadgeWidth,
      42,
      theme.primarySoftColor,
      theme.primarySoftColor,
      21,
    );
    context.fillStyle = theme.primaryColor;
    context.fillText(
      applicationType,
      applicationBadgeX + applicationBadgeWidth / 2,
      139,
    );
    context.textAlign = "left";

    const heroGradient = context.createLinearGradient(
      contentX,
      heroY,
      contentX + contentWidth,
      heroY + heroHeight,
    );
    heroGradient.addColorStop(0, theme.primaryDarkColor);
    heroGradient.addColorStop(0.68, theme.primaryColor);
    heroGradient.addColorStop(1, theme.accentColor);
    context.save();
    roundedRect(contentX, heroY, contentWidth, heroHeight, 28);
    context.clip();
    context.fillStyle = heroGradient;
    context.fillRect(contentX, heroY, contentWidth, heroHeight);
    context.restore();

    context.fillStyle = "rgba(255,255,255,0.82)";
    context.font = 'bold 18px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText("Application Progress Report", contentX + 32, heroY + 46);
    context.fillStyle = "#ffffff";
    context.font = 'bold 42px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(reportTitle, contentX + 32, heroY + 102);
    context.font = '22px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    const metaText = [
      modules.studentName ? `学生姓名：${content.studentName}` : "",
      modules.season ? `申请季度：${content.season}` : "",
      modules.applicationType ? `申请类型：${applicationType}` : "",
      `报告日期：${exportDate}`,
    ]
      .filter(Boolean)
      .join("   ");
    context.fillText(metaText, contentX + 32, heroY + 148);

    let y = initialContentY;
    function drawReportCard(
      key: ReportModuleKey,
      height: number,
      drawContent: (cardY: number) => void,
    ) {
      if (!modules[key]) return;
      if (key === "attachments" && !attachmentNames) return;
      drawRoundedBox(
        contentX,
        y,
        contentWidth,
        height,
        highlightedModules[key] ? theme.secondarySoftColor : "#ffffff",
        highlightedModules[key] ? theme.accentColor : "#e2e8f0",
      );
      drawContent(y);
      y += height + 24;
    }

    const basicInfoRows =
      studentInfoRows.length > 0
        ? studentInfoRows
        : [{ label: "基础信息", value: emptySectionPlaceholder }];
    const collectionRows =
      materialRows.length > 0
        ? materialRows
        : [
            {
              item: "材料收集",
              status: "na" as MaterialStatusKey,
              statusLabel: emptySectionPlaceholder,
              remark: emptySectionPlaceholder,
            },
          ];

    function drawBasicInfoContent(cardY: number, cardX: number, cardWidth: number) {
      const compact = cardWidth < 700;
      const labelWidth = compact ? 126 : 172;
      canvasContext.fillStyle = theme.titleColor;
      canvasContext.font = `bold ${compact ? 21 : 23}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      canvasContext.fillText("基础信息", cardX + 18, cardY + 36);
      basicInfoRows.forEach((row, index) => {
        const rowY = cardY + 76 + index * 30;
        canvasContext.fillStyle = theme.mutedTextColor;
        canvasContext.font = `${compact ? 15 : 17}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
        drawWrappedText(
          canvasContext,
          row.label,
          cardX + 18,
          rowY,
          labelWidth - 18,
          20,
        );
        const underline = applyCanvasTextFormatting(
          "studentBasicInfo",
          compact ? 15 : 17,
        );
        drawWrappedText(
          canvasContext,
          row.value,
          cardX + labelWidth,
          rowY,
          cardWidth - labelWidth - 18,
          20,
          underline,
        );
      });
    }

    function drawMaterialCollectionContent(
      cardY: number,
      cardX: number,
      cardWidth: number,
    ) {
      const compact = cardWidth < 700;
      const innerWidth = cardWidth - 36;
      const itemX = cardX + 18;
      const statusX = itemX + innerWidth * 0.43;
      const remarkX = itemX + innerWidth * 0.66;
      canvasContext.fillStyle = theme.titleColor;
      canvasContext.font = `bold ${compact ? 21 : 23}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      canvasContext.fillText("材料收集", cardX + 18, cardY + 36);
      canvasContext.fillStyle = theme.mutedTextColor;
      canvasContext.font = `bold ${compact ? 14 : 16}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      canvasContext.fillText("材料项目", itemX, cardY + 70);
      canvasContext.fillText("状态", statusX, cardY + 70);
      canvasContext.fillText("备注", remarkX, cardY + 70);
      collectionRows.forEach((row, index) => {
        const rowY = cardY + 102 + index * 28;
        const underline = applyCanvasTextFormatting(
          "materialCollectionStatus",
          compact ? 14 : 16,
        );
        drawWrappedText(
          canvasContext,
          row.item,
          itemX,
          rowY,
          statusX - itemX - 10,
          19,
          underline,
        );
        canvasContext.fillStyle = statusStyles[row.status].color;
        canvasContext.font = `bold ${compact ? 13 : 15}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
        canvasContext.fillText(row.statusLabel, statusX, rowY);
        const remarkUnderline = applyCanvasTextFormatting(
          "materialCollectionStatus",
          compact ? 13 : 15,
        );
        drawWrappedText(
          canvasContext,
          row.remark,
          remarkX,
          rowY,
          cardX + cardWidth - remarkX - 18,
          19,
          remarkUnderline,
        );
      });
    }

    let renderedCanvasInformationPair = false;
    reportModuleOrder.forEach((key) => {
      if (
        shouldPairInformationSections &&
        (key === "basicInfo" || key === "materialCollection")
      ) {
        if (renderedCanvasInformationPair) return;
        renderedCanvasInformationPair = true;
        const pairGap = 20;
        const pairWidth = (contentWidth - pairGap) / 2;
        const pairHeight = Math.max(
          estimateCardHeight("basicInfo"),
          estimateCardHeight("materialCollection"),
        );
        drawRoundedBox(
          contentX,
          y,
          pairWidth,
          pairHeight,
          highlightedModules.basicInfo ? theme.secondarySoftColor : "#ffffff",
          highlightedModules.basicInfo ? theme.accentColor : "#e2e8f0",
        );
        const materialCardX = contentX + pairWidth + pairGap;
        drawRoundedBox(
          materialCardX,
          y,
          pairWidth,
          pairHeight,
          highlightedModules.materialCollection
            ? theme.secondarySoftColor
            : "#ffffff",
          highlightedModules.materialCollection ? theme.accentColor : "#e2e8f0",
        );
        drawBasicInfoContent(y, contentX, pairWidth);
        drawMaterialCollectionContent(y, materialCardX, pairWidth);
        y += pairHeight + cardGap;
        return;
      }

      if (key === "stageFocus") {
        drawReportCard(key, estimateCardHeight(key), (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = 'bold 24px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText("当前阶段重点和下一步建议", contentX + 18, cardY + 36);
          context.font = 'bold 18px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText("当前阶段重点", contentX + 18, cardY + 78);
          context.fillText("下一步建议", contentX + contentWidth / 2 + 12, cardY + 78);
          context.fillStyle = theme.textColor;
          context.font = '17px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          drawWrappedText(
            context,
            currentTimelineItem?.label ?? emptySectionPlaceholder,
            contentX + 18,
            cardY + 106,
            contentWidth / 2 - 36,
            23,
          );
          drawWrappedText(
            context,
            content.nextStageFocus,
            contentX + contentWidth / 2 + 12,
            cardY + 106,
            contentWidth / 2 - 36,
            23,
          );
        });
      }

      if (key === "summary") {
        drawReportCard(key, estimateCardHeight(key), (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = 'bold 24px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText("关键摘要", contentX + 18, cardY + 36);
          const metricWidth = (contentWidth - 60) / 3;
          [
            ["材料收集完整度", metricSummary.materialText],
            ["核心学术信息", metricSummary.academicText],
            ["当前就读学校", metricSummary.school],
          ].forEach(([label, value], index) => {
            const x = contentX + 18 + index * (metricWidth + 12);
            const metricY = cardY + 58;
            drawRoundedBox(
              x,
              metricY,
              metricWidth,
              74,
              index === 0 ? theme.primarySoftColor : "#ffffff",
              "#e2e8f0",
              12,
            );
            context.fillStyle = theme.mutedTextColor;
            context.font = '16px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
            context.fillText(label, x + 14, metricY + 26);
            context.fillStyle = theme.titleColor;
            context.font = 'bold 21px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
            drawWrappedText(context, value, x + 14, metricY + 54, metricWidth - 28, 24);
          });
        });
      }

      if (key === "timeline") {
        const timelineColumns = 5;
        const timelineRows = Math.max(1, Math.ceil(timelineItems.length / timelineColumns));
        const timelineHeight = 62 + timelineRows * 88;
        drawReportCard(key, timelineHeight, (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = 'bold 24px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText(config.moduleTitles.timeline, contentX + 18, cardY + 36);
          const timelineBoxWidth = (contentWidth - 68) / timelineColumns;
          timelineItems.forEach((item, index) => {
            const x = contentX + 18 + (index % timelineColumns) * (timelineBoxWidth + 8);
            const itemY = cardY + 56 + Math.floor(index / timelineColumns) * 88;
            drawRoundedBox(
              x,
              itemY,
              timelineBoxWidth,
              70,
              item.status === "current" ? theme.primarySoftColor : "#f8fafc",
              item.status === "current" ? theme.primaryColor : "#e2e8f0",
              12,
            );
            if (item.note.trim()) {
              drawRoundedBox(
                x + 10,
                itemY + 8,
                timelineBoxWidth - 20,
                18,
                theme.secondarySoftColor,
                theme.secondarySoftColor,
                9,
              );
              context.fillStyle = theme.accentColor;
              context.font = 'bold 11px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
              drawWrappedText(context, item.note, x + 14, itemY + 21, timelineBoxWidth - 28, 14);
            }
            context.fillStyle = getTimelineColor(item.status);
            context.beginPath();
            context.arc(x + 18, itemY + (item.note.trim() ? 40 : 20), 6, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = theme.textColor;
            context.font = '16px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
            drawWrappedText(
              context,
              item.label,
              x + 34,
              itemY + (item.note.trim() ? 42 : 22),
              timelineBoxWidth - 44,
              20,
            );
          });
        });
      }

      if (key === "basicInfo") {
        drawReportCard(key, estimateCardHeight(key), (cardY) => {
          drawBasicInfoContent(cardY, contentX, contentWidth);
        });
      }

      if (key === "materialCollection") {
        drawReportCard(key, estimateCardHeight(key), (cardY) => {
          drawMaterialCollectionContent(cardY, contentX, contentWidth);
        });
      }

      if (key === "completedThisMonth") {
        drawReportCard(key, estimateCardHeight(key), (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = 'bold 21px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText("阶段性反馈", contentX + 18, cardY + 34);
          const underline = applyCanvasTextFormatting("completedThisMonth", 17);
          drawWrappedText(
            context,
            advisorFeedback,
            contentX + 18,
            cardY + 68,
            contentWidth - 36,
            25,
            underline,
          );
        });
      }

      if (key === "nextMonthPlan") {
        drawReportCard(key, estimateCardHeight(key), (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = 'bold 21px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText("下一阶段计划", contentX + 18, cardY + 34);
          const underline = applyCanvasTextFormatting("nextMonthPlan", 17);
          drawWrappedText(
            context,
            nextActionItems.map((item) => `• ${item}`).join("\n"),
            contentX + 18,
            cardY + 68,
            contentWidth - 36,
            25,
            underline,
          );
        });
      }

      if (key === "clientTasks") {
        drawReportCard(key, estimateCardHeight(key), (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = 'bold 21px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText("需要学生/家庭配合", contentX + 18, cardY + 34);
          const underline = applyCanvasTextFormatting("clientTasks", 17);
          drawWrappedText(
            context,
            content.clientTasks,
            contentX + 18,
            cardY + 68,
            contentWidth - 36,
            25,
            underline,
          );
        });
      }

      if (key === "attachments") {
        drawReportCard(key, estimateCardHeight(key), (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = 'bold 21px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText("附件", contentX + 18, cardY + 34);
          context.fillStyle = theme.textColor;
          context.font = '17px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          drawWrappedText(context, `本次报告附件：${attachmentNames}`, contentX + 18, cardY + 68, contentWidth - 36, 25);
        });
      }
    });

    return await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob ?? dataUrlToBlob(canvas.toDataURL("image/png"))),
        "image/png",
      );
    });
  }

  async function buildExportBlob(format: ExportFormat) {
    if (format === "PNG") {
      return renderReportPngBlob();
    }

    const pngBlob = await renderReportPngBlob();
    if (pngBlob.type !== "image/png") {
      return new Blob([buildReportHtml()], { type: "application/pdf" });
    }

    const { PDFDocument } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    const image = await pdf.embedPng(pngBytes);
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const scale = pageWidth / image.width;
    const width = image.width * scale;
    const height = image.height * scale;
    const pageCount = Math.max(1, Math.ceil(height / pageHeight));

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const page = pdf.addPage([pageWidth, pageHeight]);
      page.drawImage(image, {
        x: 0,
        y: pageHeight - height + pageIndex * pageHeight,
        width,
        height,
      });
    }
    const pdfBytes = await pdf.save();
    const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(pdfBuffer).set(pdfBytes);
    return new Blob([pdfBuffer], { type: "application/pdf" });
  }

  function downloadBlob(fileName: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function exportReport() {
    setExportStatus(`正在生成 ${selectedFormats.join("、")}...`);
    try {
      for (const format of selectedFormats) {
        const blob = await buildExportBlob(format);
        downloadBlob(`${exportBaseName}.${format.toLowerCase()}`, blob);
      }
      setExportStatus(
        `已开始下载 ${selectedFormats.join("、")}：${exportFileNames.join("；")}`,
      );
    } catch (error) {
      setExportStatus(
        error instanceof Error
          ? `导出失败：${error.message}`
          : "导出失败，请稍后重试。",
      );
    }
  }

  function getPreviewSectionStyle(key: ReportModuleKey) {
    return highlightedModules[key]
      ? {
          backgroundColor: theme.secondarySoftColor,
          borderColor: theme.accentColor,
        }
      : { backgroundColor: "#ffffff" };
  }

  function renderPreviewModule(key: ReportModuleKey, paired = false) {
    if (!modules[key]) return null;
    if (key === "attachments" && !attachmentNames) return null;

    const sectionShellClass = paired
      ? "h-full min-w-0 rounded-2xl border border-slate-200 p-3 text-xs leading-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
      : "mx-4 my-3 rounded-2xl border border-slate-200 p-3 text-xs leading-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]";
    const sectionHeaderClass = "text-sm font-semibold";
    const sectionProps = {
      "data-highlighted": highlightedModules[key] ? "true" : "false",
      "data-layout": paired ? "half" : "full",
      "data-testid": `report-section-${key}`,
      className: sectionShellClass,
      style: getPreviewSectionStyle(key),
    };

    if (key === "stageFocus") {
      return (
        <section key={key} {...sectionProps}>
          <div data-testid="report-section">
            <h3 className={sectionHeaderClass} style={{ color: theme.titleColor }}>
              当前阶段重点和下一步建议
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                <p className="font-semibold" style={{ color: theme.titleColor }}>
                  当前阶段重点
                </p>
                <p className="mt-1">
                  {currentTimelineItem?.label ?? emptySectionPlaceholder}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                <p className="font-semibold" style={{ color: theme.titleColor }}>
                  下一步建议
                </p>
                <p className="mt-1 whitespace-pre-line">{content.nextStageFocus}</p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (key === "summary") {
      return (
        <section key={key} {...sectionProps} aria-label="关键摘要">
          <div data-testid="report-section">
            <h3 className={sectionHeaderClass} style={{ color: theme.titleColor }}>
              关键摘要
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div
                className="rounded-lg border border-slate-200 p-3"
                style={{ backgroundColor: theme.primarySoftColor }}
              >
                <span style={{ color: theme.mutedTextColor }}>材料完整度</span>
                <strong className="mt-1 block text-base" style={{ color: theme.titleColor }}>
                  {metricSummary.materialText}
                </strong>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${metricSummary.materialPercent}%`,
                      backgroundColor: theme.primaryColor,
                    }}
                  />
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <span style={{ color: theme.mutedTextColor }}>核心学术信息</span>
                <strong className="mt-1 block text-sm" style={{ color: theme.titleColor }}>
                  {metricSummary.academicText}
                </strong>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <span style={{ color: theme.mutedTextColor }}>当前就读学校</span>
                <strong className="mt-1 block text-sm" style={{ color: theme.titleColor }}>
                  {metricSummary.school}
                </strong>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (key === "timeline") {
      return (
        <section key={key} {...sectionProps}>
          <div data-testid="report-section">
            <h3 className={sectionHeaderClass} style={{ color: theme.titleColor }}>
              {config.moduleTitles.timeline}
            </h3>
            <ol className="mt-3 grid grid-cols-2 gap-2">
              {timelineItems.map((item, index) => (
                <li
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2"
                  data-testid={`timeline-node-${index}`}
                  key={item.id}
                >
                  {item.note.trim() ? (
                    <span
                      className="mb-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold"
                      style={{
                        backgroundColor: theme.secondarySoftColor,
                        color: theme.accentColor,
                      }}
                    >
                      {item.note}
                    </span>
                  ) : null}
                  <span
                    data-testid={`timeline-dot-${index}`}
                    className="mb-1 block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getTimelineColor(item.status) }}
                  />
                  <span className="block font-medium">{item.label}</span>
                  <span className="mt-1 block text-slate-500">
                    {timelineStatusOptions.find((option) => option.value === item.status)?.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );
    }

    if (key === "basicInfo") {
      return (
        <section key={key} {...sectionProps}>
          <div data-testid="report-section">
            <h3 className={sectionHeaderClass} style={{ color: theme.titleColor }}>
              基础信息
            </h3>
            <div className="mt-2 divide-y divide-slate-100">
              {(studentInfoRows.length > 0
                ? studentInfoRows
                : [{ label: "基础信息", value: emptySectionPlaceholder }]
              ).map((row) => (
                <div className="grid grid-cols-[112px_1fr] gap-2 py-2" key={row.label}>
                  <span style={{ color: theme.mutedTextColor }}>{row.label}</span>
                  <span
                    className="break-words"
                    style={getTextFormattingStyle("studentBasicInfo")}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (key === "materialCollection") {
      return (
        <section key={key} {...sectionProps}>
          <div data-testid="report-section">
            <h3 className={sectionHeaderClass} style={{ color: theme.titleColor }}>
              材料收集
            </h3>
            <div className="mt-2 grid grid-cols-[1fr_72px_1fr] gap-2 border-b border-slate-200 pb-2 font-semibold text-slate-500">
              <span>材料项目</span>
              <span>状态</span>
              <span>备注</span>
            </div>
            <div className="divide-y divide-slate-100">
              {(materialRows.length > 0
                ? materialRows
                : [
                    {
                      item: "材料收集",
                      status: "na" as MaterialStatusKey,
                      statusLabel: emptySectionPlaceholder,
                      remark: emptySectionPlaceholder,
                    },
                  ]
              ).map((row) => {
                const style = statusStyles[row.status];
                return (
                  <div
                    className="grid grid-cols-[1fr_72px_1fr] gap-2 py-2"
                    key={`${row.item}-${row.remark}`}
                  >
                    <span className="sr-only">
                      {row.item}：{row.remark}
                    </span>
                    <span
                      className="break-words"
                      style={getTextFormattingStyle("materialCollectionStatus")}
                    >
                      {row.item}
                    </span>
                    <span
                      className="inline-flex h-fit rounded-full px-2 py-1 text-[10px] font-semibold"
                      style={{ backgroundColor: style.bg, color: style.color }}
                    >
                      {row.statusLabel}
                    </span>
                    <span
                      className="break-words"
                      style={getTextFormattingStyle("materialCollectionStatus")}
                    >
                      {row.remark}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (key === "completedThisMonth") {
      return (
        <section key={key} {...sectionProps}>
          <div data-testid="report-section">
            <h3 className={sectionHeaderClass} style={{ color: theme.titleColor }}>
              阶段性反馈
            </h3>
            <p
              className="mt-2 whitespace-pre-line"
              style={getTextFormattingStyle("completedThisMonth")}
            >
              {advisorFeedback}
            </p>
          </div>
        </section>
      );
    }

    if (key === "nextMonthPlan") {
      return (
        <section key={key} {...sectionProps}>
          <div data-testid="report-section">
            <h3 className={sectionHeaderClass} style={{ color: theme.titleColor }}>
              下一阶段计划
            </h3>
            <ul
              className="mt-2 list-disc space-y-1 pl-4"
              style={getTextFormattingStyle("nextMonthPlan")}
            >
              {nextActionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      );
    }

    if (key === "clientTasks") {
      return (
        <section key={key} {...sectionProps}>
          <div data-testid="report-section">
            <h3 className={sectionHeaderClass} style={{ color: theme.titleColor }}>
              需要学生/家庭配合
            </h3>
            <p
              className="mt-1 whitespace-pre-line"
              style={getTextFormattingStyle("clientTasks")}
            >
              {content.clientTasks}
            </p>
          </div>
        </section>
      );
    }

    return (
      <section key={key} {...sectionProps}>
        <div data-testid="report-section">
          <h3 className={sectionHeaderClass} style={{ color: theme.titleColor }}>
            附件
          </h3>
          <p className="mt-1">本次报告附件：{attachmentNames}</p>
        </div>
      </section>
    );
  }

  function renderPreviewModules() {
    const shouldPairInformationSections = modules.basicInfo && modules.materialCollection;
    let renderedInformationPair = false;

    return reportModuleOrder.map((key) => {
      if (
        shouldPairInformationSections &&
        (key === "basicInfo" || key === "materialCollection")
      ) {
        if (renderedInformationPair) return null;
        renderedInformationPair = true;
        return (
          <div
            className="mx-4 my-3 grid grid-cols-2 items-stretch gap-3"
            data-testid="basic-material-pair"
            key="basic-material-pair"
          >
            {renderPreviewModule("basicInfo", true)}
            {renderPreviewModule("materialCollection", true)}
          </div>
        );
      }

      return renderPreviewModule(key);
    });
  }

  return (
    <section
      className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      {pendingApplicationType ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <section
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            role="dialog"
          >
            <h2 className="text-lg font-semibold text-slate-950">
              切换为{pendingApplicationType}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              请选择本次切换方式。第一种会同步申请类型、报告模板、时间轴和主题配色；第二种只借用该类型的视觉配色，当前申请类型和报告模板保持不变。
            </p>
            <div className="mt-4 grid gap-2">
              <button
                className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-white"
                style={{ backgroundColor: theme.primaryColor }}
                type="button"
                onClick={usePendingApplicationTemplate}
              >
                使用申请类型 + 报告模板 + 时间轴 + 配色
              </button>
              <button
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700"
                type="button"
                onClick={usePendingApplicationThemeOnly}
              >
                仅使用该类型主题配色
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm" style={{ color: theme.mutedTextColor }}>
            沟通反馈 / 月度反馈
          </p>
          <h1
            className="mt-1 text-3xl font-bold"
            style={{ color: theme.titleColor }}
          >
            沟通反馈/月度反馈生成工作台
          </h1>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
          当前申请类型：{applicationType}
        </div>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[360px_minmax(440px,1fr)_420px]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <FileText className="h-4 w-4" aria-hidden />
            沟通内容输入
          </h2>

          <div className="mt-4 grid gap-4">
            <label className="grid gap-1 text-sm font-medium">
              本次报告标题
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={content.title}
                onChange={(event) => updateContent("title", event.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
              <label className="grid gap-1 text-sm font-medium">
                学生姓名
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={content.studentName}
                  onChange={(event) => updateContent("studentName", event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                申请季度
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={content.season}
                  onChange={(event) => updateContent("season", event.target.value)}
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium">
              申请类型
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={applicationType}
                onChange={(event) => handleApplicationTypeChange(event.target.value)}
              >
                {APPLICATION_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium">
              部门标签
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={content.departmentLabel}
                onChange={(event) =>
                  updateContent("departmentLabel", event.target.value)
                }
              />
            </label>

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Palette className="h-4 w-4" aria-hidden />
                主题颜色
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
                {themeColorFields.map((field) => (
                  <label
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
                    key={field.key}
                  >
                    <span>{field.label}</span>
                    <input
                      aria-label={field.label}
                      className="h-9 w-14 cursor-pointer rounded border border-slate-200 bg-white p-1"
                      type="color"
                      value={theme[field.key]}
                      onChange={(event) =>
                        updateThemeColor(field.key, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Palette className="h-4 w-4" aria-hidden />
                  申请类型与主题配色
                </h2>
                <span className="text-xs text-slate-500">
                  {APPLICATION_TYPE_OPTIONS.length} 套
                </span>
              </div>
              <div
                className="mt-3 grid gap-2"
                data-testid="application-template-library"
              >
                {APPLICATION_TYPE_OPTIONS.map((option) => {
                  const optionConfig = getMonthlyReportApplicationConfig(option);
                  const isSelected = option === applicationType;

                  return (
                    <button
                      aria-label={`选择${option}模板`}
                      aria-pressed={isSelected}
                      className="grid gap-2 rounded-lg border bg-white p-3 text-left text-sm transition hover:-translate-y-0.5 hover:shadow-sm"
                      key={option}
                      style={{
                        borderColor: isSelected
                          ? optionConfig.theme.primaryColor
                          : "#e2e8f0",
                        backgroundColor: isSelected
                          ? optionConfig.theme.backgroundColor
                          : "#ffffff",
                      }}
                      type="button"
                      onClick={() => handleApplicationTypeChange(option)}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="block font-semibold text-slate-950">
                          {option}
                        </span>
                        {isSelected ? (
                          <span
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                            style={{ backgroundColor: optionConfig.theme.primaryColor }}
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden />
                          </span>
                        ) : null}
                      </span>
                      <span className="flex items-center justify-end gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1" aria-hidden>
                          {[
                            optionConfig.theme.primaryColor,
                            optionConfig.theme.secondaryColor,
                            optionConfig.theme.accentColor,
                          ].map((color, colorIndex) => (
                            <span
                              className="h-3 w-3 rounded-full border border-white shadow-sm"
                              key={`${option}-${color}-${colorIndex}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <label className="grid gap-1 text-sm font-medium">
              粘贴沟通内容
              <textarea
                className="min-h-44 rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6"
                placeholder="粘贴微信、邮件、会议纪要或顾问跟进记录，系统会按分行内容提取阶段性反馈、下一阶段计划和配合事项。"
                value={communicationText}
                onChange={(event) => setCommunicationText(event.target.value)}
              />
            </label>

            <label className="grid gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm font-medium">
              上传沟通记录
              <span className="flex items-center gap-2 text-slate-500">
                <Upload className="h-4 w-4" aria-hidden />
                支持上传 txt/md 记录并读取为沟通内容
              </span>
              <input
                aria-label="上传沟通记录"
                accept=".txt,.md,.csv"
                className="text-sm"
                type="file"
                onChange={(event) =>
                  void handleCommunicationFileUpload(event.target.files)
                }
              />
            </label>

            <label className="grid gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm font-medium">
              上传 Excel 表格
              <span className="flex items-center gap-2 text-slate-500">
                <Upload className="h-4 w-4" aria-hidden />
                推荐上传 xlsx、xls 或 csv，系统会读取学生行或字段内容并自动填充
              </span>
              <input
                aria-label="上传 Excel 表格"
                accept=".xlsx,.xls,.csv"
                className="text-sm"
                multiple
                type="file"
                onChange={(event) => void handleSpreadsheetUpload(event.target.files)}
              />
            </label>

            <label className="grid gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm font-medium">
              上传申请截图
              <span className="flex items-center gap-2 text-slate-500">
                <Upload className="h-4 w-4" aria-hidden />
                备用入口：仅在图片 OCR 能读出文字时提取“字段：内容”
              </span>
              <input
                aria-label="上传申请截图"
                accept="image/*,.txt,.md"
                className="text-sm"
                multiple
                type="file"
                onChange={(event) =>
                  void handleApplicationScreenshotUpload(event.target.files)
                }
              />
            </label>

            <label className="grid gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm font-medium">
              上传此前报告
              <span className="flex items-center gap-2 text-slate-500">
                <Upload className="h-4 w-4" aria-hidden />
                读取此前反馈报告中的已填内容并回填到当前页面
              </span>
              <input
                aria-label="上传此前报告"
                accept=".txt,.md,.html,.htm,.pdf,image/*"
                className="text-sm"
                type="file"
                onChange={(event) =>
                  void handlePreviousReportUpload(event.target.files)
                }
              />
            </label>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: theme.primaryColor }}
              type="button"
              onClick={generateFeedback}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              识别并生成反馈
            </button>
            <p
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              data-testid="feedback-recognition-status"
            >
              {recognitionStatus}
            </p>
          </div>

          <section className="mt-5 rounded-lg border border-slate-200 p-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Paperclip className="h-4 w-4" aria-hidden />
              附件上传与展示
            </h2>
            <label className="mt-3 grid gap-2 text-sm font-medium">
              上传附件
              <input
                aria-label="上传附件"
                multiple
                className="text-sm"
                type="file"
                onChange={(event) => handleAttachmentUpload(event.target.files)}
              />
            </label>
            <div className="mt-3 grid gap-2">
              {attachments.length > 0 ? (
                attachments.map((attachment) => (
                  <div
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    key={attachment.id}
                  >
                    <div>
                      <p className="font-medium">{attachment.name}</p>
                      <p className="text-xs text-slate-500">
                        {attachment.type} · {formatFileSize(attachment.size)}
                      </p>
                    </div>
                    <button
                      aria-label={`删除附件 ${attachment.name}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500"
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  尚未上传附件。上传后会在预览中按当前申请类型的附件规则展示。
                </p>
              )}
            </div>
          </section>
        </aside>

        <main className="grid gap-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Wand2 className="h-4 w-4" aria-hidden />
                自动识别结果
              </h2>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
                type="button"
                onClick={() => applyApplicationType(applicationType, true)}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                重置模板
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ReportTextEditor
                formatting={textFormatting.completedThisMonth}
                id="completed-this-month"
                label="阶段性反馈"
                value={content.completedThisMonth}
                onFormattingChange={(formatting) =>
                  updateTextFormatting("completedThisMonth", formatting)
                }
                onValueChange={(value) =>
                  updateContent("completedThisMonth", value)
                }
              />
              <ReportTextEditor
                formatting={textFormatting.nextMonthPlan}
                id="next-month-plan"
                label="下一阶段计划"
                value={content.nextMonthPlan}
                onFormattingChange={(formatting) =>
                  updateTextFormatting("nextMonthPlan", formatting)
                }
                onValueChange={(value) => updateContent("nextMonthPlan", value)}
              />
              <ReportTextEditor
                formatting={textFormatting.clientTasks}
                id="client-tasks"
                label="需要学生/家庭配合"
                minHeightClass="min-h-24"
                value={content.clientTasks}
                onFormattingChange={(formatting) =>
                  updateTextFormatting("clientTasks", formatting)
                }
                onValueChange={(value) => updateContent("clientTasks", value)}
              />
              <section className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">识别字段筛选</h3>
                  <span className="text-xs text-slate-500">
                    {recognizedFields.filter((field) => field.selected).length}/
                    {recognizedFields.length} 展示
                  </span>
                </div>
                {recognizedFields.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {recognizedFields.map((field) => (
                      <label
                        className="grid gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        key={field.id}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <input
                            aria-label={`展示字段 ${field.label}`}
                            checked={field.selected}
                            className="h-4 w-4"
                            type="checkbox"
                            onChange={() => toggleRecognizedField(field.id)}
                          />
                          {field.label}
                        </span>
                        <span className="break-words pl-6 text-xs leading-5 text-slate-500">
                          {field.value}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    上传 Excel 或此前报告后，基础信息、材料收集和进度字段会在这里显示，可逐项选择是否进入报告。
                  </p>
                )}
              </section>
              <ReportTextEditor
                className="lg:col-span-2"
                formatting={textFormatting.studentBasicInfo}
                id="student-basic-info"
                label="基础信息"
                minHeightClass="min-h-24"
                placeholder="就读年级、就读学校、国籍、生日、语言成绩、标化考试、AP、GPA 等信息会显示在这里。"
                value={content.studentBasicInfo}
                onFormattingChange={(formatting) =>
                  updateTextFormatting("studentBasicInfo", formatting)
                }
                onValueChange={(value) => updateContent("studentBasicInfo", value)}
              />
              <ReportTextEditor
                className="lg:col-span-2"
                formatting={textFormatting.materialCollectionStatus}
                id="material-collection-status"
                label="材料收集"
                minHeightClass="min-h-24"
                placeholder="简历信息表、文书信息表、推荐人信息、成绩单、护照、签证页、存款证明等状态会显示在这里。"
                value={content.materialCollectionStatus}
                onFormattingChange={(formatting) =>
                  updateTextFormatting("materialCollectionStatus", formatting)
                }
                onValueChange={(value) =>
                  updateContent("materialCollectionStatus", value)
                }
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">申请时间轴编辑</h2>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
                type="button"
                onClick={addTimelineItem}
              >
                <Plus className="h-4 w-4" aria-hidden />
                新增时间点
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              {timelineItems.map((item, index) => (
                <div
                  className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_1fr_120px_auto_auto]"
                  key={item.id}
                >
                  <label className="grid gap-1 text-sm font-medium">
                    时间点 {index + 1}
                    <input
                      aria-label={`时间点 ${index + 1}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={item.label}
                      onChange={(event) =>
                        updateTimelineItem(item.id, "label", event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    时间点备注 {index + 1}
                    <input
                      aria-label={`时间点备注 ${index + 1}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="如：本周已完成材料沟通"
                      value={item.note}
                      onChange={(event) =>
                        updateTimelineItem(item.id, "note", event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    点亮状态 {index + 1}
                    <select
                      aria-label={`点亮状态 ${index + 1}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={item.status}
                      onChange={(event) =>
                        event.target.value === "current"
                          ? setCurrentTimelineStage(index)
                          : updateTimelineItem(item.id, "status", event.target.value)
                      }
                    >
                      {timelineStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    aria-label={`设为当前阶段 ${index + 1}`}
                    className="inline-flex h-10 items-center justify-center self-end rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600"
                    type="button"
                    onClick={() => setCurrentTimelineStage(index)}
                  >
                    设为当前
                  </button>
                  <button
                    aria-label={`删除时间点 ${index + 1}`}
                    className="inline-flex h-10 items-center justify-center self-end rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600"
                    disabled={timelineItems.length === 1}
                    type="button"
                    onClick={() => removeTimelineItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">模块选择</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {moduleLabels
                .filter(
                  (module) =>
                    !defaultReportModuleOrder.includes(module.key as ReportModuleKey),
                )
                .map((module) => (
                <label
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  key={module.key}
                >
                  <input
                    checked={modules[module.key]}
                    className="h-4 w-4"
                    type="checkbox"
                    onChange={() => toggleModule(module.key)}
                  />
                  {module.label}
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              <p className="text-sm font-semibold text-slate-900">报告板块排序与重点</p>
              {reportModuleOrder.map((key, index) => (
                <div
                  className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]"
                  draggable
                  key={key}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggedModule(key)}
                  onDrop={() => {
                    if (draggedModule) moveReportModuleTo(draggedModule, key);
                  }}
                >
                  <label className="flex items-center gap-2 font-medium">
                    <GripVertical className="h-4 w-4 text-slate-400" aria-hidden />
                    <input
                      checked={modules[key]}
                      className="h-4 w-4"
                      type="checkbox"
                      onChange={() => toggleModule(key)}
                    />
                    {reportModuleToggleLabels[key]}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      checked={highlightedModules[key]}
                      className="h-4 w-4"
                      type="checkbox"
                      onChange={() => toggleHighlightModule(key)}
                    />
                    <Star className="h-4 w-4 text-amber-500" aria-hidden />
                    重点展示{reportModuleLabels[key]}
                  </label>
                  <button
                    aria-label={`上移${reportModuleLabels[key]}`}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-600 disabled:opacity-40"
                    disabled={index === 0}
                    type="button"
                    onClick={() => moveReportModule(key, -1)}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden />
                    上移
                  </button>
                  <button
                    aria-label={`下移${reportModuleLabels[key]}`}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-600 disabled:opacity-40"
                    disabled={index === reportModuleOrder.length - 1}
                    type="button"
                    onClick={() => moveReportModule(key, 1)}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden />
                    下移
                  </button>
                  <span className="self-center rounded-full bg-white px-2 py-1 text-xs text-slate-500">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside
          className="rounded-lg border-2 bg-white p-3 shadow-sm"
          data-testid="monthly-report-preview"
          style={previewStyle}
        >
          <article
            className="overflow-hidden rounded-lg bg-white"
            style={{ borderTop: `2px solid ${theme.primaryColor}` }}
          >
            <h2 className="sr-only">报告预览</h2>
            <header className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <img
                  alt="新东方"
                  className="h-7 w-auto max-w-28 object-contain"
                  src={companyLogoSrc}
                />
                <p className="text-xs" style={{ color: theme.mutedTextColor }}>
                  {content.departmentLabel}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5 text-xs font-semibold">
                {modules.season ? (
                  <span
                    className="rounded-full px-2.5 py-1"
                    style={{
                      backgroundColor: theme.secondarySoftColor,
                      color: theme.accentColor,
                    }}
                  >
                    {content.season}
                  </span>
                ) : null}
                {modules.applicationType ? (
                  <span
                    className="rounded-full px-2.5 py-1"
                    style={{
                      backgroundColor: theme.primarySoftColor,
                      color: theme.primaryColor,
                    }}
                  >
                    {applicationType}
                  </span>
                ) : null}
              </div>
            </header>

            <section
              className="mx-4 grid gap-3 rounded-2xl px-4 py-4 text-white"
              style={{ background: theme.gradient }}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80">
                  Application Progress Report
                </p>
                <h3 className="mt-2 text-2xl font-bold leading-tight">
                  {reportTitle}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/90">
                  {modules.studentName ? <span>学生姓名：{content.studentName}</span> : null}
                  {modules.season ? <span>申请季度：{content.season}</span> : null}
                  {modules.applicationType ? <span>申请类型：{applicationType}</span> : null}
                  <span>报告日期：{exportDate}</span>
                </div>
              </div>
            </section>

            {renderPreviewModules()}

          </article>

          <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Download className="h-4 w-4" aria-hidden />
              导出设置
            </h2>
            <div className="mt-3 grid gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  checked={exportFormats.PDF}
                  className="h-4 w-4"
                  type="checkbox"
                  onChange={() => toggleExportFormat("PDF")}
                />
                导出 PDF
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  checked={exportFormats.PNG}
                  className="h-4 w-4"
                  type="checkbox"
                  onChange={() => toggleExportFormat("PNG")}
                />
                导出 PNG
              </label>
            </div>
            <div className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-600">
              <p className="font-medium text-slate-900">文件名预览</p>
              <div className="mt-2 grid gap-1">
                {exportFileNames.map((fileName) => (
                  <p className="break-all" key={fileName}>
                    {fileName}
                  </p>
                ))}
              </div>
            </div>
            <button
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: theme.primaryColor }}
              type="button"
              onClick={exportReport}
            >
              <Download className="h-4 w-4" aria-hidden />
              导出反馈报告
            </button>
            {exportStatus ? (
              <p className="mt-2 text-sm text-slate-600" role="status">
                {exportStatus}
              </p>
            ) : null}
          </section>
        </aside>
      </div>

    </section>
  );
}
