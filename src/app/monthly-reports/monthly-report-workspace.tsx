"use client";

import {
  Check,
  Download,
  Eye,
  FileText,
  Paperclip,
  Palette,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
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
  templateName: string;
  styleLabel: string;
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
  templateName: boolean;
  styleLabel: boolean;
  timeline: boolean;
  basicInfo: boolean;
  materialCollection: boolean;
  completedThisMonth: boolean;
  nextMonthPlan: boolean;
  clientTasks: boolean;
  attachments: boolean;
};

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
  "本月完成情况",
];

const defaultModules: ModuleVisibility = {
  studentName: true,
  season: true,
  applicationType: true,
  templateName: true,
  styleLabel: true,
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
  { key: "timeline", label: "展示申请时间轴" },
  { key: "basicInfo", label: "展示基础信息" },
  { key: "materialCollection", label: "展示材料收集" },
  { key: "completedThisMonth", label: "展示本次阶段性进度" },
  { key: "nextMonthPlan", label: "展示下一阶段计划" },
  { key: "clientTasks", label: "展示学生/家庭待办" },
  { key: "attachments", label: "展示附件列表" },
];

const exportDate = "20260707";
const emptySectionPlaceholder = "待填写";

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
    title: "沟通反馈/月度反馈报告",
    studentName: "测试学生甲",
    season: "2027秋",
    templateName: config.templateName,
    styleLabel: config.theme.themeName,
    departmentLabel: departmentLabelByApplicationType[applicationType],
    completedThisMonth: config.defaultContent.completedThisMonth,
    nextMonthPlan: config.defaultContent.nextMonthPlan,
    nextStageFocus: config.defaultContent.nextStageFocus,
    clientTasks: config.defaultContent.clientTasks.join("\n"),
    recognizedApplicationStatus: "",
    studentBasicInfo: "",
    materialCollectionStatus: "",
    additionalRecognizedFields: "",
  };
}

function buildDefaultTimeline(
  applicationType: MonthlyReportApplicationType,
): TimelineItem[] {
  const config = getMonthlyReportApplicationConfig(applicationType);

  return config.timeline.map((label, index) => ({
    id: `${applicationType}-${index}-${label}`,
    label,
    status: index < 3 ? "completed" : index === 3 ? "current" : "pending",
  }));
}

function firstMatchingLine(lines: string[], patterns: RegExp[]) {
  return (
    lines.find((line) => patterns.some((pattern) => pattern.test(line))) ?? ""
  );
}

function extractFeedbackFromCommunication(rawText: string, fallback: EditableReportContent) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const completedThisMonth =
    firstMatchingLine(lines, [/完成|已推进|已确认|已提交|梳理|整理/]) ||
    fallback.completedThisMonth;
  const nextMonthPlan =
    firstMatchingLine(lines, [/下月|下周|下一步|计划|继续推进/]) ||
    fallback.nextMonthPlan;
  const nextStageFocus =
    firstMatchingLine(lines, [/重点|关注|风险|提醒|节点|阶段/]) ||
    fallback.nextStageFocus;

  return {
    completedThisMonth,
    nextMonthPlan,
    nextStageFocus,
    clientTasks:
      lines
        .filter(
          (line) =>
            line !== completedThisMonth &&
            line !== nextMonthPlan &&
            line !== nextStageFocus &&
            /(^请|需要|待学生|待家长|补充|上传|提供|证明)/.test(line),
        )
        .join("\n") || fallback.clientTasks,
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
  "本次阶段性进度",
  "本月完成情况",
  "下一阶段计划",
  "下月计划",
  "下一阶段重点",
  "需要学生/家庭配合",
];

function normalizeReportText(rawText: string) {
  return rawText
    .replace(/\r/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
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

function extractReportSection(rawText: string, heading: string) {
  const normalized = normalizeReportText(rawText);
  const lines = normalized
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headingSet = new Set(previousReportHeadings);
  const startIndex = lines.findIndex(
    (line) => normalizeReportHeading(line) === heading,
  );

  if (startIndex >= 0) {
    const bodyLines: string[] = [];
    for (let index = startIndex + 1; index < lines.length; index += 1) {
      if (headingSet.has(normalizeReportHeading(lines[index]))) break;
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
) {
  const paragraphs = text.split(/\n/);
  let currentY = y;

  paragraphs.forEach((paragraph) => {
    let line = "";
    Array.from(paragraph).forEach((character) => {
      const nextLine = `${line}${character}`;
      if (context.measureText(nextLine).width > maxWidth && line) {
        context.fillText(line, x, currentY);
        line = character;
        currentY += lineHeight;
      } else {
        line = nextLine;
      }
    });
    if (line) {
      context.fillText(line, x, currentY);
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
    const [label, ...valueParts] = line.split(/[:：]/);
    const value = valueParts.join("：").trim();
    return value
      ? { label: label.trim(), value }
      : { label: line.trim(), value: emptySectionPlaceholder };
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
  return (lines.length > 0 ? lines : [emptySectionPlaceholder]).slice(0, 3);
}

function summarizeAdvisorFeedback(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return emptySectionPlaceholder;
  return normalized.length > 150 ? `${normalized.slice(0, 150)}...` : normalized;
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
  const [communicationText, setCommunicationText] = useState("");
  const [screenshotRecognitionText, setScreenshotRecognitionText] = useState("");
  const [recognizedFields, setRecognizedFields] = useState<RecognizedField[]>([]);
  const [recognitionStatus, setRecognitionStatus] =
    useState("等待上传沟通记录或申请截图。");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [modules, setModules] = useState<ModuleVisibility>(defaultModules);
  const [exportFormats, setExportFormats] = useState<Record<ExportFormat, boolean>>({
    PDF: true,
    PNG: false,
  });
  const [exportStatus, setExportStatus] = useState("");
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
      setCommunicationText("");
      setScreenshotRecognitionText("");
      setRecognizedFields([]);
      setRecognitionStatus("等待上传沟通记录或申请截图。");
      setIsDirty(false);
    } else {
      setContent((current) => ({
        ...current,
        templateName: nextConfig.templateName,
        styleLabel: nextConfig.theme.themeName,
        departmentLabel: departmentLabelByApplicationType[nextApplicationType],
      }));
    }
  }

  function handleApplicationTypeChange(value: string) {
    applyApplicationType(value as MonthlyReportApplicationType, false);
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
    field: "label" | "status",
    value: string,
  ) {
    setTimelineItems((current) =>
      current.map((item, index) => {
        if (item.id !== id) return item;
        if (field === "status") {
          return { ...item, status: value as TimelineStatus };
        }
        return { ...item, label: value };
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
    if (shouldReadUploadedFileAsText(file)) {
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
        extractReportSection(rawText, "本次阶段性进度") ||
        extractReportSection(rawText, "本月完成情况"),
      nextMonthPlan:
        extractReportSection(rawText, "下一阶段计划") ||
        extractReportSection(rawText, "下月计划"),
      nextStageFocus: extractReportSection(rawText, "下一阶段重点"),
      clientTasks: extractReportSection(rawText, "需要学生/家庭配合"),
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
                `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`,
            )
            .join("")
        : `<tr><th>基础信息</th><td>${emptySectionPlaceholder}</td></tr>`;
    const materialRowsHtml =
      materialRows.length > 0
        ? materialRows
            .map((row) => {
              const style = statusStyles[row.status];
              return `<tr>
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

    return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(content.studentName)}申请季阶段性反馈报告</title>
<style>
@page{size:A4;margin:0}
body{font-family:Arial,"PingFang SC","Microsoft YaHei",sans-serif;margin:0;color:${theme.textColor};background:${theme.backgroundColor}}
.report{width:210mm;min-height:297mm;margin:auto;background:${theme.cardColor};padding:12mm;box-sizing:border-box}
.header{display:flex;align-items:center;justify-content:space-between;gap:18px}
.brand{display:flex;align-items:center;gap:12px;color:${theme.mutedTextColor};font-size:12px}
.logo{width:112px;height:auto}
.badge{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;background:${theme.primarySoftColor};color:${theme.primaryColor};font-size:12px;font-weight:700}
.badge.accent{background:${theme.secondarySoftColor};color:${theme.accentColor}}
.hero{display:grid;grid-template-columns:1.45fr .9fr;gap:18px;margin-top:14px;border-radius:18px;padding:20px;background:${theme.gradient};color:white}
.eyebrow{font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.82}
h1{margin:8px 0 10px;font-size:28px;line-height:1.2}
.meta{display:flex;flex-wrap:wrap;gap:8px;font-size:12px;opacity:.9}
.stage-card{border-radius:14px;background:rgba(255,255,255,.16);padding:14px}
.stage-card h2{margin:0 0 8px;font-size:14px;color:white}
.stage-card p{margin:0;font-size:12px;line-height:1.7}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.metric{border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:${theme.primarySoftColor}}
.metric strong{display:block;margin-top:6px;color:${theme.titleColor};font-size:16px}
.progress{height:7px;margin-top:9px;overflow:hidden;border-radius:999px;background:#e2e8f0}
.progress span{display:block;height:100%;background:${theme.primaryColor}}
.section-title{margin:16px 0 8px;color:${theme.titleColor};font-size:15px}
.timeline{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;list-style:none;margin:0;padding:0}
.timeline-item{position:relative;border:1px solid #e2e8f0;border-radius:10px;padding:9px 8px;background:#f8fafc;font-size:10px;line-height:1.35}
.timeline-dot{display:block;width:9px;height:9px;border-radius:999px;margin-bottom:6px;background:${theme.timelinePendingColor}}
.timeline-item.completed .timeline-dot{background:${theme.timelineCompletedColor}}
.timeline-item.current{border-color:${theme.primaryColor};background:${theme.primarySoftColor}}
.timeline-item.current .timeline-dot{background:${theme.timelineCurrentColor}}
.timeline-status{display:block;margin-top:5px;color:${theme.mutedTextColor}}
.main-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:12px;margin-top:14px}
.card{border:1px solid #e2e8f0;border-radius:14px;background:white;padding:13px;box-shadow:0 8px 24px rgba(15,23,42,.06)}
table{width:100%;border-collapse:collapse;font-size:11px}
th,td{border-bottom:1px solid #e2e8f0;padding:8px 6px;text-align:left;vertical-align:top;line-height:1.55}
th{width:36%;color:${theme.mutedTextColor};font-weight:600}
.status-pill{display:inline-flex;border-radius:999px;padding:4px 8px;background:#f1f5f9;color:#64748b;font-size:10px;font-weight:700;white-space:nowrap}
.feedback{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.feedback ul{margin:0;padding-left:18px;font-size:12px;line-height:1.8}
.feedback p{margin:0;font-size:12px;line-height:1.8;white-space:pre-line}
.attachments{margin-top:12px}
.footer{display:flex;justify-content:space-between;gap:16px;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:10px;color:${theme.mutedTextColor};font-size:10px}
</style>
</head>
<body>
<main class="report">
<header class="header">
<div class="brand"><img class="logo" src="${companyLogoSrc}" alt="新东方" /><span>${escapeHtml(content.departmentLabel)}</span></div>
<div><span class="badge">${escapeHtml(applicationType)}</span> <span class="badge accent">${escapeHtml(content.season)}</span></div>
</header>
<section class="hero">
<div>
<div class="eyebrow">Application Progress Report</div>
<h1>${escapeHtml(content.studentName)}申请季阶段性反馈报告</h1>
<div class="meta">
${modules.studentName ? `<span>学生姓名：${escapeHtml(content.studentName)}</span>` : ""}
${modules.season ? `<span>申请季度：${escapeHtml(content.season)}</span>` : ""}
${modules.applicationType ? `<span>申请类型：${escapeHtml(applicationType)}</span>` : ""}
<span>报告日期：${exportDate}</span>
<span>${escapeHtml(content.templateName)}</span>
</div>
</div>
<aside class="stage-card">
<h2>当前阶段重点</h2>
<p>${escapeHtml(currentTimelineItem?.label ?? emptySectionPlaceholder)}</p>
<h2 style="margin-top:12px">下一步建议</h2>
<p>${escapeHtml(content.nextStageFocus)}</p>
</aside>
</section>
<section class="metrics" aria-label="关键摘要">
<div class="metric">材料收集完整度<strong>${escapeHtml(metricSummary.materialText)}</strong><div class="progress"><span style="width:${metricSummary.materialPercent}%"></span></div></div>
<div class="metric">核心学术信息<strong>${escapeHtml(metricSummary.academicText)}</strong></div>
<div class="metric">当前就读学校<strong>${escapeHtml(metricSummary.school)}</strong></div>
</section>
${modules.timeline ? `<h2 class="section-title">${escapeHtml(config.moduleTitles.timeline)}</h2><ol class="timeline">${timelineHtml}</ol>` : ""}
<section class="main-grid">
${modules.basicInfo ? `<div class="card"><h2 class="section-title" style="margin-top:0">基础信息</h2><table>${infoRowsHtml}</table></div>` : ""}
${modules.materialCollection ? `<div class="card"><h2 class="section-title" style="margin-top:0">材料收集</h2><table><thead><tr><th>材料项目</th><th>状态</th><th>备注</th></tr></thead><tbody>${materialRowsHtml}</tbody></table></div>` : ""}
</section>
<section class="feedback">
${modules.nextMonthPlan ? `<div class="card"><h2 class="section-title" style="margin-top:0">本阶段后续动作 / 下一阶段计划</h2><ul>${nextActionsHtml}</ul></div>` : ""}
${modules.completedThisMonth ? `<div class="card"><h2 class="section-title" style="margin-top:0">顾问阶段性反馈 / 本次阶段性进度</h2><p>${escapeHtml(advisorFeedback)}</p></div>` : ""}
</section>
${modules.completedThisMonth ? `<section class="card" style="margin-top:12px"><h2 class="section-title" style="margin-top:0">本次阶段性进度</h2><p>${escapeHtml(content.completedThisMonth)}</p></section>` : ""}
${modules.clientTasks ? `<section class="card" style="margin-top:12px"><h2 class="section-title" style="margin-top:0">需要学生/家庭配合</h2><p>${escapeHtml(content.clientTasks)}</p></section>` : ""}
${modules.attachments && attachmentNames ? `<section class="card attachments"><h2 class="section-title" style="margin-top:0">附件展示</h2><p>${attachmentHtml}</p></section>` : ""}
<footer class="footer"><span>免责声明：本报告仅用于阶段性申请沟通与服务复核。</span><span>报告版本 ${escapeHtml(content.styleLabel)}</span></footer>
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

    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const context = canvas.getContext("2d");
    if (!context) {
      return new Blob([buildReportHtml()], { type: "text/html;charset=utf-8" });
    }

    const pageX = 70;
    const pageY = 70;
    const pageWidth = canvas.width - 140;
    const contentX = 110;
    const contentWidth = canvas.width - 220;

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

    context.textAlign = "right";
    context.fillStyle = theme.primaryColor;
    context.font = 'bold 20px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(applicationType, 1130, 126);
    context.fillStyle = theme.accentColor;
    context.fillText(content.season, 1130, 158);
    context.textAlign = "left";

    const heroY = 198;
    const heroHeight = 238;
    const heroGradient = context.createLinearGradient(
      contentX,
      heroY,
      contentX + contentWidth,
      heroY + heroHeight,
    );
    heroGradient.addColorStop(0, theme.primaryDarkColor);
    heroGradient.addColorStop(0.68, theme.primaryColor);
    heroGradient.addColorStop(1, theme.accentColor);
    context.fillStyle = heroGradient;
    context.fillRect(contentX, heroY, contentWidth, heroHeight);

    context.fillStyle = "rgba(255,255,255,0.82)";
    context.font = 'bold 18px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText("Application Progress Report", contentX + 32, heroY + 46);
    context.fillStyle = "#ffffff";
    context.font = 'bold 42px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(`${content.studentName}申请季阶段性反馈报告`, contentX + 32, heroY + 102);
    context.font = '22px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    const metaText = [
      modules.studentName ? `学生姓名：${content.studentName}` : "",
      modules.season ? `申请季度：${content.season}` : "",
      modules.applicationType ? `申请类型：${applicationType}` : "",
      content.templateName,
    ]
      .filter(Boolean)
      .join("   ");
    context.fillText(metaText, contentX + 32, heroY + 148);

    context.fillStyle = "rgba(255,255,255,0.16)";
    context.fillRect(contentX + 650, heroY + 34, 360, 168);
    context.fillStyle = "#ffffff";
    context.font = 'bold 22px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText("当前阶段重点", contentX + 676, heroY + 76);
    context.font = '20px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(currentTimelineItem?.label ?? emptySectionPlaceholder, contentX + 676, heroY + 112);
    context.font = 'bold 20px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText("下一步建议", contentX + 676, heroY + 150);
    context.font = '18px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    drawWrappedText(context, content.nextStageFocus, contentX + 676, heroY + 182, 310, 25);

    let y = heroY + heroHeight + 42;
    context.fillStyle = theme.titleColor;
    context.font = 'bold 24px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText("关键摘要", contentX, y);
    y += 22;
    const metricWidth = (contentWidth - 24) / 3;
    [
      ["材料收集完整度", metricSummary.materialText],
      ["核心学术信息", metricSummary.academicText],
      ["当前就读学校", metricSummary.school],
    ].forEach(([label, value], index) => {
      const x = contentX + index * (metricWidth + 12);
      context.fillStyle = index === 0 ? theme.primarySoftColor : "#ffffff";
      context.fillRect(x, y, metricWidth, 102);
      context.strokeStyle = "#e2e8f0";
      context.strokeRect(x, y, metricWidth, 102);
      context.fillStyle = theme.mutedTextColor;
      context.font = '18px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
      context.fillText(label, x + 18, y + 32);
      context.fillStyle = theme.titleColor;
      context.font = 'bold 24px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
      drawWrappedText(context, value, x + 18, y + 68, metricWidth - 36, 28);
    });

    y += 142;
    if (modules.timeline) {
      context.fillStyle = theme.titleColor;
      context.font = 'bold 24px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
      context.fillText(config.moduleTitles.timeline, contentX, y);
      y += 26;
      const timelineColumns = 5;
      const timelineBoxWidth = (contentWidth - 32) / timelineColumns;
      timelineItems.slice(0, 10).forEach((item, index) => {
        const x = contentX + (index % timelineColumns) * (timelineBoxWidth + 8);
        const itemY = y + Math.floor(index / timelineColumns) * 82;
        context.fillStyle = item.status === "current" ? theme.primarySoftColor : "#f8fafc";
        context.fillRect(x, itemY, timelineBoxWidth, 66);
        context.strokeStyle = item.status === "current" ? theme.primaryColor : "#e2e8f0";
        context.strokeRect(x, itemY, timelineBoxWidth, 66);
        context.fillStyle = getTimelineColor(item.status);
        context.beginPath();
        context.arc(x + 18, itemY + 18, 6, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = theme.textColor;
        context.font = '16px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
        drawWrappedText(context, item.label, x + 34, itemY + 20, timelineBoxWidth - 44, 20);
      });
      y += timelineItems.length > 5 ? 180 : 98;
    }

    const leftWidth = 480;
    const rightWidth = contentWidth - leftWidth - 18;
    const tableTop = y;
    if (modules.basicInfo) {
      context.fillStyle = "#ffffff";
      context.fillRect(contentX, tableTop, leftWidth, 330);
      context.strokeStyle = "#e2e8f0";
      context.strokeRect(contentX, tableTop, leftWidth, 330);
      context.fillStyle = theme.titleColor;
      context.font = 'bold 23px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
      context.fillText("基础信息", contentX + 18, tableTop + 36);
      context.font = '17px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
      (studentInfoRows.length > 0
        ? studentInfoRows
        : [{ label: "基础信息", value: emptySectionPlaceholder }]
      )
        .slice(0, 8)
        .forEach((row, index) => {
          const rowY = tableTop + 76 + index * 30;
          context.fillStyle = theme.mutedTextColor;
          context.fillText(row.label, contentX + 18, rowY);
          context.fillStyle = theme.textColor;
          context.fillText(row.value, contentX + 170, rowY);
        });
    }
    if (modules.materialCollection) {
      const x = contentX + leftWidth + 18;
      context.fillStyle = "#ffffff";
      context.fillRect(x, tableTop, rightWidth, 330);
      context.strokeStyle = "#e2e8f0";
      context.strokeRect(x, tableTop, rightWidth, 330);
      context.fillStyle = theme.titleColor;
      context.font = 'bold 23px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
      context.fillText("材料收集", x + 18, tableTop + 36);
      context.fillStyle = theme.mutedTextColor;
      context.font = 'bold 16px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
      context.fillText("材料项目", x + 18, tableTop + 70);
      context.fillText("状态", x + 220, tableTop + 70);
      context.fillText("备注", x + 330, tableTop + 70);
      (materialRows.length > 0
        ? materialRows
        : [
            {
              item: "材料收集",
              status: "na" as MaterialStatusKey,
              statusLabel: emptySectionPlaceholder,
              remark: emptySectionPlaceholder,
            },
          ]
      )
        .slice(0, 8)
        .forEach((row, index) => {
          const rowY = tableTop + 102 + index * 28;
          context.fillStyle = theme.textColor;
          context.font = '16px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText(row.item, x + 18, rowY);
          context.fillStyle = statusStyles[row.status].color;
          context.font = 'bold 15px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText(row.statusLabel, x + 220, rowY);
          context.fillStyle = theme.textColor;
          context.font = '15px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
          context.fillText(row.remark, x + 330, rowY);
        });
    }

    y = tableTop + 366;
    const feedbackWidth = (contentWidth - 18) / 2;
    [
      modules.nextMonthPlan
        ? {
            title: "本阶段后续动作 / 下一阶段计划",
            body: nextActionItems.map((item) => `• ${item}`).join("\n"),
          }
        : null,
      modules.completedThisMonth
        ? {
            title: "顾问阶段性反馈 / 本次阶段性进度",
            body: advisorFeedback,
          }
        : null,
    ]
      .filter(Boolean)
      .forEach((section, index) => {
        if (!section) return;
        const x = contentX + index * (feedbackWidth + 18);
        context.fillStyle = "#ffffff";
        context.fillRect(x, y, feedbackWidth, 150);
        context.strokeStyle = "#e2e8f0";
        context.strokeRect(x, y, feedbackWidth, 150);
        context.fillStyle = theme.titleColor;
        context.font = 'bold 21px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
        context.fillText(section.title, x + 18, y + 34);
        context.fillStyle = theme.textColor;
        context.font = '17px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
        drawWrappedText(context, section.body, x + 18, y + 68, feedbackWidth - 36, 25);
      });

    y += 188;
    if (modules.clientTasks) {
      context.fillStyle = theme.titleColor;
      context.font = 'bold 22px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
      context.fillText("需要学生/家庭配合", contentX, y);
      context.fillStyle = theme.textColor;
      context.font = '18px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
      drawWrappedText(context, content.clientTasks, contentX, y + 34, contentWidth, 26);
    }

    context.fillStyle = theme.mutedTextColor;
    context.font = '15px Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(
      `免责声明：本报告仅用于阶段性申请沟通与服务复核。   报告版本 ${content.styleLabel}`,
      contentX,
      1660,
    );

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
    const page = pdf.addPage([595.28, 841.89]);
    const scale = Math.min(595.28 / image.width, 841.89 / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    page.drawImage(image, {
      x: (595.28 - width) / 2,
      y: (841.89 - height) / 2,
      width,
      height,
    });
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

  return (
    <section
      className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
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
          当前模板：{content.templateName}
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

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
              <label className="grid gap-1 text-sm font-medium">
                报告模板名称
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={content.templateName}
                  onChange={(event) => updateContent("templateName", event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                报告风格标签
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={content.styleLabel}
                  onChange={(event) => updateContent("styleLabel", event.target.value)}
                />
              </label>
            </div>
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
                  申请类型与报告模板
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
                        <span>
                          <span className="block font-semibold text-slate-950">
                            {option}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {optionConfig.templateName}
                          </span>
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
                      <span className="flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>{optionConfig.theme.themeName}</span>
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
                placeholder="粘贴微信、邮件、会议纪要或顾问跟进记录，系统会提取本次阶段性进度、下一阶段计划和待办。"
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
              <label className="grid gap-1 text-sm font-medium">
                本次阶段性进度
                <textarea
                  className="min-h-28 rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6"
                  value={content.completedThisMonth}
                  onChange={(event) =>
                    updateContent("completedThisMonth", event.target.value)
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                下一阶段计划
                <textarea
                  className="min-h-28 rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6"
                  value={content.nextMonthPlan}
                  onChange={(event) => updateContent("nextMonthPlan", event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                需要学生/家庭配合
                <textarea
                  className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6"
                  value={content.clientTasks}
                  onChange={(event) => updateContent("clientTasks", event.target.value)}
                />
              </label>
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
              <label className="grid gap-1 text-sm font-medium lg:col-span-2">
                基础信息
                <textarea
                  aria-label="基础信息"
                  className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6"
                  placeholder="就读年级、就读学校、国籍、生日、语言成绩、标化考试、AP、GPA 等信息会显示在这里。"
                  value={content.studentBasicInfo}
                  onChange={(event) =>
                    updateContent("studentBasicInfo", event.target.value)
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-medium lg:col-span-2">
                材料收集
                <textarea
                  aria-label="材料收集"
                  className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6"
                  placeholder="简历信息表、文书信息表、推荐人信息、成绩单、护照、签证页、存款证明等状态会显示在这里。"
                  value={content.materialCollectionStatus}
                  onChange={(event) =>
                    updateContent("materialCollectionStatus", event.target.value)
                  }
                />
              </label>
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
                  className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_120px_auto_auto]"
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
              {moduleLabels.map((module) => (
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
          </section>
        </main>

        <aside
          className="rounded-lg border-2 bg-white p-3 shadow-sm"
          data-testid="monthly-report-preview"
          style={previewStyle}
        >
          <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <header className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <img
                  alt="新东方"
                  className="h-7 w-auto max-w-28 object-contain"
                  src={companyLogoSrc}
                />
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Eye className="h-4 w-4" aria-hidden />
                    报告预览
                  </h2>
                  <p className="mt-0.5 text-xs" style={{ color: theme.mutedTextColor }}>
                    {content.departmentLabel}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5 text-xs font-semibold">
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
                {modules.season ? (
                  <span
                    className="rounded-full px-2.5 py-1"
                    style={{
                      backgroundColor: theme.secondarySoftColor,
                      color: theme.accentColor,
                    }}
                  >
                    申请季度：{content.season}
                  </span>
                ) : null}
              </div>
            </header>

            <section
              className="grid gap-3 px-4 py-4 text-white"
              style={{ background: theme.gradient }}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80">
                  Application Progress Report
                </p>
                <h3 className="mt-2 text-2xl font-bold leading-tight">
                  {content.studentName}申请季阶段性反馈报告
                </h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/90">
                  {modules.studentName ? <span>学生姓名：{content.studentName}</span> : null}
                  {modules.applicationType ? <span>申请类型：{applicationType}</span> : null}
                  <span>报告日期：{exportDate}</span>
                  {modules.templateName ? <span>{content.templateName}</span> : null}
                  {modules.styleLabel ? <span>{content.styleLabel}</span> : null}
                </div>
              </div>
              <div className="rounded-lg bg-white/15 p-3">
                <p className="text-sm font-semibold">当前阶段重点</p>
                <p className="mt-1 text-sm">{currentTimelineItem?.label ?? emptySectionPlaceholder}</p>
                <p className="mt-3 text-sm font-semibold">下一步建议</p>
                <p className="mt-1 text-xs leading-5 text-white/90">
                  {content.nextStageFocus}
                </p>
              </div>
            </section>

            <section className="grid gap-2 px-4 py-3" aria-label="关键摘要">
              <h3 className="text-sm font-semibold" style={{ color: theme.titleColor }}>
                关键摘要
              </h3>
              <div className="grid gap-2 sm:grid-cols-3">
                <div
                  className="rounded-lg border border-slate-200 p-3 text-xs"
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
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                  <span style={{ color: theme.mutedTextColor }}>核心学术信息</span>
                  <strong className="mt-1 block text-sm" style={{ color: theme.titleColor }}>
                    {metricSummary.academicText}
                  </strong>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                  <span style={{ color: theme.mutedTextColor }}>当前就读学校</span>
                  <strong className="mt-1 block text-sm" style={{ color: theme.titleColor }}>
                    {metricSummary.school}
                  </strong>
                </div>
              </div>
            </section>

            {modules.timeline ? (
              <section className="px-4 py-3">
                <h4 className="text-sm font-semibold" style={{ color: theme.titleColor }}>
                  {config.moduleTitles.timeline}
                </h4>
                <ol className="mt-3 grid grid-cols-2 gap-2">
                  {timelineItems.map((item, index) => (
                    <li
                      className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                      key={item.id}
                    >
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
              </section>
            ) : null}

            <section className="grid gap-3 px-4 py-3 text-xs leading-5">
              {modules.basicInfo ? (
                <div className="rounded-lg border border-slate-200 p-3 shadow-sm">
                  <h4 className="font-semibold" style={{ color: theme.titleColor }}>
                    基础信息
                  </h4>
                  <div className="mt-2 divide-y divide-slate-100">
                    {(studentInfoRows.length > 0
                      ? studentInfoRows
                      : [{ label: "基础信息", value: emptySectionPlaceholder }]
                    ).map((row) => (
                      <div className="grid grid-cols-[112px_1fr] gap-2 py-2" key={row.label}>
                        <span style={{ color: theme.mutedTextColor }}>{row.label}</span>
                        <span className="break-words font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {modules.materialCollection ? (
                <div className="rounded-lg border border-slate-200 p-3 shadow-sm">
                  <h4 className="font-semibold" style={{ color: theme.titleColor }}>
                    材料收集
                  </h4>
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
                          <span className="break-words font-medium">{row.item}</span>
                          <span
                            className="inline-flex h-fit rounded-full px-2 py-1 text-[10px] font-semibold"
                            style={{ backgroundColor: style.bg, color: style.color }}
                          >
                            {row.statusLabel}
                          </span>
                          <span className="break-words text-slate-600">{row.remark}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                {modules.nextMonthPlan ? (
                  <div className="rounded-lg border border-slate-200 p-3 shadow-sm">
                    <h4 className="font-semibold" style={{ color: theme.titleColor }}>
                      本阶段后续动作 / 下一阶段计划
                    </h4>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {nextActionItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {modules.completedThisMonth ? (
                  <div className="rounded-lg border border-slate-200 p-3 shadow-sm">
                    <h4 className="font-semibold" style={{ color: theme.titleColor }}>
                      顾问阶段性反馈 / 本次阶段性进度
                    </h4>
                    <p className="mt-2 whitespace-pre-line">{advisorFeedback}</p>
                  </div>
                ) : null}
              </div>
              {modules.clientTasks ? (
                <div className="rounded-lg border border-slate-200 p-3 shadow-sm">
                  <h4 className="font-semibold" style={{ color: theme.titleColor }}>
                    需要学生/家庭配合
                  </h4>
                  <p className="mt-1 whitespace-pre-line">{content.clientTasks}</p>
                </div>
              ) : null}
              {modules.attachments && attachmentNames ? (
                <div className="rounded-lg border border-slate-200 p-3 shadow-sm">
                  <h4 className="font-semibold" style={{ color: theme.titleColor }}>
                    附件展示
                  </h4>
                  <p className="mt-1">本次报告附件：{attachmentNames}</p>
                </div>
              ) : null}
            </section>

            <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
              <span>免责声明：本报告仅用于阶段性申请沟通与服务复核。</span>
              <span>报告版本 {content.styleLabel}</span>
            </footer>
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
