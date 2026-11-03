"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bold as BoldIcon,
  CalendarDays,
  Check,
  ClipboardList,
  Download,
  FileText,
  GraduationCap,
  GripVertical,
  Eye,
  Maximize2,
  Minimize2,
  Paperclip,
  Palette,
  Plus,
  RotateCcw,
  School,
  Sparkles,
  Star,
  Trash2,
  Underline as UnderlineIcon,
  Upload,
  UserRound,
  UsersRound,
  Wand2,
  X,
} from "lucide-react";
import {
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  APPLICATION_TYPE_OPTIONS,
  getMonthlyReportApplicationConfig,
  type MonthlyReportApplicationType,
  type MonthlyReportTheme,
} from "@/features/monthly-reports/application-types";
import {
  extractLegacyOcrSection,
  normalizeLegacyReportText,
  type LegacyPdfExtraction,
} from "@/features/monthly-reports/legacy-pdf-report";
import {
  embedPngReportState,
  readPngReportState,
} from "@/features/monthly-reports/png-report-state";

type EditableReportContent = {
  title: string;
  studentName: string;
  season: string;
  reportDate: string;
  departmentLabel: string;
  stageFocusTitle: string;
  currentStageFocusTitle: string;
  currentStageFocus: string;
  nextStageFocusTitle: string;
  summaryTitle: string;
  summaryMaterialTitle: string;
  summaryMaterialValue: string;
  summaryAcademicTitle: string;
  summaryAcademicValue: string;
  summarySchoolTitle: string;
  summarySchoolValue: string;
  completedThisMonthTitle: string;
  completedThisMonth: string;
  nextMonthPlanTitle: string;
  nextMonthPlan: string;
  nextStageFocus: string;
  clientTasksTitle: string;
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
  previewKind: "image" | "pdf" | "text" | "file";
  previewUrl: string;
  textContent: string;
};

type SchoolApplicationColumn = {
  id: string;
  label: string;
};

type SchoolApplicationRow = {
  id: string;
  values: Record<string, string>;
};

type SchoolApplicationTable = {
  columns: SchoolApplicationColumn[];
  rows: SchoolApplicationRow[];
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
  schoolApplications: boolean;
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

type TextFormattingRange = {
  start: number;
  end: number;
  formatting: TextFormatting;
};

type TextFormattingRangeMap = Record<TextFormattingKey, TextFormattingRange[]>;

type TextSelection = {
  start: number;
  end: number;
};

type StyledTextSegment = {
  text: string;
  formatting: TextFormatting;
};

type ReportModuleKey =
  | "stageFocus"
  | "summary"
  | "timeline"
  | "basicInfo"
  | "materialCollection"
  | "schoolApplications"
  | "completedThisMonth"
  | "nextMonthPlan"
  | "clientTasks"
  | "attachments";

type ReportModuleWidth = "compact" | "wide";

type ExportFormat = "PDF" | "PNG";

type ReportPageSlice = {
  start: number;
  end: number;
};

type ReportPdfLayout = {
  breakPositions: number[];
  repeatHeaderHeight: number;
  continuationContentTop: number;
  bottomMargin: number;
  railX: number;
  railWidth: number;
  mainX: number;
  mainWidth: number;
  reportWidth: number;
  schoolApplicationContentEnd: number;
  schoolApplicationContentStart: number;
  schoolApplicationRepeatHeight: number;
  schoolApplicationRepeatStart: number;
};

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

type PreviousReportStateV1 = {
  version: 1;
  applicationType: MonthlyReportApplicationType;
  content: EditableReportContent;
  timelineItems: TimelineItem[];
  theme: MonthlyReportTheme;
  modules: ModuleVisibility;
  reportModuleOrder: ReportModuleKey[];
  reportModuleWidths: Record<ReportModuleKey, ReportModuleWidth>;
  highlightedModules: Record<ReportModuleKey, boolean>;
  textFormatting: TextFormattingMap;
  textFormattingRanges: TextFormattingRangeMap;
  schoolApplicationColumns: SchoolApplicationColumn[];
  schoolApplications: SchoolApplicationRow[];
  schoolApplicationColumnWidths?: Record<string, number>;
  schoolApplicationRowHeights?: Record<string, number>;
};

const initialApplicationType: MonthlyReportApplicationType = "美国本科新生";
const companyLogoSrc = "/new-oriental-logo-2026.png";
const reportPagePixelHeight = 1754;
const previousReportStatePrefix = "MONTHLY_REPORT_STATE_V1:";
const schoolApplicationFieldDefinitions = [
  {
    id: "university-english-name",
    label: "申请大学英文名称",
    aliases: [
      "申请大学英文名称",
      "申请院校英文名称",
      "大学英文名称",
      "申请院校",
      "院校名称",
      "申请学校",
      "学校名称",
      "目标院校",
    ],
  },
  {
    id: "application-college",
    label: "申请学院",
    aliases: ["申请学院", "申请院系", "学院", "院系"],
  },
  {
    id: "application-major",
    label: "专业",
    aliases: ["专业", "申请专业", "意向专业"],
  },
  {
    id: "application-round",
    label: "申请轮次",
    aliases: ["申请轮次", "申请批次", "轮次", "批次"],
  },
  {
    id: "application-deadline",
    label: "申请截止时间",
    aliases: ["申请截止时间", "申请截止日期", "截止时间", "截止日期"],
  },
  {
    id: "materials-complete",
    label: "材料是否齐全",
    aliases: ["材料是否齐全", "材料齐全情况", "材料状态", "申请材料状态"],
  },
  {
    id: "application-status",
    label: "申请状态",
    aliases: ["申请状态", "递交状态", "网申状态"],
    includeByDefault: false,
  },
  {
    id: "admission-result",
    label: "录取结果",
    aliases: ["录取结果", "申请结果", "录取状态"],
  },
  {
    id: "admitted-program",
    label: "录取专业和学院",
    aliases: ["录取专业和学院", "录取专业及学院", "录取学院和专业"],
  },
] as const;

const defaultSchoolApplicationColumns: SchoolApplicationColumn[] =
  schoolApplicationFieldDefinitions
    .filter(
      (definition) =>
        !("includeByDefault" in definition) || definition.includeByDefault !== false,
    )
    .map(({ id, label }) => ({ id, label }));

export function buildReportPageSlices(
  totalHeight: number,
  firstPageHeight: number,
  breakPositions: number[],
  continuationPageHeight = firstPageHeight,
): ReportPageSlice[] {
  const sortedBreakPositions = [...new Set(breakPositions)]
    .filter((position) => position > 0 && position < totalHeight)
    .sort((left, right) => left - right);
  const slices: ReportPageSlice[] = [];
  let start = 0;

  while (
    totalHeight - start >
    (slices.length === 0 ? firstPageHeight : continuationPageHeight) + 1
  ) {
    const pageHeight =
      slices.length === 0 ? firstPageHeight : continuationPageHeight;
    const idealEnd = start + pageHeight;
    const preferredBreak = sortedBreakPositions
      .filter(
        (position) =>
          position > start + 8 && position <= idealEnd - 8,
      )
      .at(-1);
    const startsAtModule = sortedBreakPositions.some(
      (position) => Math.abs(position - start) <= 8,
    );
    const nextModuleStart = sortedBreakPositions.find(
      (position) => position > start + 8,
    );
    const end =
      preferredBreak ??
      (startsAtModule ? (nextModuleStart ?? totalHeight) : idealEnd);
    slices.push({ start, end });
    start = end;
  }

  slices.push({ start, end: totalHeight });
  return slices;
}

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
  schoolApplications: false,
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
  { key: "schoolApplications", label: "展示院校申请" },
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
  "schoolApplications",
  "completedThisMonth",
  "nextMonthPlan",
  "clientTasks",
  "attachments",
];

const defaultReportModuleWidths: Record<ReportModuleKey, ReportModuleWidth> = {
  stageFocus: "wide",
  summary: "wide",
  timeline: "compact",
  basicInfo: "compact",
  materialCollection: "wide",
  schoolApplications: "wide",
  completedThisMonth: "wide",
  nextMonthPlan: "wide",
  clientTasks: "wide",
  attachments: "wide",
};

const reportModuleLabels: Record<ReportModuleKey, string> = {
  stageFocus: "当前阶段重点和下一步建议",
  summary: "关键摘要",
  timeline: "申请时间轴",
  basicInfo: "基础信息",
  materialCollection: "材料收集",
  schoolApplications: "院校申请",
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
  schoolApplications: "展示院校申请",
  completedThisMonth: "展示阶段性反馈",
  nextMonthPlan: "展示下一阶段计划",
  clientTasks: "展示需要学生/家庭配合",
  attachments: "展示附件列表",
};

const emptySectionPlaceholder = "待填写";
const defaultEditableSectionTitles = {
  stageFocus: "当前阶段重点和下一步建议",
  summary: "关键摘要",
  completedThisMonth: "阶段性反馈",
  nextMonthPlan: "下一阶段计划",
  clientTasks: "需要学生/家庭配合",
};
const defaultStageFocusLabels = {
  current: "当前阶段重点",
  next: "下一步建议",
};
const defaultSummaryLabels = {
  material: "材料完整度",
  academic: "核心学术信息",
  school: "当前就读学校",
};
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
  reportDate = "",
): EditableReportContent {
  const config = getMonthlyReportApplicationConfig(applicationType);

  return {
    title: "测试学生甲申请季阶段性反馈报告",
    studentName: "测试学生甲",
    season: "2027秋",
    reportDate,
    departmentLabel: departmentLabelByApplicationType[applicationType],
    stageFocusTitle: defaultEditableSectionTitles.stageFocus,
    currentStageFocusTitle: defaultStageFocusLabels.current,
    currentStageFocus: config.timeline[3] ?? config.timeline[0] ?? "",
    nextStageFocusTitle: defaultStageFocusLabels.next,
    summaryTitle: defaultEditableSectionTitles.summary,
    summaryMaterialTitle: defaultSummaryLabels.material,
    summaryMaterialValue: "",
    summaryAcademicTitle: defaultSummaryLabels.academic,
    summaryAcademicValue: "",
    summarySchoolTitle: defaultSummaryLabels.school,
    summarySchoolValue: "",
    completedThisMonthTitle: defaultEditableSectionTitles.completedThisMonth,
    completedThisMonth: config.defaultContent.completedThisMonth,
    nextMonthPlanTitle: defaultEditableSectionTitles.nextMonthPlan,
    nextMonthPlan: config.defaultContent.nextMonthPlan,
    nextStageFocus: config.defaultContent.nextStageFocus,
    clientTasksTitle: defaultEditableSectionTitles.clientTasks,
    clientTasks: config.defaultContent.clientTasks.join("\n"),
    recognizedApplicationStatus: "",
    studentBasicInfo: defaultStudentBasicInfo,
    materialCollectionStatus: "",
    additionalRecognizedFields: "",
  };
}

function getTodayReportDateInputValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const valueByType = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${valueByType.year}-${valueByType.month}-${valueByType.day}`;
}

function formatReportDateForDisplay(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 8 ? digits : value.trim();
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

function buildDefaultTextFormattingRanges(): TextFormattingRangeMap {
  return {
    completedThisMonth: [],
    nextMonthPlan: [],
    clientTasks: [],
    studentBasicInfo: [],
    materialCollectionStatus: [],
  };
}

function textFormattingMatches(left: TextFormatting, right: TextFormatting) {
  return (
    left.color === right.color &&
    left.bold === right.bold &&
    left.underline === right.underline
  );
}

function buildCharacterFormatting(
  textLength: number,
  baseFormatting: TextFormatting,
  ranges: TextFormattingRange[],
) {
  const formatting = Array.from({ length: textLength }, () => baseFormatting);

  ranges.forEach((range) => {
    const start = Math.max(0, Math.min(textLength, range.start));
    const end = Math.max(start, Math.min(textLength, range.end));
    for (let index = start; index < end; index += 1) {
      formatting[index] = range.formatting;
    }
  });

  return formatting;
}

function compressCharacterFormatting(
  formatting: TextFormatting[],
  baseFormatting: TextFormatting,
) {
  const ranges: TextFormattingRange[] = [];
  let rangeStart = -1;
  let rangeFormatting: TextFormatting | null = null;

  const flushRange = (end: number) => {
    if (rangeStart < 0 || !rangeFormatting) return;
    ranges.push({ start: rangeStart, end, formatting: rangeFormatting });
    rangeStart = -1;
    rangeFormatting = null;
  };

  formatting.forEach((item, index) => {
    if (textFormattingMatches(item, baseFormatting)) {
      flushRange(index);
      return;
    }
    if (rangeStart >= 0 && rangeFormatting && textFormattingMatches(item, rangeFormatting)) {
      return;
    }
    flushRange(index);
    rangeStart = index;
    rangeFormatting = item;
  });
  flushRange(formatting.length);

  return ranges;
}

function getSelectionFormatting(
  text: string,
  baseFormatting: TextFormatting,
  ranges: TextFormattingRange[],
  selection: TextSelection,
) {
  if (!text.length) return baseFormatting;
  const characterFormatting = buildCharacterFormatting(
    text.length,
    baseFormatting,
    ranges,
  );
  const start = Math.max(0, Math.min(text.length - 1, selection.start));
  const end = Math.max(start + 1, Math.min(text.length, selection.end || start + 1));
  const selectedFormatting = characterFormatting.slice(start, end);
  const first = selectedFormatting[0] ?? baseFormatting;

  return {
    color: selectedFormatting.every((item) => item.color === first.color)
      ? first.color
      : baseFormatting.color,
    bold: selectedFormatting.every((item) => item.bold),
    underline: selectedFormatting.every((item) => item.underline),
  };
}

function applyTextFormattingPatch(
  text: string,
  baseFormatting: TextFormatting,
  ranges: TextFormattingRange[],
  selection: TextSelection,
  patch: Partial<TextFormatting>,
) {
  const formatting = buildCharacterFormatting(text.length, baseFormatting, ranges);
  const hasSelection = selection.end > selection.start;
  const start = hasSelection ? Math.max(0, Math.min(text.length, selection.start)) : 0;
  const end = hasSelection ? Math.max(start, Math.min(text.length, selection.end)) : text.length;
  const nextBaseFormatting = hasSelection
    ? baseFormatting
    : { ...baseFormatting, ...patch };

  for (let index = start; index < end; index += 1) {
    formatting[index] = { ...formatting[index], ...patch };
  }

  return {
    formatting: nextBaseFormatting,
    ranges: compressCharacterFormatting(formatting, nextBaseFormatting),
  };
}

function remapTextFormattingRanges(
  previousText: string,
  nextText: string,
  baseFormatting: TextFormatting,
  ranges: TextFormattingRange[],
) {
  if (previousText === nextText) return ranges;
  const previousFormatting = buildCharacterFormatting(
    previousText.length,
    baseFormatting,
    ranges,
  );
  let prefixLength = 0;
  while (
    prefixLength < previousText.length &&
    prefixLength < nextText.length &&
    previousText[prefixLength] === nextText[prefixLength]
  ) {
    prefixLength += 1;
  }
  let suffixLength = 0;
  while (
    suffixLength < previousText.length - prefixLength &&
    suffixLength < nextText.length - prefixLength &&
    previousText[previousText.length - suffixLength - 1] ===
      nextText[nextText.length - suffixLength - 1]
  ) {
    suffixLength += 1;
  }

  const insertedLength = nextText.length - prefixLength - suffixLength;
  const inheritedFormatting =
    previousFormatting[prefixLength] ??
    previousFormatting[prefixLength - 1] ??
    baseFormatting;
  const nextFormatting = [
    ...previousFormatting.slice(0, prefixLength),
    ...Array.from({ length: insertedLength }, () => inheritedFormatting),
    ...previousFormatting.slice(previousText.length - suffixLength),
  ];

  return compressCharacterFormatting(nextFormatting, baseFormatting);
}

function buildStyledTextSegments(
  text: string,
  baseFormatting: TextFormatting,
  ranges: TextFormattingRange[],
  start = 0,
  end = text.length,
): StyledTextSegment[] {
  const safeStart = Math.max(0, Math.min(text.length, start));
  const safeEnd = Math.max(safeStart, Math.min(text.length, end));
  const formatting = buildCharacterFormatting(text.length, baseFormatting, ranges);
  const segments: StyledTextSegment[] = [];
  let segmentStart = safeStart;

  for (let index = safeStart + 1; index <= safeEnd; index += 1) {
    const previous = formatting[index - 1] ?? baseFormatting;
    const current = formatting[index] ?? baseFormatting;
    if (index < safeEnd && textFormattingMatches(previous, current)) continue;
    segments.push({
      text: text.slice(segmentStart, index),
      formatting: previous,
    });
    segmentStart = index;
  }

  return segments.filter((segment) => segment.text.length > 0);
}

type ReportTextEditorProps = {
  id: string;
  label: string;
  sectionTitle?: string;
  value: string;
  formatting: TextFormatting;
  formattingRanges: TextFormattingRange[];
  className?: string;
  minHeightClass?: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  onSectionTitleChange?: (value: string) => void;
  onFormattingChange: (
    patch: Partial<TextFormatting>,
    selection: TextSelection,
  ) => void;
};

function ReportTextEditor({
  id,
  label,
  sectionTitle,
  value,
  formatting,
  formattingRanges,
  className = "",
  minHeightClass = "min-h-28",
  placeholder,
  onValueChange,
  onSectionTitleChange,
  onFormattingChange,
}: ReportTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<TextSelection>({ start: 0, end: 0 });
  const selectedFormatting = getSelectionFormatting(
    value,
    formatting,
    formattingRanges,
    selection,
  );
  const selectedCharacterCount = Math.max(0, selection.end - selection.start);

  const rememberSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    setSelection({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    });
  };

  return (
    <section className={`grid gap-2 ${className}`}>
      {sectionTitle !== undefined && onSectionTitleChange ? (
        <label className="grid gap-1 text-sm font-medium" htmlFor={`${id}-title`}>
          {label}板块标题
          <input
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-inner outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            id={`${id}-title`}
            value={sectionTitle}
            onChange={(event) => onSectionTitleChange(event.target.value)}
          />
        </label>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {selectedCharacterCount > 0 ? (
            <span className="px-1 text-xs text-slate-500">
              已选 {selectedCharacterCount} 字
            </span>
          ) : null}
          <label
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-white shadow-sm"
            title={`${label}文字颜色`}
          >
            <Palette className="h-4 w-4" aria-hidden />
            <input
              aria-label={`${label}文字颜色`}
              className="absolute h-px w-px opacity-0"
              type="color"
              value={selectedFormatting.color}
              onChange={(event) =>
                onFormattingChange({ color: event.target.value }, selection)
              }
            />
          </label>
          <button
            aria-label={`${label}加粗`}
            aria-pressed={selectedFormatting.bold}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm aria-pressed:bg-slate-900 aria-pressed:text-white"
            title="加粗"
            type="button"
            onClick={() =>
              onFormattingChange({ bold: !selectedFormatting.bold }, selection)
            }
          >
            <BoldIcon className="h-4 w-4" aria-hidden />
          </button>
          <button
            aria-label={`${label}下划线`}
            aria-pressed={selectedFormatting.underline}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm aria-pressed:bg-slate-900 aria-pressed:text-white"
            title="下划线"
            type="button"
            onClick={() =>
              onFormattingChange({
                underline: !selectedFormatting.underline,
              }, selection)
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
        ref={textareaRef}
        placeholder={placeholder}
        style={{
          color: formatting.color,
          fontWeight: formatting.bold ? 700 : 400,
          textDecoration: formatting.underline ? "underline" : "none",
        }}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onSelect={rememberSelection}
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
  const currentFocusLines = matchingLines([
    /当前阶段(?:重点)?/,
    /本阶段重点/,
    /目前阶段/,
    /当前重点/,
  ]);
  const nextFocusLines = matchingLines([
    /下一阶段/,
    /下一步/,
    /后续(?:重点|建议)/,
    /接下来/,
  ]);
  const clientTaskLines = matchingLines([
    /(^请|需要|待学生|待家长|补充|上传|提供|证明)/,
  ]);
  const completedThisMonth =
    completedLines.join("\n") ||
    fallback.completedThisMonth;
  const nextMonthPlan =
    nextPlanLines.join("\n") ||
    fallback.nextMonthPlan;
  const currentStageFocus =
    currentFocusLines.join("\n") || fallback.currentStageFocus;
  const nextStageFocus =
    nextFocusLines.join("\n") ||
    focusLines.filter((line) => !currentFocusLines.includes(line)).join("\n") ||
    fallback.nextStageFocus;

  return {
    completedThisMonth,
    nextMonthPlan,
    currentStageFocus,
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

function getAttachmentPreviewKind(file: File): AttachmentItem["previewKind"] {
  const lowerName = file.name.toLowerCase();
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) return "pdf";
  if (shouldReadUploadedFileAsText(file)) return "text";
  return "file";
}

function filesToAttachments(
  files: FileList | File[] | null | undefined,
) {
  return Array.from(files ?? []).map((file, index) => {
      const previewKind = getAttachmentPreviewKind(file);
      const previewUrl =
        typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(file)
          : "";
      return {
        id: `${file.name}-${file.size}-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type || "未知类型",
        previewKind,
        previewUrl,
        textContent: "",
      } satisfies AttachmentItem;
    });
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
  const normalized = normalizeLegacyReportText(rawText);
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

function normalizeRecognizedLabel(label: string) {
  return label.normalize("NFKC").replace(/\s+/g, "").trim();
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

function getSchoolApplicationFieldDefinition(value: string) {
  const normalized = normalizeRecognizedLabel(value);
  return schoolApplicationFieldDefinitions.find((definition) =>
    definition.aliases.some(
      (alias) => normalizeRecognizedLabel(alias) === normalized,
    ),
  );
}

function isSchoolApplicationHeader(value: string) {
  return (
    getSchoolApplicationFieldDefinition(value)?.id ===
    "university-english-name"
  );
}

function buildSchoolColumnId(label: string, index: number) {
  const definition = getSchoolApplicationFieldDefinition(label);
  if (definition) return definition.id;
  return `school-column-${sanitizeFileNameSegment(normalizeRecognizedLabel(label)) || index}`;
}

function schoolApplicationTableFromRows(
  rows: string[][],
  studentName: string,
  options: { preserveSourceHeaders?: boolean } = {},
): SchoolApplicationTable | null {
  for (let headerIndex = 0; headerIndex < rows.length; headerIndex += 1) {
    const headerRow = rows[headerIndex].map(normalizeSpreadsheetValue);
    const schoolNameIndex = headerRow.findIndex(isSchoolApplicationHeader);
    if (schoolNameIndex < 0) continue;

    const sourceIndexByColumnId = new Map<string, number>();
    headerRow.forEach((header, sourceIndex) => {
      const definition = getSchoolApplicationFieldDefinition(header);
      if (definition && !sourceIndexByColumnId.has(definition.id)) {
        sourceIndexByColumnId.set(definition.id, sourceIndex);
      }
    });
    const columns = options.preserveSourceHeaders
      ? headerRow.flatMap((header, sourceIndex) => {
          const definition = getSchoolApplicationFieldDefinition(header);
          if (!definition || sourceIndexByColumnId.get(definition.id) !== sourceIndex) {
            return [];
          }
          return [{ id: definition.id, label: definition.label }];
        })
      : defaultSchoolApplicationColumns.map((column) => ({ ...column }));
    const studentNameIndex = headerRow.findIndex((header) =>
      ["学生姓名", "姓名"].includes(normalizeRecognizedLabel(header)),
    );
    const normalizedStudentName = normalizeRecognizedLabel(studentName);
    const candidateRows = rows
      .slice(headerIndex + 1)
      .map((row) => row.map(normalizeSpreadsheetValue))
      .filter((row) => row.some(Boolean));
    const matchingStudentRows =
      studentNameIndex >= 0 && normalizedStudentName
        ? candidateRows.filter((row) => {
            const rowName = normalizeRecognizedLabel(row[studentNameIndex] ?? "");
            return (
              rowName === normalizedStudentName ||
              Boolean(rowName && rowName.includes(normalizedStudentName))
            );
          })
        : [];
    const sourceRows = matchingStudentRows.length > 0 ? matchingStudentRows : candidateRows;
    const schoolRows = sourceRows
      .filter((row) => {
        const schoolName = row[schoolNameIndex] ?? "";
        return (
          isMeaningfulRecognizedValue(schoolName) &&
          !isSchoolApplicationHeader(schoolName)
        );
      })
      .map((row, rowIndex) => {
        const admittedCollegeIndex = headerRow.findIndex(
          (header) => normalizeRecognizedLabel(header) === "录取学院",
        );
        const admittedMajorIndex = headerRow.findIndex(
          (header) => normalizeRecognizedLabel(header) === "录取专业",
        );
        const values = Object.fromEntries(
          columns.map((column) => {
            const sourceIndex = sourceIndexByColumnId.get(column.id);
            let value = sourceIndex === undefined ? "" : row[sourceIndex] ?? "";
            if (column.id === "admitted-program" && !value) {
              value = [
                admittedCollegeIndex >= 0 ? row[admittedCollegeIndex] : "",
                admittedMajorIndex >= 0 ? row[admittedMajorIndex] : "",
              ]
                .filter(isMeaningfulRecognizedValue)
                .join(" / ");
            }
            return [column.id, value];
          }),
        );
        return {
          id: `school-row-${headerIndex}-${rowIndex}`,
          values,
        };
      });

    if (schoolRows.length > 0) return { columns, rows: schoolRows };
  }

  return null;
}

function mergeSchoolApplicationTables(
  tables: SchoolApplicationTable[],
): SchoolApplicationTable | null {
  if (tables.length === 0) return null;
  const columns: SchoolApplicationColumn[] = [];
  const columnIdByLabel = new Map<string, string>();

  tables.forEach((table) => {
    table.columns.forEach((column) => {
      const normalizedLabel = normalizeRecognizedLabel(column.label);
      if (columnIdByLabel.has(normalizedLabel)) return;
      const id = buildSchoolColumnId(column.label, columns.length);
      columnIdByLabel.set(normalizedLabel, id);
      columns.push({ id, label: column.label });
    });
  });

  const rows = tables.flatMap((table, tableIndex) =>
    table.rows.map((row, rowIndex) => {
      const values: Record<string, string> = {};
      table.columns.forEach((column) => {
        const targetId = columnIdByLabel.get(normalizeRecognizedLabel(column.label));
        if (targetId) values[targetId] = row.values[column.id] ?? "";
      });
      return { id: `school-row-${tableIndex}-${rowIndex}`, values };
    }),
  );

  return { columns, rows };
}

async function parseSpreadsheetFile(file: File, studentName: string) {
  if (file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv") {
    const rows = parseCsvRows(await file.text());
    return {
      fields: fieldsFromSpreadsheetRows(rows, studentName),
      schoolApplicationTable: schoolApplicationTableFromRows(rows, studentName),
    };
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetRows = workbook.SheetNames.map((sheetName) =>
    XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
      defval: "",
    }).map((row) => row.map(normalizeSpreadsheetValue)),
  );
  const rows = sheetRows.flat();

  return {
    fields: fieldsFromSpreadsheetRows(rows, studentName),
    schoolApplicationTable: mergeSchoolApplicationTables(
      sheetRows
        .map((sheet) => schoolApplicationTableFromRows(sheet, studentName))
        .filter((table): table is SchoolApplicationTable => Boolean(table)),
    ),
  };
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
  "关键摘要",
  "申请时间轴",
  "院校申请",
  "院校申请进度",
  "基础信息",
  "学生基础信息",
  "材料收集",
  "材料收集情况",
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
  "附件",
  "附件展示",
];

function normalizeReportText(rawText: string) {
  return normalizeLegacyReportText(
    rawText
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
    .replace(/&quot;/g, '"'),
  );
}

function normalizeReportHeading(line: string) {
  return line.replace(/[：:]\s*$/, "").trim();
}

function isReportHeadingMatch(line: string, heading: string) {
  const normalizedLine = normalizeReportHeading(line);
  const normalizedHeading = normalizeReportHeading(heading);
  if (normalizedLine === normalizedHeading) return true;
  return normalizedLine
    .split(/\s+\/\s+/)
    .map((part) => part.trim())
    .some(
      (part) =>
        part === normalizedHeading ||
        (part.endsWith(normalizedHeading) &&
          part.length - normalizedHeading.length <= 4),
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

function buildTimelineFromLegacyReport(
  applicationType: MonthlyReportApplicationType,
  rawText: string,
  currentStageFocus: string,
) {
  const timeline = buildDefaultTimeline(applicationType);
  const normalizedText = normalizeLegacyReportText(rawText);
  const normalizedFocus = normalizeRecognizedLabel(currentStageFocus);
  let currentIndex = timeline.findIndex((item) => {
    const escapedLabel = escapeRegExp(item.label);
    return new RegExp(
      `${escapedLabel}.{0,16}(?:进行中|当前|本阶段重点)`,
      "i",
    ).test(normalizedText);
  });

  if (currentIndex < 0 && normalizedFocus) {
    currentIndex = timeline.findIndex((item) =>
      normalizedFocus.includes(normalizeRecognizedLabel(item.label)),
    );
  }

  if (currentIndex < 0) {
    const lastCompletedIndex = timeline.reduce((result, item, index) => {
      const escapedLabel = escapeRegExp(item.label);
      return new RegExp(`${escapedLabel}.{0,12}(?:已完成|完成)`, "i").test(
        normalizedText,
      )
        ? index
        : result;
    }, -1);
    if (lastCompletedIndex >= 0 && lastCompletedIndex < timeline.length - 1) {
      currentIndex = lastCompletedIndex + 1;
    }
  }

  if (currentIndex < 0) return timeline;
  return timeline.map((item, index) => ({
    ...item,
    status:
      index < currentIndex
        ? ("completed" as const)
        : index === currentIndex
          ? ("current" as const)
          : ("pending" as const),
  }));
}

function schoolApplicationTableFromLegacyPdf(
  report: LegacyPdfExtraction,
  studentName: string,
) {
  return mergeSchoolApplicationTables(
    report.schoolApplicationTables
      .map((rows) =>
        schoolApplicationTableFromRows(rows, studentName, {
          preserveSourceHeaders: true,
        }),
      )
      .filter((table): table is SchoolApplicationTable => Boolean(table)),
  );
}

function serializePreviousReportState(state: PreviousReportStateV1) {
  return `${previousReportStatePrefix}${JSON.stringify(state)}`;
}

function parsePreviousReportState(value: string | undefined | null) {
  if (!value?.trim()) return null;
  const source = value.startsWith(previousReportStatePrefix)
    ? value.slice(previousReportStatePrefix.length)
    : value.trim();

  try {
    const parsed = JSON.parse(source) as Partial<PreviousReportStateV1>;
    if (
      parsed.version !== 1 ||
      !APPLICATION_TYPE_OPTIONS.includes(
        parsed.applicationType as MonthlyReportApplicationType,
      ) ||
      !parsed.content ||
      !Array.isArray(parsed.timelineItems)
    ) {
      return null;
    }
    return parsed as PreviousReportStateV1;
  } catch {
    return null;
  }
}

async function readEmbeddedPreviousReportState(file: File) {
  const lowerName = file.name.toLowerCase();
  if (file.type === "image/png" || lowerName.endsWith(".png")) {
    try {
      return parsePreviousReportState(await readPngReportState(file));
    } catch {
      return null;
    }
  }

  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
      });
      const pdfDocument = await Promise.race([
        loadingTask.promise,
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error("PDF 元数据读取超时")),
            15_000,
          );
        }),
      ]);
      try {
        const metadata = await pdfDocument.getMetadata().catch(() => null);
        const info = (metadata?.info ?? {}) as Record<string, unknown>;
        return parsePreviousReportState(
          typeof info.Subject === "string" ? info.Subject : "",
        );
      } finally {
        await pdfDocument.destroy();
      }
    } catch {
      return null;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  if (lowerName.endsWith(".json") || file.type === "application/json") {
    try {
      return parsePreviousReportState(await file.text());
    } catch {
      return null;
    }
  }

  return null;
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

async function loadBlobImage(blob: Blob) {
  const sourceUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("报告图像解码失败。"));
      image.src = sourceUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function canvasToPngBytes(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("报告分页图像生成失败。"));
    }, "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
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

function setCanvasTextFormatting(
  context: CanvasRenderingContext2D,
  formatting: TextFormatting,
  fontSize: number,
) {
  context.fillStyle = formatting.color;
  context.font = `${formatting.bold ? "bold " : ""}${fontSize}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
}

function drawWrappedStyledText(
  context: CanvasRenderingContext2D,
  segments: StyledTextSegment[],
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  fontSize: number,
) {
  let currentX = x;
  let currentY = y;
  let hasContentOnLine = false;

  segments.forEach((segment) => {
    setCanvasTextFormatting(context, segment.formatting, fontSize);
    for (let index = 0; index < segment.text.length; index += 1) {
      const character = segment.text[index];
      if (character === "\r") continue;
      if (character === "\n") {
        currentX = x;
        currentY += lineHeight;
        hasContentOnLine = false;
        continue;
      }
      const characterWidth = context.measureText(character).width;
      if (hasContentOnLine && currentX + characterWidth > x + maxWidth) {
        currentX = x;
        currentY += lineHeight;
        hasContentOnLine = false;
      }
      context.fillText(character, currentX, currentY);
      if (segment.formatting.underline) {
        context.beginPath();
        context.moveTo(currentX, currentY + 3);
        context.lineTo(currentX + characterWidth, currentY + 3);
        context.strokeStyle = segment.formatting.color;
        context.lineWidth = 1;
        context.stroke();
      }
      currentX += characterWidth;
      hasContentOnLine = true;
    }
  });

  return currentY + lineHeight;
}

function measureWrappedStyledTextLines(
  context: CanvasRenderingContext2D,
  segments: StyledTextSegment[],
  maxWidth: number,
  fontSize: number,
) {
  let lineCount = 1;
  let lineWidth = 0;

  segments.forEach((segment) => {
    setCanvasTextFormatting(context, segment.formatting, fontSize);
    for (let index = 0; index < segment.text.length; index += 1) {
      const character = segment.text[index];
      if (character === "\r") continue;
      if (character === "\n") {
        lineCount += 1;
        lineWidth = 0;
        continue;
      }
      const characterWidth = context.measureText(character).width;
      if (lineWidth > 0 && lineWidth + characterWidth > maxWidth) {
        lineCount += 1;
        lineWidth = characterWidth;
      } else {
        lineWidth += characterWidth;
      }
    }
  });

  return lineCount;
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

type KeyValueRowSourceRange = {
  labelStart: number;
  labelEnd: number;
  valueStart: number;
  valueEnd: number;
};

type TextSourceRange = {
  start: number;
  end: number;
  text: string;
};

function locateNonEmptyLineSourceRanges(sourceText: string): TextSourceRange[] {
  const ranges: TextSourceRange[] = [];
  const linePattern = /[^\r\n]+/g;
  let match = linePattern.exec(sourceText);
  while (match) {
    const line = match[0];
    const leadingWhitespace = line.length - line.trimStart().length;
    const text = line.trim();
    const start = match.index + leadingWhitespace;
    if (text) ranges.push({ start, end: start + text.length, text });
    match = linePattern.exec(sourceText);
  }
  return ranges;
}

function locateKeyValueRowSourceRanges(
  sourceText: string,
  rows: KeyValueRow[],
): KeyValueRowSourceRange[] {
  let cursor = 0;
  return rows.map((row) => {
    const labelStart = sourceText.indexOf(row.label, cursor);
    const labelEnd = labelStart >= 0 ? labelStart + row.label.length : -1;
    const valueStart =
      row.value === emptySectionPlaceholder || labelEnd < 0
        ? -1
        : sourceText.indexOf(row.value, labelEnd);
    const valueEnd = valueStart >= 0 ? valueStart + row.value.length : -1;
    cursor = Math.max(cursor, valueEnd >= 0 ? valueEnd : labelEnd);
    return { labelStart, labelEnd, valueStart, valueEnd };
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

function splitMaterialStatusAndRemark(value: string) {
  const segments = value
    .split(/[|｜:：]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const explicitStatusPattern =
    /^(?:√|已提供|已收集|已完成|完成|已有|OK|提交|进行中|处理中|准备中|沟通中|等待提供|暂未提供|待补充|待提供|未提供|申请季提供|后续提供|之后提供|后补|后续|风险|异常|无法|缺失|逾期|需关注|问题|不适用|无需|NA|N\/A)$/i;

  if (segments.length > 1 && explicitStatusPattern.test(segments[0])) {
    return {
      statusSource: segments[0],
      remark: segments.slice(1).join("｜"),
    };
  }

  return { statusSource: value, remark: value };
}

function parseMaterialRows(text: string): MaterialReportRow[] {
  return parseKeyValueRows(text).map((row) => {
    const { statusSource, remark } = splitMaterialStatusAndRemark(row.value);
    const status = normalizeMaterialStatus(statusSource);
    return {
      item: row.label,
      status,
      statusLabel: statusStyles[status].label,
      remark,
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
  const [textFormattingRanges, setTextFormattingRanges] = useState(() =>
    buildDefaultTextFormattingRanges(),
  );
  const previousFormattedTextRef = useRef({
    completedThisMonth: content.completedThisMonth,
    nextMonthPlan: content.nextMonthPlan,
    clientTasks: content.clientTasks,
    studentBasicInfo: content.studentBasicInfo,
    materialCollectionStatus: content.materialCollectionStatus,
  });
  const [communicationText, setCommunicationText] = useState("");
  const [recognizedFields, setRecognizedFields] = useState<RecognizedField[]>([]);
  const [recognitionStatus, setRecognitionStatus] =
    useState("等待粘贴沟通内容，或上传沟通记录、Excel、此前报告。");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);
  const [schoolApplicationColumns, setSchoolApplicationColumns] = useState<
    SchoolApplicationColumn[]
  >(defaultSchoolApplicationColumns);
  const [schoolApplications, setSchoolApplications] = useState<
    SchoolApplicationRow[]
  >([]);
  const [schoolApplicationColumnWidths, setSchoolApplicationColumnWidths] =
    useState<Record<string, number>>({});
  const [schoolApplicationRowHeights, setSchoolApplicationRowHeights] =
    useState<Record<string, number>>({});
  const [modules, setModules] = useState<ModuleVisibility>(defaultModules);
  const [reportModuleOrder, setReportModuleOrder] = useState<ReportModuleKey[]>(
    defaultReportModuleOrder,
  );
  const [reportModuleWidths, setReportModuleWidths] = useState<
    Record<ReportModuleKey, ReportModuleWidth>
  >(defaultReportModuleWidths);
  const [highlightedModules, setHighlightedModules] = useState<
    Record<ReportModuleKey, boolean>
  >({
    stageFocus: false,
    summary: false,
    timeline: false,
    basicInfo: false,
    materialCollection: false,
    schoolApplications: false,
    completedThisMonth: false,
    nextMonthPlan: false,
    clientTasks: false,
    attachments: false,
  });
  const [draggedModule, setDraggedModule] = useState<ReportModuleKey | null>(null);
  const [draggedTimelineItem, setDraggedTimelineItem] = useState<string | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [exportFormats, setExportFormats] = useState<Record<ExportFormat, boolean>>({
    PDF: true,
    PNG: false,
  });
  const [exportStatus, setExportStatus] = useState("");
  const exportReportRef = useRef<HTMLElement | null>(null);
  const [shouldRenderExportTarget, setShouldRenderExportTarget] = useState(false);
  const [reportPageCount, setReportPageCount] = useState(1);
  const [pendingApplicationType, setPendingApplicationType] =
    useState<MonthlyReportApplicationType | null>(null);
  const [, setIsDirty] = useState(false);

  const config = useMemo(
    () => getMonthlyReportApplicationConfig(applicationType),
    [applicationType],
  );
  const previewAttachment = attachments.find(
    (attachment) => attachment.id === previewAttachmentId,
  );

  const previewStyle = {
    backgroundColor: theme.cardColor,
    borderColor: theme.primaryColor,
    color: theme.textColor,
    fontFamily: theme.fontFamily,
  };

  useEffect(() => {
    setContent((current) =>
      current.reportDate
        ? current
        : { ...current, reportDate: getTodayReportDateInputValue() },
    );
    setShouldRenderExportTarget(
      !navigator.userAgent.toLowerCase().includes("jsdom"),
    );
  }, []);

  useEffect(() => {
    if (!isPreviewExpanded && !previewAttachmentId) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsPreviewExpanded(false);
      setPreviewAttachmentId(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isPreviewExpanded, previewAttachmentId]);

  useEffect(() => {
    const reportNode = exportReportRef.current;
    if (
      !shouldRenderExportTarget ||
      !reportNode ||
      typeof ResizeObserver === "undefined"
    ) {
      return;
    }

    const updatePageCount = () => {
      const pdfLayout = getReportPdfLayout();
      const continuationPageHeight = pdfLayout
        ? reportPagePixelHeight -
          pdfLayout.continuationContentTop -
          pdfLayout.bottomMargin -
          pdfLayout.schoolApplicationRepeatHeight
        : reportPagePixelHeight;
      setReportPageCount(
        buildReportPageSlices(
          reportNode.scrollHeight,
          reportPagePixelHeight,
          pdfLayout?.breakPositions ?? [],
          continuationPageHeight,
        ).length,
      );
    };
    updatePageCount();
    const observer = new ResizeObserver(updatePageCount);
    observer.observe(reportNode);
    return () => observer.disconnect();
  }, [shouldRenderExportTarget]);

  useEffect(() => {
    const nextFormattedText = {
      completedThisMonth: content.completedThisMonth,
      nextMonthPlan: content.nextMonthPlan,
      clientTasks: content.clientTasks,
      studentBasicInfo: content.studentBasicInfo,
      materialCollectionStatus: content.materialCollectionStatus,
    };
    const previousFormattedText = previousFormattedTextRef.current;
    setTextFormattingRanges((current) => {
      let hasChanges = false;
      const next = { ...current };
      (Object.keys(nextFormattedText) as TextFormattingKey[]).forEach((field) => {
        if (previousFormattedText[field] === nextFormattedText[field]) return;
        hasChanges = true;
        next[field] = remapTextFormattingRanges(
          previousFormattedText[field],
          nextFormattedText[field],
          textFormatting[field],
          current[field],
        );
      });
      return hasChanges ? next : current;
    });
    previousFormattedTextRef.current = nextFormattedText;
  }, [
    content.clientTasks,
    content.completedThisMonth,
    content.materialCollectionStatus,
    content.nextMonthPlan,
    content.studentBasicInfo,
    textFormatting,
  ]);

  function updateContent(field: keyof EditableReportContent, value: string) {
    setContent((current) => ({ ...current, [field]: value }));
    setIsDirty(true);
  }

  function updateTextFormatting(
    field: TextFormattingKey,
    patch: Partial<TextFormatting>,
    selection: TextSelection,
  ) {
    const result = applyTextFormattingPatch(
      content[field],
      textFormatting[field],
      textFormattingRanges[field],
      selection,
      patch,
    );
    setTextFormatting((current) => ({ ...current, [field]: result.formatting }));
    setTextFormattingRanges((current) => ({
      ...current,
      [field]: result.ranges,
    }));
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

  function getStyledSegments(
    field: TextFormattingKey,
    text: string,
    start = 0,
    end = text.length,
  ) {
    return buildStyledTextSegments(
      text,
      textFormatting[field],
      textFormattingRanges[field],
      start,
      end,
    );
  }

  function renderStyledText(
    field: TextFormattingKey,
    text: string,
    start = 0,
    end = text.length,
  ) {
    return getStyledSegments(field, text, start, end).map((segment, index) => (
      <span
        key={`${start}-${index}-${segment.text}`}
        style={{
          color: segment.formatting.color,
          fontWeight: segment.formatting.bold ? 700 : 400,
          textDecoration: segment.formatting.underline ? "underline" : "none",
          textUnderlineOffset: "2px",
        }}
      >
        {segment.text}
      </span>
    ));
  }

  function getStyledTextHtml(
    field: TextFormattingKey,
    text: string,
    start = 0,
    end = text.length,
  ) {
    return getStyledSegments(field, text, start, end)
      .map(
        (segment) =>
          `<span style="color:${segment.formatting.color};font-weight:${segment.formatting.bold ? 700 : 400};text-decoration:${segment.formatting.underline ? "underline" : "none"};text-underline-offset:2px">${escapeHtml(segment.text).replace(/\r?\n/g, "<br>")}</span>`,
      )
      .join("");
  }

  function applyApplicationType(
    nextApplicationType: MonthlyReportApplicationType,
    resetContent: boolean,
  ) {
    const nextConfig = getMonthlyReportApplicationConfig(nextApplicationType);
    const currentConfig = getMonthlyReportApplicationConfig(applicationType);
    const currentDefaultFocus =
      currentConfig.timeline[3] ?? currentConfig.timeline[0] ?? "";
    const nextDefaultFocus =
      nextConfig.timeline[3] ?? nextConfig.timeline[0] ?? "";
    setApplicationType(nextApplicationType);
    setTheme(nextConfig.theme);
    setTimelineItems(buildDefaultTimeline(nextApplicationType));
    if (resetContent) {
      setContent(
        buildDefaultContent(
          nextApplicationType,
          getTodayReportDateInputValue(),
        ),
      );
      setTextFormatting(buildDefaultTextFormatting(nextConfig.theme.textColor));
      setTextFormattingRanges(buildDefaultTextFormattingRanges());
      setCommunicationText("");
      setRecognizedFields([]);
      setSchoolApplicationColumns(defaultSchoolApplicationColumns);
      setSchoolApplications([]);
      setModules(defaultModules);
      setReportModuleOrder(defaultReportModuleOrder);
      setReportModuleWidths(defaultReportModuleWidths);
      setRecognitionStatus(
        "等待粘贴沟通内容，或上传沟通记录、Excel、此前报告。",
      );
      setIsDirty(false);
    } else {
      setContent((current) => ({
        ...current,
        departmentLabel: departmentLabelByApplicationType[nextApplicationType],
        currentStageFocus:
          !current.currentStageFocus.trim() ||
          current.currentStageFocus === currentDefaultFocus
            ? nextDefaultFocus
            : current.currentStageFocus,
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
        : "未识别到可自动填充的结构化字段，请检查沟通内容或 Excel 表头，并在下方手动补充。",
    );
    setIsDirty(true);
  }

  function updateTimelineItem(
    id: string,
    field: "label" | "status" | "note",
    value: string,
  ) {
    const previousItem = timelineItems.find((item) => item.id === id);
    if (field === "label" && previousItem?.status === "current") {
      setContent((current) => ({
        ...current,
        currentStageFocus:
          !current.currentStageFocus.trim() ||
          current.currentStageFocus === previousItem.label
            ? value
            : current.currentStageFocus,
      }));
    }
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
    const previousFocus = getCurrentTimelineItem(timelineItems)?.label ?? "";
    const nextFocus = timelineItems[currentIndex]?.label ?? "";
    setContent((current) => ({
      ...current,
      currentStageFocus:
        !current.currentStageFocus.trim() ||
        current.currentStageFocus === previousFocus
          ? nextFocus
          : current.currentStageFocus,
    }));
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

  function moveTimelineItemTo(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    setTimelineItems((current) => {
      const sourceIndex = current.findIndex((item) => item.id === sourceId);
      const targetIndex = current.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [item] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
    setDraggedTimelineItem(null);
    setIsDirty(true);
  }

  function addSchoolApplicationRow() {
    setSchoolApplications((current) => [
      ...current,
      {
        id: `school-row-custom-${Date.now()}`,
        values: Object.fromEntries(
          schoolApplicationColumns.map((column) => [column.id, ""]),
        ),
      },
    ]);
    setModules((current) => ({ ...current, schoolApplications: true }));
    setIsDirty(true);
  }

  function updateSchoolApplicationCell(
    rowId: string,
    columnId: string,
    value: string,
  ) {
    setSchoolApplications((current) =>
      current.map((row) =>
        row.id === rowId
          ? { ...row, values: { ...row.values, [columnId]: value } }
          : row,
      ),
    );
    setIsDirty(true);
  }

  function removeSchoolApplicationRow(rowId: string) {
    setSchoolApplications((current) => current.filter((row) => row.id !== rowId));
    setSchoolApplicationRowHeights((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
    setIsDirty(true);
  }

  function addSchoolApplicationColumn() {
    const id = `school-column-custom-${Date.now()}`;
    setSchoolApplicationColumns((current) => [
      ...current,
      { id, label: "新增字段" },
    ]);
    setSchoolApplications((current) =>
      current.map((row) => ({
        ...row,
        values: { ...row.values, [id]: "" },
      })),
    );
    setIsDirty(true);
  }

  function updateSchoolApplicationColumn(columnId: string, label: string) {
    setSchoolApplicationColumns((current) =>
      current.map((column) =>
        column.id === columnId ? { ...column, label } : column,
      ),
    );
    setIsDirty(true);
  }

  function removeSchoolApplicationColumn(columnId: string) {
    if (schoolApplicationColumns.length <= 1) return;
    setSchoolApplicationColumns((current) =>
      current.filter((column) => column.id !== columnId),
    );
    setSchoolApplications((current) =>
      current.map((row) => {
        const values = { ...row.values };
        delete values[columnId];
        return { ...row, values };
      }),
    );
    setSchoolApplicationColumnWidths((current) => {
      const next = { ...current };
      delete next[columnId];
      return next;
    });
    setIsDirty(true);
  }

  function beginSchoolApplicationColumnResize(
    columnId: string,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const header = event.currentTarget.closest("th");
    if (!(header instanceof HTMLElement)) return;
    const renderedScale = header.getBoundingClientRect().width / header.offsetWidth || 1;
    const startX = event.clientX;
    const startWidth = schoolApplicationColumnWidths[columnId] ?? header.offsetWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.max(
        64,
        Math.min(360, startWidth + (moveEvent.clientX - startX) / renderedScale),
      );
      setSchoolApplicationColumnWidths((current) => ({
        ...current,
        [columnId]: Math.round(nextWidth),
      }));
    };
    const stopResize = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      setIsDirty(true);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize, { once: true });
    window.addEventListener("pointercancel", stopResize, { once: true });
  }

  function beginSchoolApplicationRowResize(
    rowId: string,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const row = event.currentTarget.closest("tr");
    if (!(row instanceof HTMLElement)) return;
    const renderedScale = row.getBoundingClientRect().height / row.offsetHeight || 1;
    const startY = event.clientY;
    const startHeight = schoolApplicationRowHeights[rowId] ?? row.offsetHeight;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextHeight = Math.max(
        38,
        Math.min(280, startHeight + (moveEvent.clientY - startY) / renderedScale),
      );
      setSchoolApplicationRowHeights((current) => ({
        ...current,
        [rowId]: Math.round(nextHeight),
      }));
    };
    const stopResize = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      setIsDirty(true);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize, { once: true });
    window.addEventListener("pointercancel", stopResize, { once: true });
  }

  function resetSchoolApplicationTableSizing() {
    setSchoolApplicationColumnWidths({});
    setSchoolApplicationRowHeights({});
    setIsDirty(true);
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const removedAttachment = current.find((attachment) => attachment.id === id);
      if (
        removedAttachment?.previewUrl &&
        typeof URL !== "undefined" &&
        typeof URL.revokeObjectURL === "function"
      ) {
        URL.revokeObjectURL(removedAttachment.previewUrl);
      }
      const nextAttachments = current.filter((attachment) => attachment.id !== id);
      if (nextAttachments.length === 0) {
        setModules((currentModules) => ({ ...currentModules, attachments: false }));
      }
      return nextAttachments;
    });
    if (previewAttachmentId === id) setPreviewAttachmentId(null);
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
    const uploadedFiles = Array.from(files ?? []);
    const nextAttachments = filesToAttachments(uploadedFiles);
    if (nextAttachments.length === 0) return;
    setAttachments((current) => [...current, ...nextAttachments]);
    setModules((current) => ({ ...current, attachments: true }));
    uploadedFiles.forEach((file, index) => {
      if (
        nextAttachments[index]?.previewKind !== "text" ||
        typeof file.text !== "function"
      ) {
        return;
      }
      void file.text().then((text) => {
        setAttachments((current) =>
          current.map((attachment) =>
            attachment.id === nextAttachments[index].id
              ? { ...attachment, textContent: text }
              : attachment,
          ),
        );
      });
    });
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

  async function handleSpreadsheetUpload(files: FileList | null) {
    const uploadedFiles = Array.from(files ?? []);
    if (uploadedFiles.length === 0) return;
    setRecognitionStatus(
      `正在读取 Excel 表格：${uploadedFiles.map((file) => file.name).join("、")}...`,
    );
    const parsedFields: RecognizedField[] = [];
    const parsedSchoolTables: SchoolApplicationTable[] = [];

    for (const file of uploadedFiles) {
      if (!isSpreadsheetFile(file)) continue;
      try {
        const parsed = await parseSpreadsheetFile(file, content.studentName);
        parsedFields.push(...parsed.fields);
        if (parsed.schoolApplicationTable) {
          parsedSchoolTables.push(parsed.schoolApplicationTable);
        }
      } catch {
        setRecognitionStatus(
          `读取 Excel 表格失败：${file.name}。请确认文件为 xlsx、xls 或 csv。`,
        );
        setIsDirty(true);
        return;
      }
    }

    const schoolApplicationTable = mergeSchoolApplicationTables(parsedSchoolTables);
    if (parsedFields.length === 0 && !schoolApplicationTable) {
      setRecognitionStatus(
        `已上传 Excel 表格：${uploadedFiles.map((file) => file.name).join("、")}。未读取到可填充字段，请检查表头或字段列。`,
      );
      setIsDirty(true);
      return;
    }

    if (parsedFields.length > 0) {
      const nextFields = mergeRecognizedFields(recognizedFields, parsedFields);
      applyRecognizedFields(nextFields);
      const recognized = buildContentFromRecognizedFields(
        nextFields.filter(isReportRecognizedField),
      );
      setContent((current) => ({
        ...current,
        completedThisMonth: recognized.applicationProgress || current.completedThisMonth,
      }));
    }
    if (schoolApplicationTable) {
      setSchoolApplicationColumns(schoolApplicationTable.columns);
      setSchoolApplications(schoolApplicationTable.rows);
      setSchoolApplicationColumnWidths({});
      setSchoolApplicationRowHeights({});
      setModules((current) => ({ ...current, schoolApplications: true }));
    }
    setRecognitionStatus(
      `已读取 Excel 表格：${uploadedFiles.map((file) => file.name).join("、")}。已提取 ${parsedFields.length} 个字段${schoolApplicationTable ? `，并识别 ${schoolApplicationTable.rows.length} 条院校申请记录` : ""}。`,
    );
    setIsDirty(true);
  }

  async function handlePreviousReportUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setRecognitionStatus(`正在读取此前报告：${file.name}...`);

    const embeddedState = await readEmbeddedPreviousReportState(file);
    if (embeddedState) {
      const importedOrder = embeddedState.reportModuleOrder.filter((key) =>
        defaultReportModuleOrder.includes(key),
      );
      const completeOrder = [
        ...importedOrder,
        ...defaultReportModuleOrder.filter((key) => !importedOrder.includes(key)),
      ];
      const importedFields = parseAllRecognizedFields(
        [
          embeddedState.content.studentBasicInfo,
          embeddedState.content.materialCollectionStatus,
          embeddedState.content.recognizedApplicationStatus,
        ]
          .filter(Boolean)
          .join("\n"),
      ).filter(isReportRecognizedField);

      setApplicationType(embeddedState.applicationType);
      setContent((current) => ({
        ...current,
        ...embeddedState.content,
        additionalRecognizedFields: "",
      }));
      setTimelineItems(embeddedState.timelineItems);
      setTheme((current) => ({ ...current, ...embeddedState.theme }));
      setModules((current) => ({ ...current, ...embeddedState.modules }));
      setReportModuleOrder(completeOrder);
      setReportModuleWidths({
        ...defaultReportModuleWidths,
        ...embeddedState.reportModuleWidths,
      });
      setHighlightedModules((current) => ({
        ...current,
        ...embeddedState.highlightedModules,
      }));
      setTextFormatting((current) => ({
        ...current,
        ...embeddedState.textFormatting,
      }));
      setTextFormattingRanges((current) => ({
        ...current,
        ...embeddedState.textFormattingRanges,
      }));
      setSchoolApplicationColumns(
        embeddedState.schoolApplicationColumns?.length
          ? embeddedState.schoolApplicationColumns
          : defaultSchoolApplicationColumns,
      );
      setSchoolApplications(embeddedState.schoolApplications ?? []);
      setSchoolApplicationColumnWidths(
        embeddedState.schoolApplicationColumnWidths ?? {},
      );
      setSchoolApplicationRowHeights(
        embeddedState.schoolApplicationRowHeights ?? {},
      );
      setRecognizedFields(importedFields);
      setRecognitionStatus(
        `已读取此前报告：${file.name}。报告标题、已填内容、时间轴、院校申请和展示设置已回填。`,
      );
      setIsDirty(true);
      return;
    }

    let rawText = "";
    let legacyPdfReport: LegacyPdfExtraction | null = null;
    const isPdfReport =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImageReport =
      file.type.startsWith("image/") ||
      /\.(?:png|jpe?g|webp|bmp)$/i.test(file.name);
    let legacyPdfError = "";

    if (isPdfReport) {
      try {
        const { extractLegacyPdfReport } = await import(
          "@/features/monthly-reports/legacy-pdf-runtime"
        );
        legacyPdfReport = await extractLegacyPdfReport(file, (message) =>
          setRecognitionStatus(message),
        );
        rawText = legacyPdfReport.rawText;
      } catch (error) {
        legacyPdfError =
          error instanceof Error ? error.message : "PDF 文字识别未完成";
      }
    } else if (isImageReport) {
      try {
        const { extractLegacyImageReport } = await import(
          "@/features/monthly-reports/legacy-pdf-runtime"
        );
        legacyPdfReport = await extractLegacyImageReport(file, (message) =>
          setRecognitionStatus(message),
        );
        rawText = legacyPdfReport.rawText;
      } catch (error) {
        legacyPdfError =
          error instanceof Error ? error.message : "图片文字识别未完成";
      }
    } else if (shouldReadUploadedFileAsText(file)) {
      try {
        rawText = await file.text();
      } catch {
        rawText = "";
      }
    }

    if (!rawText.trim()) {
      setRecognitionStatus(
        isImageReport
          ? `无法读取此前报告图片：${file.name}。本地 OCR 未取得可回填文字${legacyPdfError ? `（${legacyPdfError}）` : ""}。`
          : isPdfReport
            ? `无法读取此前报告：${file.name}。旧版 PDF 文本层和图片识别均未取得可回填内容${legacyPdfError ? `（${legacyPdfError}）` : ""}。`
          : `无法读取此前报告：${file.name}。请上传 PDF、报告图片，或 txt、md、html、json 格式报告。`,
      );
      setIsDirty(true);
      return;
    }

    const restoredApplicationTypeValue =
      legacyPdfReport?.identity.applicationType ??
      extractLabeledValue(rawText, ["申请类型"]);
    const restoredApplicationType = APPLICATION_TYPE_OPTIONS.includes(
      restoredApplicationTypeValue as MonthlyReportApplicationType,
    )
      ? (restoredApplicationTypeValue as MonthlyReportApplicationType)
      : null;
    const previousContent = {
      title:
        legacyPdfReport?.identity.reportTitle ||
        extractLabeledValue(rawText, ["报告标题", "本次报告标题"]),
      departmentLabel:
        legacyPdfReport?.identity.departmentLabel ||
        extractLabeledValue(rawText, ["部门标签", "部门"]),
      studentBasicInfo:
        extractReportSection(rawText, "基础信息") ||
        extractReportSection(rawText, "学生基础信息"),
      materialCollectionStatus:
        extractReportSection(rawText, "材料收集") ||
        extractReportSection(rawText, "材料收集情况"),
      additionalRecognizedFields: "",
      recognizedApplicationStatus: "",
      completedThisMonth:
        legacyPdfReport?.imageAnalysis?.sectionContent.completedThisMonth ||
        (legacyPdfReport
          ? extractLegacyOcrSection(rawText, [
              "阶段性反馈",
              "本次阶段性进度",
              "本月完成情况",
            ])
          : "") ||
        extractReportSection(rawText, "阶段性反馈") ||
        extractReportSection(rawText, "本次阶段性进度") ||
        extractReportSection(rawText, "本月完成情况"),
      nextMonthPlan:
        legacyPdfReport?.imageAnalysis?.sectionContent.nextMonthPlan ||
        (legacyPdfReport
          ? extractLegacyOcrSection(rawText, ["下一阶段计划", "下月计划"])
          : "") ||
        extractReportSection(rawText, "下一阶段计划") ||
        extractReportSection(rawText, "下月计划"),
      currentStageFocus:
        legacyPdfReport?.imageAnalysis?.currentTimelineLabel ||
        extractReportSection(rawText, "当前阶段重点") ||
        extractReportSection(rawText, "本阶段重点"),
      nextStageFocus:
        extractReportSection(rawText, "下一步建议") ||
        extractReportSection(rawText, "下一阶段重点") ||
        extractReportSection(rawText, "当前阶段重点和下一步建议"),
      clientTasks:
        legacyPdfReport?.imageAnalysis?.sectionContent.clientTasks ||
        (legacyPdfReport
          ? extractLegacyOcrSection(rawText, [
              "需要学生/家庭配合",
              "学生/家庭待办",
            ])
          : "") ||
        extractReportSection(rawText, "学生/家庭待办") ||
        extractReportSection(rawText, "需要学生/家庭配合"),
      studentName:
        legacyPdfReport?.identity.studentName ||
        extractLabeledValue(rawText, ["学生姓名"]),
      season:
        legacyPdfReport?.identity.season ||
        extractLabeledValue(rawText, ["申请季度", "申请季"]),
      reportDate:
        legacyPdfReport?.identity.reportDate ||
        extractLabeledValue(rawText, ["报告日期"]),
    };
    const fieldsFromReport = parseAllRecognizedFields(
      [
        previousContent.studentBasicInfo,
        previousContent.materialCollectionStatus,
        previousContent.additionalRecognizedFields,
        previousContent.recognizedApplicationStatus,
        legacyPdfReport?.recoveredFieldText,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    const nextFields = mergeRecognizedFields(recognizedFields, fieldsFromReport);
    const reportFields = nextFields.filter(isReportRecognizedField);
    const recognized = buildContentFromRecognizedFields(reportFields);
    const restoredSchoolApplicationTable = legacyPdfReport
      ? schoolApplicationTableFromLegacyPdf(
          legacyPdfReport,
          previousContent.studentName,
        )
      : null;
    const restoredTimeline = restoredApplicationType
      ? buildTimelineFromLegacyReport(
          restoredApplicationType,
          rawText,
          previousContent.currentStageFocus,
        )
      : null;
    const inferredCurrentStage =
      restoredTimeline?.find((item) => item.status === "current")?.label ?? "";

    setRecognizedFields(reportFields);
    if (restoredApplicationType) {
      const restoredConfig = getMonthlyReportApplicationConfig(restoredApplicationType);
      setApplicationType(restoredApplicationType);
      setTheme(restoredConfig.theme);
      if (restoredTimeline) setTimelineItems(restoredTimeline);
    }
    if (restoredSchoolApplicationTable) {
      setSchoolApplicationColumns(restoredSchoolApplicationTable.columns);
      setSchoolApplications(restoredSchoolApplicationTable.rows);
      setSchoolApplicationColumnWidths({});
      setSchoolApplicationRowHeights({});
    }
    if (isImageReport && legacyPdfReport?.imageAnalysis) {
      const detectedSections = new Set(
        legacyPdfReport.imageAnalysis.detectedSections,
      );
      setModules((current) => ({
        ...current,
        stageFocus: detectedSections.has("stageFocus"),
        summary: detectedSections.has("summary"),
        timeline: detectedSections.has("timeline"),
        basicInfo: detectedSections.has("basicInfo"),
        materialCollection: detectedSections.has("materialCollection"),
        schoolApplications:
          detectedSections.has("schoolApplications") &&
          Boolean(restoredSchoolApplicationTable),
        completedThisMonth: detectedSections.has("completedThisMonth"),
        nextMonthPlan: detectedSections.has("nextMonthPlan"),
        clientTasks: detectedSections.has("clientTasks"),
        attachments: detectedSections.has("attachments"),
      }));
      const compactSections = new Set(
        legacyPdfReport.imageAnalysis.compactSections,
      );
      setReportModuleWidths((current) => {
        const next = { ...current };
        for (const section of legacyPdfReport.imageAnalysis?.detectedSections ?? []) {
          if (section in next) {
            next[section as ReportModuleKey] = compactSections.has(section)
              ? "compact"
              : "wide";
          }
        }
        return next;
      });
    } else {
      setModules((current) => ({
        ...current,
        basicInfo: Boolean(previousContent.studentBasicInfo) || current.basicInfo,
        materialCollection:
          Boolean(previousContent.materialCollectionStatus) || current.materialCollection,
        completedThisMonth:
          Boolean(previousContent.completedThisMonth) || current.completedThisMonth,
        nextMonthPlan: Boolean(previousContent.nextMonthPlan) || current.nextMonthPlan,
        clientTasks: Boolean(previousContent.clientTasks) || current.clientTasks,
        schoolApplications:
          Boolean(restoredSchoolApplicationTable) || current.schoolApplications,
      }));
    }
    setContent((current) => ({
      ...current,
      title: previousContent.title || current.title,
      departmentLabel:
        previousContent.departmentLabel ||
        (restoredApplicationType
          ? departmentLabelByApplicationType[restoredApplicationType]
          : current.departmentLabel),
      completedThisMonth:
        previousContent.completedThisMonth || current.completedThisMonth,
      completedThisMonthTitle:
        legacyPdfReport?.imageAnalysis?.sectionTitles.completedThisMonth ||
        current.completedThisMonthTitle,
      nextMonthPlan: previousContent.nextMonthPlan || current.nextMonthPlan,
      nextMonthPlanTitle:
        legacyPdfReport?.imageAnalysis?.sectionTitles.nextMonthPlan ||
        current.nextMonthPlanTitle,
      nextStageFocus: previousContent.nextStageFocus || current.nextStageFocus,
      clientTasks: previousContent.clientTasks || current.clientTasks,
      clientTasksTitle:
        legacyPdfReport?.imageAnalysis?.sectionTitles.clientTasks ||
        current.clientTasksTitle,
      recognizedApplicationStatus:
        recognized.recognizedApplicationStatus ||
        previousContent.recognizedApplicationStatus ||
        current.recognizedApplicationStatus,
      studentName:
        previousContent.studentName || recognized.studentName || current.studentName,
      season: previousContent.season || current.season,
      reportDate: previousContent.reportDate || current.reportDate,
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
      currentStageFocus:
        previousContent.currentStageFocus ||
        inferredCurrentStage ||
        current.currentStageFocus,
    }));
    setRecognitionStatus(
      legacyPdfReport
        ? `已读取${isImageReport ? "历史报告图片" : "旧版 PDF"}：${file.name}。通过${isImageReport ? legacyPdfReport.imageAnalysis ? "本地分区 OCR" : "本地 OCR" : legacyPdfReport.usedOcr ? "文本层和本地 OCR" : "PDF 文本层"}回填内容，提取 ${fieldsFromReport.length} 个字段${restoredSchoolApplicationTable ? `和 ${restoredSchoolApplicationTable.rows.length} 条院校申请记录` : ""}。${legacyPdfReport.ocrWarning ? `图片页识别未完成（${legacyPdfReport.ocrWarning}），` : ""}请在导出前快速核对回填内容。`
        : `已读取此前报告：${file.name}。已回填可识别内容，并提取 ${fieldsFromReport.length} 个可筛选字段。`,
    );
    setIsDirty(true);
  }

  function toggleModule(key: keyof ModuleVisibility) {
    const nextModules = { ...modules, [key]: !modules[key] };
    setModules(nextModules);
    if (key === "basicInfo" || key === "materialCollection") {
      if (nextModules.basicInfo && !nextModules.materialCollection) {
        setReportModuleWidths((widths) => ({ ...widths, basicInfo: "wide" }));
      } else if (!nextModules.basicInfo && nextModules.materialCollection) {
        setReportModuleWidths((widths) => ({
          ...widths,
          materialCollection: "wide",
        }));
      } else if (nextModules.basicInfo && nextModules.materialCollection) {
        setReportModuleWidths((widths) => ({
          ...widths,
          basicInfo: "compact",
          materialCollection: "wide",
        }));
      }
    }
    setIsDirty(true);
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

  function toggleReportModuleWidth(key: ReportModuleKey) {
    setReportModuleWidths((current) => ({
      ...current,
      [key]: current[key] === "compact" ? "wide" : "compact",
    }));
    setIsDirty(true);
  }

  function getTimelineColor(status: TimelineStatus) {
    if (status === "completed") return theme.timelineCompletedColor;
    if (status === "current") return theme.timelineCurrentColor;
    return theme.timelinePendingColor;
  }

  const attachmentNames = attachments.map((attachment) => attachment.name).join("、");
  const reportDateDisplay = formatReportDateForDisplay(content.reportDate);
  const completedThisMonthTitle =
    content.completedThisMonthTitle.trim() ||
    defaultEditableSectionTitles.completedThisMonth;
  const nextMonthPlanTitle =
    content.nextMonthPlanTitle.trim() || defaultEditableSectionTitles.nextMonthPlan;
  const clientTasksTitle =
    content.clientTasksTitle.trim() || defaultEditableSectionTitles.clientTasks;
  const exportBaseName = [
    content.studentName,
    applicationType,
    content.season,
    "反馈报告",
    reportDateDisplay,
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
  const materialKeyValueRows = parseKeyValueRows(content.materialCollectionStatus);
  const materialRows = parseMaterialRows(content.materialCollectionStatus);
  const studentInfoSourceRanges = locateKeyValueRowSourceRanges(
    content.studentBasicInfo,
    studentInfoRows,
  );
  const materialSourceRanges = locateKeyValueRowSourceRanges(
    content.materialCollectionStatus,
    materialKeyValueRows,
  );
  const metricSummary = buildMetricSummary(studentInfoRows, materialRows);
  const currentTimelineItem = getCurrentTimelineItem(timelineItems);
  const stageFocusTitle =
    content.stageFocusTitle.trim() || defaultEditableSectionTitles.stageFocus;
  const currentStageFocusTitle =
    content.currentStageFocusTitle.trim() || defaultStageFocusLabels.current;
  const currentStageFocusDisplay =
    content.currentStageFocus.trim() ||
    currentTimelineItem?.label ||
    emptySectionPlaceholder;
  const nextStageFocusTitle =
    content.nextStageFocusTitle.trim() || defaultStageFocusLabels.next;
  const summaryTitle =
    content.summaryTitle.trim() || defaultEditableSectionTitles.summary;
  const summaryMaterialTitle =
    content.summaryMaterialTitle.trim() || defaultSummaryLabels.material;
  const summaryMaterialValue =
    content.summaryMaterialValue.trim() || metricSummary.materialText;
  const summaryAcademicTitle =
    content.summaryAcademicTitle.trim() || defaultSummaryLabels.academic;
  const summaryAcademicValue =
    content.summaryAcademicValue.trim() || metricSummary.academicText;
  const summarySchoolTitle =
    content.summarySchoolTitle.trim() || defaultSummaryLabels.school;
  const summarySchoolValue =
    content.summarySchoolValue.trim() || metricSummary.school;
  const completedThisMonthDisplay = content.completedThisMonth.trim()
    ? content.completedThisMonth
    : emptySectionPlaceholder;
  const nextMonthPlanDisplay = content.nextMonthPlan.trim()
    ? content.nextMonthPlan
    : emptySectionPlaceholder;
  const clientTasksDisplay = content.clientTasks.trim()
    ? content.clientTasks
    : emptySectionPlaceholder;
  const completedThisMonthLineRanges = locateNonEmptyLineSourceRanges(
    content.completedThisMonth,
  );
  const nextMonthPlanLineRanges = locateNonEmptyLineSourceRanges(
    content.nextMonthPlan,
  );
  const clientTasksLineRanges = locateNonEmptyLineSourceRanges(
    content.clientTasks,
  );
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
  const completedTimelineCount = Math.min(
    timelineItems.length,
    timelineItems.filter((item) => item.status === "completed").length +
      (timelineItems.some((item) => item.status === "current") ? 1 : 0),
  );
  function toggleExportFormat(format: ExportFormat) {
    setExportFormats((current) => {
      const next = { ...current, [format]: !current[format] };
      if (!next.PDF && !next.PNG) return current;
      return next;
    });
  }

  function buildPreviousReportState(): PreviousReportStateV1 {
    return {
      version: 1,
      applicationType,
      content,
      timelineItems,
      theme,
      modules,
      reportModuleOrder,
      reportModuleWidths,
      highlightedModules,
      textFormatting,
      textFormattingRanges,
      schoolApplicationColumns,
      schoolApplications,
      schoolApplicationColumnWidths,
      schoolApplicationRowHeights,
    };
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
            .map((row, index) => {
              const sourceRange = studentInfoSourceRanges[index];
              const labelHtml =
                sourceRange?.labelStart >= 0
                  ? getStyledTextHtml(
                      "studentBasicInfo",
                      content.studentBasicInfo,
                      sourceRange.labelStart,
                      sourceRange.labelEnd,
                    )
                  : escapeHtml(row.label);
              const valueHtml =
                sourceRange?.valueStart >= 0
                  ? getStyledTextHtml(
                      "studentBasicInfo",
                      content.studentBasicInfo,
                      sourceRange.valueStart,
                      sourceRange.valueEnd,
                    )
                  : escapeHtml(row.value);
              return `<tr><th>${labelHtml}</th><td style="${getTextFormattingCss("studentBasicInfo")}">${valueHtml}</td></tr>`;
            })
            .join("")
        : `<tr><th>基础信息</th><td>${emptySectionPlaceholder}</td></tr>`;
    const materialRowsHtml =
      materialRows.length > 0
        ? materialRows
            .map((row, index) => {
              const style = statusStyles[row.status];
              const sourceRange = materialSourceRanges[index];
              const itemHtml =
                sourceRange?.labelStart >= 0
                  ? getStyledTextHtml(
                      "materialCollectionStatus",
                      content.materialCollectionStatus,
                      sourceRange.labelStart,
                      sourceRange.labelEnd,
                    )
                  : escapeHtml(row.item);
              const remarkHtml =
                sourceRange?.valueStart >= 0
                  ? getStyledTextHtml(
                      "materialCollectionStatus",
                      content.materialCollectionStatus,
                      sourceRange.valueStart,
                      sourceRange.valueEnd,
                    )
                  : escapeHtml(row.remark);
              return `<tr style="${getTextFormattingCss("materialCollectionStatus")}">
                <td>${itemHtml}</td>
                <td><span class="status-pill" style="background:${style.bg};color:${style.color}">${escapeHtml(row.statusLabel)}</span></td>
                <td>${remarkHtml}</td>
              </tr>`;
            })
            .join("")
        : `<tr><td>材料收集</td><td><span class="status-pill">${emptySectionPlaceholder}</span></td><td>${emptySectionPlaceholder}</td></tr>`;
    const schoolApplicationHeaderHtml = schoolApplicationColumns
      .map((column) => `<th>${escapeHtml(column.label)}</th>`)
      .join("");
    const schoolApplicationRowsHtml =
      schoolApplications.length > 0
        ? schoolApplications
            .map(
              (row) =>
                `<tr>${schoolApplicationColumns
                  .map(
                    (column) =>
                      `<td>${escapeHtml(row.values[column.id] || emptySectionPlaceholder)}</td>`,
                  )
                  .join("")}</tr>`,
            )
            .join("")
        : `<tr><td colspan="${schoolApplicationColumns.length}">${emptySectionPlaceholder}</td></tr>`;
    const attachmentHtml = escapeHtml(attachmentNames);
    const sectionClass = (key: ReportModuleKey) =>
      highlightedModules[key] ? "section-card highlighted" : "section-card";
    const renderReportModule = (key: ReportModuleKey) => {
      if (!modules[key]) return "";
      if (key === "stageFocus") {
        return `<section class="${sectionClass(key)}"><h2 class="section-title">${escapeHtml(stageFocusTitle)}</h2><div class="focus-grid"><div><h3>${escapeHtml(currentStageFocusTitle)}</h3><p>${escapeHtml(currentStageFocusDisplay)}</p></div><div><h3>${escapeHtml(nextStageFocusTitle)}</h3><p>${escapeHtml(content.nextStageFocus)}</p></div></div></section>`;
      }
      if (key === "summary") {
        return `<section class="${sectionClass(key)}" aria-label="${escapeHtml(summaryTitle)}"><h2 class="section-title">${escapeHtml(summaryTitle)}</h2><div class="metrics"><div class="metric">${escapeHtml(summaryMaterialTitle)}<strong>${escapeHtml(summaryMaterialValue)}</strong><div class="progress"><span style="width:${metricSummary.materialPercent}%"></span></div></div><div class="metric">${escapeHtml(summaryAcademicTitle)}<strong>${escapeHtml(summaryAcademicValue)}</strong></div><div class="metric">${escapeHtml(summarySchoolTitle)}<strong>${escapeHtml(summarySchoolValue)}</strong></div></div></section>`;
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
      if (key === "schoolApplications") {
        return `<section class="${sectionClass(key)}"><h2 class="section-title">院校申请</h2><table><thead><tr>${schoolApplicationHeaderHtml}</tr></thead><tbody>${schoolApplicationRowsHtml}</tbody></table></section>`;
      }
      if (key === "completedThisMonth") {
        return `<section class="${sectionClass(key)}"><h2 class="section-title">${escapeHtml(completedThisMonthTitle)}</h2><p style="${getTextFormattingCss("completedThisMonth")}">${content.completedThisMonth.trim() ? getStyledTextHtml("completedThisMonth", content.completedThisMonth) : escapeHtml(emptySectionPlaceholder)}</p></section>`;
      }
      if (key === "nextMonthPlan") {
        const planLinesHtml =
          nextMonthPlanLineRanges.length > 0
            ? nextMonthPlanLineRanges
                .map(
                  (line) =>
                    `<p>${getStyledTextHtml("nextMonthPlan", content.nextMonthPlan, line.start, line.end)}</p>`,
                )
                .join("")
            : `<p>${escapeHtml(emptySectionPlaceholder)}</p>`;
        return `<section class="${sectionClass(key)}"><h2 class="section-title">${escapeHtml(nextMonthPlanTitle)}</h2><div class="plain-lines" style="${getTextFormattingCss("nextMonthPlan")}">${planLinesHtml}</div></section>`;
      }
      if (key === "clientTasks") {
        return `<section class="${sectionClass(key)}"><h2 class="section-title">${escapeHtml(clientTasksTitle)}</h2><p style="${getTextFormattingCss("clientTasks")}">${content.clientTasks.trim() ? getStyledTextHtml("clientTasks", content.clientTasks) : escapeHtml(emptySectionPlaceholder)}</p></section>`;
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
.section-card.highlighted{background:${theme.secondarySoftColor};border-color:${theme.accentColor};border-left:5px solid ${theme.accentColor};box-shadow:0 12px 28px rgba(15,23,42,.10)}
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
.plain-lines p{margin:0;font-size:12px;line-height:1.8;white-space:pre-line}
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
<span>报告日期：${escapeHtml(reportDateDisplay)}</span>
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
    const a4PageHeight = Math.floor((canvasWidth * 841.89) / 595.28);
    const heroY = 198;
    const pageX = 70;
    const pageY = 70;
    const pageWidth = canvasWidth - 140;
    const contentX = 110;
    const contentWidth = canvasWidth - 220;
    const shouldPairInformationSections = modules.basicInfo && modules.materialCollection;
    const measurementContext = document.createElement("canvas").getContext("2d");
    const fallbackSegments = (field: TextFormattingKey, text: string) => [
      { text, formatting: textFormatting[field] },
    ];
    const getSourceSegments = (
      field: TextFormattingKey,
      sourceText: string,
      start: number,
      end: number,
      fallbackText: string,
    ) =>
      start >= 0
        ? getStyledSegments(field, sourceText, start, end)
        : fallbackSegments(field, fallbackText);
    const estimateWrappedLines = (text: string, charactersPerLine: number) =>
      splitReportLines(text).reduce(
        (total, line) => total + Math.max(1, Math.ceil(line.length / charactersPerLine)),
        0,
      ) || 1;
    const estimateBasicRowHeight = (
      row: KeyValueRow,
      compact: boolean,
      index: number,
    ) => {
      if (!measurementContext) return compact ? 24 : 30;
      const pairGap = 20;
      const cardWidth = shouldPairInformationSections
        ? (contentWidth - pairGap) / 2
        : contentWidth;
      const narrowCard = cardWidth < 700;
      const labelWidth = narrowCard ? 126 : 172;
      const fontSize = compact ? 13 : narrowCard ? 15 : 17;
      const sourceRange = studentInfoSourceRanges[index];
      const labelSegments = getSourceSegments(
        "studentBasicInfo",
        content.studentBasicInfo,
        sourceRange?.labelStart ?? -1,
        sourceRange?.labelEnd ?? -1,
        row.label,
      );
      const valueSegments = getSourceSegments(
        "studentBasicInfo",
        content.studentBasicInfo,
        sourceRange?.valueStart ?? -1,
        sourceRange?.valueEnd ?? -1,
        row.value,
      );
      const labelLines = measureWrappedStyledTextLines(
        measurementContext,
        labelSegments,
        labelWidth - 18,
        fontSize,
      );
      const valueLines = measureWrappedStyledTextLines(
        measurementContext,
        valueSegments,
        cardWidth - labelWidth - 18,
        fontSize,
      );
      return Math.max(compact ? 24 : 30, Math.max(labelLines, valueLines) * 20 + 4);
    };
    const estimateMaterialRowHeight = (
      row: MaterialReportRow,
      compact: boolean,
    ) => {
      const itemLines = estimateWrappedLines(row.item, compact ? 14 : 26);
      const remarkLines = estimateWrappedLines(row.remark, compact ? 10 : 20);
      return Math.max(
        compact ? 24 : 28,
        Math.max(itemLines, remarkLines) * (compact ? 17 : 20) + 6,
      );
    };
    const estimateCardHeight = (key: ReportModuleKey, compact = false) => {
      if (!modules[key]) return 0;
      if (key === "attachments" && !attachmentNames) return 0;
      if (key === "stageFocus") {
        if (compact) {
          return Math.max(
            112,
            70 + estimateWrappedLines(content.nextStageFocus, 44) * 20,
          );
        }
        return Math.max(150, 90 + estimateWrappedLines(content.nextStageFocus, 38) * 23);
      }
      if (key === "summary") return compact ? 116 : 150;
      if (key === "timeline") {
        const rows = Math.max(1, Math.ceil(timelineItems.length / 5));
        return compact ? 48 + rows * 62 : 62 + rows * 88;
      }
      if (key === "basicInfo") {
        const rows =
          studentInfoRows.length > 0
            ? studentInfoRows
            : [{ label: "基础信息", value: emptySectionPlaceholder }];
        return (
          (compact ? 58 : 62) +
          rows.reduce(
            (height, row, index) =>
              height + estimateBasicRowHeight(row, compact, index),
            0,
          )
        );
      }
      if (key === "materialCollection") {
        const rows =
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
        return (
          (compact ? 70 : 92) +
          rows.reduce(
            (height, row) => height + estimateMaterialRowHeight(row, compact),
            0,
          )
        );
      }
      if (key === "completedThisMonth") {
        return compact
          ? Math.max(90, 54 + estimateWrappedLines(completedThisMonthDisplay, 70) * 21)
          : Math.max(136, 72 + estimateWrappedLines(completedThisMonthDisplay, 62) * 25);
      }
      if (key === "nextMonthPlan") {
        return compact
          ? Math.max(90, 54 + estimateWrappedLines(nextMonthPlanDisplay, 70) * 21)
          : Math.max(136, 72 + estimateWrappedLines(nextMonthPlanDisplay, 62) * 25);
      }
      if (key === "clientTasks") {
        return compact
          ? Math.max(90, 54 + estimateWrappedLines(clientTasksDisplay, 70) * 21)
          : Math.max(122, 72 + estimateWrappedLines(clientTasksDisplay, 62) * 25);
      }
      return compact
        ? Math.max(82, 54 + estimateWrappedLines(attachmentNames, 70) * 21)
        : Math.max(96, 72 + estimateWrappedLines(attachmentNames, 62) * 25);
    };
    const estimateModulesHeight = (compact: boolean, gap: number) => {
      let estimatedInformationPair = false;
      return reportModuleOrder.reduce((total, key) => {
        if (
          shouldPairInformationSections &&
          (key === "basicInfo" || key === "materialCollection")
        ) {
          if (estimatedInformationPair) return total;
          estimatedInformationPair = true;
          return (
            total +
            Math.max(
              estimateCardHeight("basicInfo", compact),
              estimateCardHeight("materialCollection", compact),
            ) +
            gap
          );
        }
        const height = estimateCardHeight(key, compact);
        return total + (height > 0 ? height + gap : 0);
      }, 0);
    };
    const normalHeroHeight = 238;
    const normalContentEnd =
      heroY + normalHeroHeight + 42 + estimateModulesHeight(false, 24);
    const useCompactExport = normalContentEnd > a4PageHeight - 70;
    const heroHeight = useCompactExport ? 184 : normalHeroHeight;
    const cardGap = useCompactExport ? 14 : 24;
    const initialContentY = heroY + heroHeight + (useCompactExport ? 24 : 42);
    const estimatedContentEnd =
      initialContentY + estimateModulesHeight(useCompactExport, cardGap);
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = Math.max(
      a4PageHeight,
      Math.ceil(estimatedContentEnd + (useCompactExport ? 50 : 90)),
    );
    const context = canvas.getContext("2d");
    if (!context) {
      return new Blob([buildReportHtml()], { type: "text/html;charset=utf-8" });
    }
    const canvasContext = context;

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

    function setCanvasSectionTitleFont(text: string) {
      let fontSize = useCompactExport ? 18 : 21;
      const minimumFontSize = useCompactExport ? 13 : 15;
      do {
        canvasContext.font = `bold ${fontSize}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
        if (canvasContext.measureText(text).width <= contentWidth - 36) return;
        fontSize -= 1;
      } while (fontSize >= minimumFontSize);
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
    context.font = `bold ${useCompactExport ? 15 : 18}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    context.fillText(
      "Application Progress Report",
      contentX + 32,
      heroY + (useCompactExport ? 36 : 46),
    );
    context.fillStyle = "#ffffff";
    context.font = `bold ${useCompactExport ? 36 : 42}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    context.fillText(
      reportTitle,
      contentX + 32,
      heroY + (useCompactExport ? 82 : 102),
    );
    context.font = `${useCompactExport ? 18 : 22}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    const metaText = [
      modules.studentName ? `学生姓名：${content.studentName}` : "",
      modules.season ? `申请季度：${content.season}` : "",
      modules.applicationType ? `申请类型：${applicationType}` : "",
      `报告日期：${reportDateDisplay}`,
    ]
      .filter(Boolean)
      .join("   ");
    context.fillText(
      metaText,
      contentX + 32,
      heroY + (useCompactExport ? 126 : 148),
    );

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
      y += height + cardGap;
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
      const titleY = cardY + (useCompactExport ? 30 : 36);
      const firstRowY = cardY + (useCompactExport ? 58 : 76);
      const rowStride = useCompactExport ? 24 : 30;
      canvasContext.fillStyle = theme.titleColor;
      canvasContext.font = `bold ${useCompactExport ? 19 : compact ? 21 : 23}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      canvasContext.fillText("基础信息", cardX + 18, titleY);
      let rowY = firstRowY;
      basicInfoRows.forEach((row, index) => {
        const sourceRange = studentInfoSourceRanges[index];
        canvasContext.fillStyle = theme.mutedTextColor;
        canvasContext.font = `${useCompactExport ? 13 : compact ? 15 : 17}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
        drawWrappedText(
          canvasContext,
          row.label,
          cardX + 18,
          rowY,
          labelWidth - 18,
          20,
        );
        drawWrappedStyledText(
          canvasContext,
          getSourceSegments(
            "studentBasicInfo",
            content.studentBasicInfo,
            sourceRange?.valueStart ?? -1,
            sourceRange?.valueEnd ?? -1,
            row.value,
          ),
          cardX + labelWidth,
          rowY,
          cardWidth - labelWidth - 18,
          20,
          useCompactExport ? 13 : compact ? 15 : 17,
        );
        rowY += Math.max(
          rowStride,
          estimateBasicRowHeight(row, useCompactExport, index),
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
      const titleY = cardY + (useCompactExport ? 30 : 36);
      const headerY = cardY + (useCompactExport ? 54 : 70);
      const firstRowY = cardY + (useCompactExport ? 78 : 102);
      const rowStride = useCompactExport ? 24 : 28;
      canvasContext.fillStyle = theme.titleColor;
      canvasContext.font = `bold ${useCompactExport ? 19 : compact ? 21 : 23}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      canvasContext.fillText("材料收集", cardX + 18, titleY);
      canvasContext.fillStyle = theme.mutedTextColor;
      canvasContext.font = `bold ${useCompactExport ? 12 : compact ? 14 : 16}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      canvasContext.fillText("材料项目", itemX, headerY);
      canvasContext.fillText("状态", statusX, headerY);
      canvasContext.fillText("备注", remarkX, headerY);
      let rowY = firstRowY;
      collectionRows.forEach((row, index) => {
        const sourceRange = materialSourceRanges[index];
        drawWrappedStyledText(
          canvasContext,
          getSourceSegments(
            "materialCollectionStatus",
            content.materialCollectionStatus,
            sourceRange?.labelStart ?? -1,
            sourceRange?.labelEnd ?? -1,
            row.item,
          ),
          itemX,
          rowY,
          statusX - itemX - 10,
          19,
          useCompactExport ? 12 : compact ? 14 : 16,
        );
        const statusStyle = statusStyles[row.status];
        const statusFontSize = useCompactExport ? 11 : compact ? 13 : 15;
        canvasContext.font = `bold ${statusFontSize}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
        const pillHeight = useCompactExport ? 18 : 22;
        const pillWidth = Math.min(
          remarkX - statusX - 8,
          canvasContext.measureText(row.statusLabel).width +
            (useCompactExport ? 14 : 18),
        );
        drawRoundedBox(
          statusX - 4,
          rowY - pillHeight + 4,
          pillWidth,
          pillHeight,
          statusStyle.bg,
          statusStyle.bg,
          pillHeight / 2,
        );
        canvasContext.fillStyle = statusStyle.color;
        canvasContext.font = `bold ${statusFontSize}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
        canvasContext.fillText(row.statusLabel, statusX, rowY);
        drawWrappedStyledText(
          canvasContext,
          getSourceSegments(
            "materialCollectionStatus",
            content.materialCollectionStatus,
            sourceRange?.valueStart ?? -1,
            sourceRange?.valueEnd ?? -1,
            row.remark,
          ),
          remarkX,
          rowY,
          cardX + cardWidth - remarkX - 18,
          19,
          useCompactExport ? 11 : compact ? 13 : 15,
        );
        rowY += Math.max(
          rowStride,
          estimateMaterialRowHeight(row, useCompactExport),
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
          estimateCardHeight("basicInfo", useCompactExport),
          estimateCardHeight("materialCollection", useCompactExport),
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
        drawReportCard(key, estimateCardHeight(key, useCompactExport), (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = `bold ${useCompactExport ? 20 : 24}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
          context.fillText(
            stageFocusTitle,
            contentX + 18,
            cardY + (useCompactExport ? 30 : 36),
          );
          context.font = `bold ${useCompactExport ? 15 : 18}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
          context.fillText(
            currentStageFocusTitle,
            contentX + 18,
            cardY + (useCompactExport ? 60 : 78),
          );
          context.fillText(
            nextStageFocusTitle,
            contentX + contentWidth / 2 + 12,
            cardY + (useCompactExport ? 60 : 78),
          );
          context.fillStyle = theme.textColor;
          context.font = `${useCompactExport ? 14 : 17}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
          drawWrappedText(
            context,
            currentStageFocusDisplay,
            contentX + 18,
            cardY + (useCompactExport ? 82 : 106),
            contentWidth / 2 - 36,
            useCompactExport ? 20 : 23,
          );
          drawWrappedText(
            context,
            content.nextStageFocus,
            contentX + contentWidth / 2 + 12,
            cardY + (useCompactExport ? 82 : 106),
            contentWidth / 2 - 36,
            useCompactExport ? 20 : 23,
          );
        });
      }

      if (key === "summary") {
        drawReportCard(key, estimateCardHeight(key, useCompactExport), (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = `bold ${useCompactExport ? 20 : 24}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
          context.fillText(
            summaryTitle,
            contentX + 18,
            cardY + (useCompactExport ? 30 : 36),
          );
          const metricWidth = (contentWidth - 60) / 3;
          [
            [summaryMaterialTitle, summaryMaterialValue],
            [summaryAcademicTitle, summaryAcademicValue],
            [summarySchoolTitle, summarySchoolValue],
          ].forEach(([label, value], index) => {
            const x = contentX + 18 + index * (metricWidth + 12);
            const metricY = cardY + (useCompactExport ? 42 : 58);
            drawRoundedBox(
              x,
              metricY,
              metricWidth,
              useCompactExport ? 60 : 74,
              index === 0 ? theme.primarySoftColor : "#ffffff",
              "#e2e8f0",
              12,
            );
            context.fillStyle = theme.mutedTextColor;
            context.font = `${useCompactExport ? 13 : 16}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
            context.fillText(label, x + 14, metricY + (useCompactExport ? 21 : 26));
            context.fillStyle = theme.titleColor;
            context.font = `bold ${useCompactExport ? 18 : 21}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
            drawWrappedText(
              context,
              value,
              x + 14,
              metricY + (useCompactExport ? 45 : 54),
              metricWidth - 28,
              useCompactExport ? 20 : 24,
            );
          });
        });
      }

      if (key === "timeline") {
        const timelineColumns = 5;
        const timelineRows = Math.max(1, Math.ceil(timelineItems.length / timelineColumns));
        const timelineHeight = useCompactExport
          ? 48 + timelineRows * 62
          : 62 + timelineRows * 88;
        drawReportCard(key, timelineHeight, (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = `bold ${useCompactExport ? 20 : 24}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
          context.fillText(
            config.moduleTitles.timeline,
            contentX + 18,
            cardY + (useCompactExport ? 30 : 36),
          );
          const timelineBoxWidth = (contentWidth - 68) / timelineColumns;
          timelineItems.forEach((item, index) => {
            const x = contentX + 18 + (index % timelineColumns) * (timelineBoxWidth + 8);
            const itemY =
              cardY +
              (useCompactExport ? 42 : 56) +
              Math.floor(index / timelineColumns) * (useCompactExport ? 62 : 88);
            drawRoundedBox(
              x,
              itemY,
              timelineBoxWidth,
              useCompactExport ? 52 : 70,
              item.status === "current" ? theme.primarySoftColor : "#f8fafc",
              item.status === "current" ? theme.primaryColor : "#e2e8f0",
              12,
            );
            if (item.note.trim()) {
              drawRoundedBox(
                x + 10,
                itemY + (useCompactExport ? 5 : 8),
                timelineBoxWidth - 20,
                useCompactExport ? 15 : 18,
                theme.secondarySoftColor,
                theme.secondarySoftColor,
                useCompactExport ? 7.5 : 9,
              );
              context.fillStyle = theme.accentColor;
              context.font = `bold ${useCompactExport ? 9 : 11}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
              drawWrappedText(
                context,
                item.note,
                x + 14,
                itemY + (useCompactExport ? 16 : 21),
                timelineBoxWidth - 28,
                useCompactExport ? 11 : 14,
              );
            }
            context.fillStyle = getTimelineColor(item.status);
            context.beginPath();
            context.arc(
              x + (useCompactExport ? 15 : 18),
              itemY +
                (item.note.trim()
                  ? useCompactExport
                    ? 31
                    : 40
                  : useCompactExport
                    ? 16
                    : 20),
              useCompactExport ? 4.5 : 6,
              0,
              Math.PI * 2,
            );
            context.fill();
            context.fillStyle = theme.textColor;
            context.font = `${useCompactExport ? 13 : 16}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
            drawWrappedText(
              context,
              item.label,
              x + (useCompactExport ? 27 : 34),
              itemY +
                (item.note.trim()
                  ? useCompactExport
                    ? 33
                    : 42
                  : useCompactExport
                    ? 18
                    : 22),
              timelineBoxWidth - (useCompactExport ? 35 : 44),
              useCompactExport ? 16 : 20,
            );
          });
        });
      }

      if (key === "basicInfo") {
        drawReportCard(key, estimateCardHeight(key, useCompactExport), (cardY) => {
          drawBasicInfoContent(cardY, contentX, contentWidth);
        });
      }

      if (key === "materialCollection") {
        drawReportCard(key, estimateCardHeight(key, useCompactExport), (cardY) => {
          drawMaterialCollectionContent(cardY, contentX, contentWidth);
        });
      }

      if (key === "completedThisMonth") {
        drawReportCard(key, estimateCardHeight(key, useCompactExport), (cardY) => {
          context.fillStyle = theme.titleColor;
          setCanvasSectionTitleFont(completedThisMonthTitle);
          context.fillText(
            completedThisMonthTitle,
            contentX + 18,
            cardY + (useCompactExport ? 30 : 34),
          );
          drawWrappedStyledText(
            context,
            content.completedThisMonth.trim()
              ? getStyledSegments("completedThisMonth", content.completedThisMonth)
              : fallbackSegments("completedThisMonth", emptySectionPlaceholder),
            contentX + 18,
            cardY + (useCompactExport ? 54 : 68),
            contentWidth - 36,
            useCompactExport ? 21 : 25,
            useCompactExport ? 14 : 17,
          );
        });
      }

      if (key === "nextMonthPlan") {
        drawReportCard(key, estimateCardHeight(key, useCompactExport), (cardY) => {
          context.fillStyle = theme.titleColor;
          setCanvasSectionTitleFont(nextMonthPlanTitle);
          context.fillText(
            nextMonthPlanTitle,
            contentX + 18,
            cardY + (useCompactExport ? 30 : 34),
          );
          drawWrappedStyledText(
            context,
            content.nextMonthPlan.trim()
              ? getStyledSegments("nextMonthPlan", content.nextMonthPlan)
              : fallbackSegments("nextMonthPlan", emptySectionPlaceholder),
            contentX + 18,
            cardY + (useCompactExport ? 54 : 68),
            contentWidth - 36,
            useCompactExport ? 21 : 25,
            useCompactExport ? 14 : 17,
          );
        });
      }

      if (key === "clientTasks") {
        drawReportCard(key, estimateCardHeight(key, useCompactExport), (cardY) => {
          context.fillStyle = theme.titleColor;
          setCanvasSectionTitleFont(clientTasksTitle);
          context.fillText(
            clientTasksTitle,
            contentX + 18,
            cardY + (useCompactExport ? 30 : 34),
          );
          drawWrappedStyledText(
            context,
            content.clientTasks.trim()
              ? getStyledSegments("clientTasks", content.clientTasks)
              : fallbackSegments("clientTasks", emptySectionPlaceholder),
            contentX + 18,
            cardY + (useCompactExport ? 54 : 68),
            contentWidth - 36,
            useCompactExport ? 21 : 25,
            useCompactExport ? 14 : 17,
          );
        });
      }

      if (key === "attachments") {
        drawReportCard(key, estimateCardHeight(key, useCompactExport), (cardY) => {
          context.fillStyle = theme.titleColor;
          context.font = `bold ${useCompactExport ? 18 : 21}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
          context.fillText(
            "附件",
            contentX + 18,
            cardY + (useCompactExport ? 30 : 34),
          );
          context.fillStyle = theme.textColor;
          context.font = `${useCompactExport ? 14 : 17}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
          drawWrappedText(
            context,
            `本次报告附件：${attachmentNames}`,
            contentX + 18,
            cardY + (useCompactExport ? 54 : 68),
            contentWidth - 36,
            useCompactExport ? 21 : 25,
          );
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

  function getReportPdfLayout(): ReportPdfLayout | null {
    const reportNode = exportReportRef.current;
    if (!reportNode) return null;
    const reportRect = reportNode.getBoundingClientRect();
    const runningHeader = reportNode.querySelector<HTMLElement>(
      "[data-report-running-header='true']",
    );
    const reportHeader = reportNode.querySelector<HTMLElement>(
      "[data-report-header='true']",
    );
    const rail = reportNode.querySelector<HTMLElement>("[data-report-rail='true']");
    const main = reportNode.querySelector<HTMLElement>("[data-report-main='true']");
    if (!runningHeader || !reportHeader || !rail || !main) return null;

    const runningHeaderRect = runningHeader.getBoundingClientRect();
    const reportHeaderRect = reportHeader.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const schoolApplicationSection = reportNode.querySelector<HTMLElement>(
      "[data-report-placement='main'][data-report-module='schoolApplications']",
    );
    const schoolApplicationRows = schoolApplicationSection
      ? Array.from(
          schoolApplicationSection.querySelectorAll<HTMLElement>(
            "[data-report-school-application-row='true']",
          ),
        )
      : [];
    const firstSchoolApplicationRow = schoolApplicationRows[0];
    const lastSchoolApplicationRow = schoolApplicationRows.at(-1);
    const schoolApplicationSectionRect =
      schoolApplicationSection?.getBoundingClientRect();
    const firstSchoolApplicationRowRect =
      firstSchoolApplicationRow?.getBoundingClientRect();
    const lastSchoolApplicationRowRect =
      lastSchoolApplicationRow?.getBoundingClientRect();
    const repeatHeaderHeight = Math.max(
      112,
      Math.round(
        Math.max(runningHeaderRect.bottom, reportHeaderRect.bottom) -
          reportRect.top +
          8,
      ),
    );
    const continuationContentTop = repeatHeaderHeight + 12;
    const bottomMargin = 56;
    const moduleBreakPositions = Array.from(
      reportNode.querySelectorAll<HTMLElement>(
        "[data-report-placement='main'][data-report-module]",
      ),
    ).map((element) =>
      Math.max(0, Math.round(element.getBoundingClientRect().top - reportRect.top)),
    );
    const schoolApplicationRowBreakPositions = schoolApplicationRows.map(
      (row) =>
        Math.max(
          0,
          Math.round(row.getBoundingClientRect().top - reportRect.top),
        ),
    );
    if (lastSchoolApplicationRowRect) {
      schoolApplicationRowBreakPositions.push(
        Math.max(
          0,
          Math.round(lastSchoolApplicationRowRect.bottom - reportRect.top),
        ),
      );
    }
    const breakPositions = [
      ...moduleBreakPositions,
      ...schoolApplicationRowBreakPositions,
    ];
    const schoolApplicationRepeatStart = schoolApplicationSectionRect
      ? Math.max(
          0,
          Math.round(schoolApplicationSectionRect.top - reportRect.top),
        )
      : 0;
    const schoolApplicationContentStart = firstSchoolApplicationRowRect
      ? Math.max(
          0,
          Math.round(firstSchoolApplicationRowRect.top - reportRect.top),
        )
      : 0;
    const schoolApplicationContentEnd = lastSchoolApplicationRowRect
      ? Math.max(
          0,
          Math.round(lastSchoolApplicationRowRect.bottom - reportRect.top),
        )
      : 0;
    const schoolApplicationRepeatHeight =
      schoolApplicationContentStart > schoolApplicationRepeatStart
        ? schoolApplicationContentStart - schoolApplicationRepeatStart
        : 0;

    return {
      breakPositions,
      repeatHeaderHeight,
      continuationContentTop,
      bottomMargin,
      railX: Math.round(railRect.left - reportRect.left),
      railWidth: Math.round(railRect.width),
      mainX: Math.round(mainRect.left - reportRect.left),
      mainWidth: Math.round(mainRect.width),
      reportWidth: Math.round(reportRect.width),
      schoolApplicationContentEnd,
      schoolApplicationContentStart,
      schoolApplicationRepeatHeight,
      schoolApplicationRepeatStart,
    };
  }

  async function buildExportBlob(format: ExportFormat) {
    if (format === "PNG") {
      return embedPngReportState(
        await renderReportDomPngBlob(),
        serializePreviousReportState(buildPreviousReportState()),
      );
    }

    const pngBlob = await renderReportDomPngBlob();
    if (pngBlob.type !== "image/png") {
      return new Blob([buildReportHtml()], { type: "application/pdf" });
    }

    const pdfLayout = getReportPdfLayout();
    const { PDFDocument } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    pdf.setTitle(reportTitle);
    pdf.setCreator("新东方申请阶段反馈报告生成工具");
    pdf.setProducer("新东方申请阶段反馈报告生成工具");
    pdf.setKeywords(["monthly-report", "recoverable-report-state-v1"]);
    pdf.setSubject(serializePreviousReportState(buildPreviousReportState()));
    const sourceImage = await loadBlobImage(pngBlob);
    const sourceWidth = sourceImage.naturalWidth || sourceImage.width;
    const sourceHeight = sourceImage.naturalHeight || sourceImage.height;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const scale = pageWidth / sourceWidth;
    const sourcePageHeight = pageHeight / scale;
    const coordinateScale = pdfLayout
      ? sourceWidth / Math.max(1, pdfLayout.reportWidth)
      : 1;
    const continuationLogo = await new Promise<HTMLImageElement | null>((resolve) => {
      const logo = new Image();
      logo.onload = () => resolve(logo);
      logo.onerror = () => resolve(null);
      logo.src = companyLogoSrc;
    });
    const drawContinuationHeader = (
      context: CanvasRenderingContext2D,
      headerHeight: number,
    ) => {
      const unit = coordinateScale;
      context.save();
      context.fillStyle = theme.cardColor;
      context.fillRect(0, 0, sourceWidth, headerHeight);

      if (continuationLogo) {
        context.drawImage(
          continuationLogo,
          58 * unit,
          46 * unit,
          152 * unit,
          52 * unit,
        );
      } else {
        context.fillStyle = theme.timelineCompletedColor;
        context.font = `bold ${34 * unit}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
        context.fillText("新东方", 58 * unit, 86 * unit);
      }

      context.textBaseline = "alphabetic";
      context.fillStyle = theme.textColor;
      context.font = `${19 * unit}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      context.fillText(content.departmentLabel, 255 * unit, 79 * unit);

      context.font = `bold ${16 * unit}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      const badges: Array<{ fill: string; color: string; text: string }> = [];
      if (modules.season) {
        badges.push({
          fill: theme.secondarySoftColor,
          color: theme.accentColor,
          text: content.season,
        });
      }
      if (modules.applicationType) {
        badges.push({
          fill: theme.primarySoftColor,
          color: theme.primaryColor,
          text: applicationType,
        });
      }
      let badgeRight = sourceWidth - 58 * unit;
      for (const badge of [...badges].reverse()) {
        const badgeWidth = Math.max(
          88 * unit,
          context.measureText(badge.text).width + 40 * unit,
        );
        const badgeX = badgeRight - badgeWidth;
        context.fillStyle = badge.fill;
        context.beginPath();
        context.roundRect(badgeX, 46 * unit, badgeWidth, 40 * unit, 20 * unit);
        context.fill();
        context.fillStyle = badge.color;
        context.textAlign = "center";
        context.fillText(badge.text, badgeX + badgeWidth / 2, 72 * unit);
        badgeRight = badgeX - 12 * unit;
      }

      context.textAlign = "left";
      context.fillStyle = theme.titleColor;
      context.font = `bold ${40 * unit}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      drawWrappedText(
        context,
        reportTitle,
        58 * unit,
        181 * unit,
        sourceWidth - 116 * unit,
        47 * unit,
      );

      const metadata = [
        modules.studentName ? `学生姓名：${content.studentName}` : "",
        modules.season ? `申请季度：${content.season}` : "",
        modules.applicationType ? `申请类型：${applicationType}` : "",
        `报告日期：${reportDateDisplay}`,
      ].filter(Boolean);
      context.fillStyle = theme.textColor;
      context.font = `${18 * unit}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      context.fillText(metadata.join("    "), 58 * unit, 236 * unit);
      context.restore();
    };
    const repeatHeaderHeight =
      (pdfLayout?.repeatHeaderHeight ?? 0) * coordinateScale;
    const continuationContentTop =
      (pdfLayout?.continuationContentTop ?? 0) * coordinateScale;
    const bottomMargin = (pdfLayout?.bottomMargin ?? 0) * coordinateScale;
    const schoolApplicationRepeatHeight =
      (pdfLayout?.schoolApplicationRepeatHeight ?? 0) * coordinateScale;
    const schoolApplicationRepeatStart =
      (pdfLayout?.schoolApplicationRepeatStart ?? 0) * coordinateScale;
    const schoolApplicationContentStart =
      (pdfLayout?.schoolApplicationContentStart ?? 0) * coordinateScale;
    const schoolApplicationContentEnd =
      (pdfLayout?.schoolApplicationContentEnd ?? 0) * coordinateScale;
    const continuationPageHeight = Math.max(
      sourcePageHeight * 0.5,
      sourcePageHeight -
        continuationContentTop -
        bottomMargin -
        schoolApplicationRepeatHeight,
    );
    const pageSlices = buildReportPageSlices(
      sourceHeight,
      sourcePageHeight,
      (pdfLayout?.breakPositions ?? []).map(
        (position) => position * coordinateScale,
      ),
      continuationPageHeight,
    );

    for (const [pageIndex, slice] of pageSlices.entries()) {
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = sourceWidth;
      pageCanvas.height = Math.ceil(sourcePageHeight);
      const pageContext = pageCanvas.getContext("2d");
      if (!pageContext) throw new Error("报告分页画布初始化失败。");

      pageContext.fillStyle = theme.cardColor;
      pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      const sliceHeight = Math.max(1, slice.end - slice.start);

      if (pageIndex === 0 || !pdfLayout) {
        pageContext.drawImage(
          sourceImage,
          0,
          slice.start,
          sourceWidth,
          sliceHeight,
          0,
          0,
          sourceWidth,
          sliceHeight,
        );
      } else {
        const headerHeight = Math.min(repeatHeaderHeight, sourceHeight);
        pageContext.drawImage(
          sourceImage,
          0,
          0,
          sourceWidth,
          headerHeight,
          0,
          0,
          sourceWidth,
          headerHeight,
        );

        const railX = pdfLayout.railX * coordinateScale;
        const railWidth = pdfLayout.railWidth * coordinateScale;
        const railHeight = Math.max(
          0,
          pageCanvas.height - continuationContentTop - bottomMargin,
        );
        pageContext.save();
        pageContext.globalAlpha = 0.055;
        pageContext.fillStyle = theme.timelineCompletedColor;
        pageContext.beginPath();
        pageContext.roundRect(
          railX,
          continuationContentTop,
          railWidth,
          railHeight,
          12 * coordinateScale,
        );
        pageContext.fill();
        pageContext.restore();

        const mainX = pdfLayout.mainX * coordinateScale;
        const mainWidth = Math.min(
          pdfLayout.mainWidth * coordinateScale,
          sourceWidth - mainX,
        );
        const startsInsideSchoolApplicationTable =
          schoolApplicationRepeatHeight > 0 &&
          slice.start >= schoolApplicationContentStart - 2 &&
          slice.start < schoolApplicationContentEnd - 2;
        let contentTop = continuationContentTop;
        if (startsInsideSchoolApplicationTable) {
          pageContext.drawImage(
            sourceImage,
            mainX,
            schoolApplicationRepeatStart,
            mainWidth,
            schoolApplicationRepeatHeight,
            mainX,
            continuationContentTop,
            mainWidth,
            schoolApplicationRepeatHeight,
          );
          contentTop += schoolApplicationRepeatHeight;
        }
        const availableContentHeight = Math.max(
          1,
          pageCanvas.height - contentTop - bottomMargin,
        );
        const fitScale = Math.min(1, availableContentHeight / sliceHeight);
        pageContext.drawImage(
          sourceImage,
          mainX,
          slice.start,
          mainWidth,
          sliceHeight,
          mainX,
          contentTop,
          mainWidth * fitScale,
          sliceHeight * fitScale,
        );

        // Draw the full report header last so continuation pages always retain
        // the logo, department, badges, report title and report metadata.
        drawContinuationHeader(pageContext, headerHeight);
      }

      const pageImage = await pdf.embedPng(await canvasToPngBytes(pageCanvas));
      const page = pdf.addPage([pageWidth, pageHeight]);
      page.drawImage(pageImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    }
    const pdfBytes = await pdf.save();
    const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(pdfBuffer).set(pdfBytes);
    return new Blob([pdfBuffer], { type: "application/pdf" });
  }

  async function renderReportDomPngBlob() {
    if (
      typeof navigator !== "undefined" &&
      navigator.userAgent.toLowerCase().includes("jsdom")
    ) {
      return new Blob([buildReportHtml()], { type: "text/html;charset=utf-8" });
    }

    const reportNode = exportReportRef.current;
    if (!reportNode) {
      throw new Error("报告导出视图尚未准备完成，请稍后重试。");
    }

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const { toBlob } = await import("html-to-image");
    const width = Math.ceil(reportNode.scrollWidth);
    const height = Math.ceil(reportNode.scrollHeight);
    const blob = await toBlob(reportNode, {
      backgroundColor: theme.cardColor,
      cacheBust: true,
      canvasHeight: height,
      canvasWidth: width,
      height,
      pixelRatio: 1,
      skipAutoScale: true,
      width,
    });

    if (!blob) {
      throw new Error("报告图片生成失败，请重新尝试。");
    }

    return blob;
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

  function getFusionSectionStyle(
    key: ReportModuleKey,
    placement: "rail" | "main" | "full",
  ) {
    const highlighted = highlightedModules[key];

    if (highlighted) {
      return {
        backgroundColor: theme.secondarySoftColor,
        borderColor: theme.accentColor,
        borderLeftColor: theme.accentColor,
      };
    }
    if (placement === "rail") {
      return { backgroundColor: "transparent", borderColor: "#cbd5e1" };
    }
    return {
      backgroundColor: "transparent",
      borderColor: "transparent",
    };
  }

  function renderFusionSectionHeading(
    key: ReportModuleKey,
    title: string,
    placement: "rail" | "main" | "full",
  ) {
    const isRail = placement === "rail";
    const iconClass = "h-8 w-8 shrink-0";
    const icon =
      key === "stageFocus" ? (
        <ClipboardList className={iconClass} aria-hidden />
      ) : key === "completedThisMonth" ? (
        <Star className={iconClass} aria-hidden />
      ) : key === "nextMonthPlan" ? (
        <CalendarDays className={iconClass} aria-hidden />
      ) : key === "clientTasks" ? (
        <UsersRound className={iconClass} aria-hidden />
      ) : key === "schoolApplications" ? (
        <School className={iconClass} aria-hidden />
      ) : key === "attachments" ? (
        <Paperclip className={iconClass} aria-hidden />
      ) : null;
    const headingColor = isRail
      ? theme.timelineCompletedColor
      : highlightedModules[key]
        ? theme.accentColor
        : key === "stageFocus"
          ? theme.timelineCompletedColor
          : key === "nextMonthPlan"
            ? theme.primaryColor
            : key === "clientTasks"
              ? theme.accentColor
              : theme.titleColor;

    return (
      <div className="flex min-w-0 items-center gap-3">
        {icon ? <span style={{ color: headingColor }}>{icon}</span> : null}
        <h3
          className={isRail ? "min-w-0 text-[24px] font-bold leading-tight" : "min-w-0 text-[28px] font-bold leading-tight"}
          style={{ color: headingColor }}
        >
          {title}
        </h3>
      </div>
    );
  }

  function renderFusionModule(
    key: ReportModuleKey,
    placement: "rail" | "main" | "full",
    includeTestIds: boolean,
    paired: boolean,
    editableLayout: boolean,
  ) {
    if (!modules[key]) return null;
    if (key === "attachments" && !attachmentNames) return null;

    const sectionClass = `group relative ${
      placement === "rail"
        ? highlightedModules[key]
          ? key === "timeline" && timelineItems.length > 15
            ? "rounded-lg border border-l-[6px] p-4 text-[16px] leading-[1.35]"
            : "rounded-lg border border-l-[6px] p-4 text-[17px] leading-[1.4]"
          : key === "timeline" && timelineItems.length > 15
            ? "border-t border-dashed px-0 py-4 text-[16px] leading-[1.35]"
            : "border-t border-dashed px-0 py-5 text-[17px] leading-[1.4]"
        : highlightedModules[key]
          ? "rounded-lg border border-l-[6px] p-5 text-[19px] leading-[1.55]"
          : key === "completedThisMonth"
            ? "border-b border-slate-200 py-7 text-[19px] leading-[1.55]"
            : key === "stageFocus"
              ? "pb-12 text-[19px] leading-[1.55]"
              : key === "summary"
                ? "border-b border-slate-200 pb-11 pt-1 text-[19px] leading-[1.5]"
                : key === "materialCollection"
                  ? "border-b border-slate-200 py-8 text-[18px] leading-[1.45]"
                  : key === "nextMonthPlan"
                    ? "border-b border-dashed border-slate-300 py-7 text-[19px] leading-[1.55]"
                    : "py-7 text-[19px] leading-[1.55]"
    }`;
    const testId = includeTestIds ? `report-section-${key}` : undefined;
    const reportSectionTestId =
      includeTestIds && placement !== "rail" ? "report-section" : undefined;
    const commonProps = {
      "data-highlighted": highlightedModules[key] ? "true" : "false",
      "data-layout": paired ? "half" : "full",
      "data-width": reportModuleWidths[key],
      "data-report-module": key,
      "data-report-placement": placement,
      "data-pdf-break-before": placement === "rail" ? undefined : "true",
      "data-testid": testId,
      className: sectionClass,
      draggable: editableLayout,
      onDragEnd: editableLayout ? () => setDraggedModule(null) : undefined,
      onDragOver: editableLayout
        ? (event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }
        : undefined,
      onDragStart: editableLayout
        ? (event: DragEvent<HTMLElement>) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/report-module", key);
            setDraggedModule(key);
          }
        : undefined,
      onDrop: editableLayout
        ? (event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            const source =
              (event.dataTransfer.getData("text/report-module") as ReportModuleKey) ||
              draggedModule;
            if (source) moveReportModuleTo(source, key);
            setDraggedModule(null);
          }
        : undefined,
      style: getFusionSectionStyle(key, placement),
    };
    const widthTarget = reportModuleWidths[key] === "compact" ? "wide" : "compact";
    const layoutControls = editableLayout ? (
      <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-sm print:hidden">
        <span
          aria-label={`拖动${reportModuleLabels[key]}`}
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-slate-500 active:cursor-grabbing"
          title="拖动调整位置"
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </span>
        <button
          aria-label={`将${reportModuleLabels[key]}设为${widthTarget === "compact" ? "紧凑" : "主要"}宽度`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          title={widthTarget === "compact" ? "切换为紧凑宽度" : "切换为主要宽度"}
          type="button"
          onClick={() => toggleReportModuleWidth(key)}
        >
          {widthTarget === "compact" ? (
            <Minimize2 className="h-4 w-4" aria-hidden />
          ) : (
            <Maximize2 className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    ) : null;

    if (key === "stageFocus") {
      const isCompact = placement === "rail";
      return (
        <section key={key} {...commonProps}>
          {layoutControls}
          <div data-testid={reportSectionTestId}>
            {renderFusionSectionHeading(key, stageFocusTitle, placement)}
            <div
              className={`mt-6 grid overflow-hidden rounded-lg border border-l-[6px] ${
                isCompact
                  ? "grid-cols-1"
                  : "min-h-[144px] grid-cols-[1fr_58px_1.35fr]"
              }`}
              style={{
                background: `linear-gradient(90deg, ${theme.primarySoftColor} 0%, #ffffff 52%, ${theme.secondarySoftColor} 100%)`,
                borderColor: "#e5e7eb",
                borderLeftColor: theme.timelineCompletedColor,
              }}
            >
              <div className={isCompact ? "p-4" : "p-6"}>
                <p className="font-bold" style={{ color: theme.timelineCompletedColor }}>
                  {currentStageFocusTitle}
                </p>
                <p className="mt-3 text-[22px] font-semibold" style={{ color: theme.titleColor }}>
                  {currentStageFocusDisplay}
                </p>
              </div>
              <div className={isCompact ? "flex h-8 items-center justify-center" : "flex items-center justify-center"}>
                <ArrowRight
                  className={`h-7 w-7 ${isCompact ? "rotate-90" : ""}`}
                  style={{ color: theme.timelineCompletedColor }}
                  aria-hidden
                />
              </div>
              <div className={isCompact ? "p-4" : "p-6"}>
                <p className="font-bold" style={{ color: theme.accentColor }}>
                  {nextStageFocusTitle}
                </p>
                <p className="mt-3 whitespace-pre-line">{content.nextStageFocus}</p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (key === "summary") {
      const isCompact = placement === "rail";
      return (
        <section key={key} {...commonProps} aria-label={summaryTitle}>
          {layoutControls}
          <div data-testid={reportSectionTestId}>
            {renderFusionSectionHeading(key, summaryTitle, placement)}
            <div className={`mt-6 grid gap-4 ${isCompact ? "grid-cols-1" : "grid-cols-3 gap-5"}`}>
              <div className="min-h-[154px] rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${theme.timelineCompletedColor}18`, color: theme.timelineCompletedColor }}
                  >
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-[16px]" style={{ color: theme.mutedTextColor }}>{summaryMaterialTitle}</span>
                </div>
                <strong className="mt-4 block text-[24px]" style={{ color: theme.titleColor }}>
                  {summaryMaterialValue}
                </strong>
              </div>
              <div className="min-h-[154px] rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${theme.primaryColor}14`, color: theme.primaryColor }}
                  >
                    <GraduationCap className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-[16px]" style={{ color: theme.mutedTextColor }}>{summaryAcademicTitle}</span>
                </div>
                <strong className="mt-4 block text-[20px] leading-[1.28]" style={{ color: theme.titleColor }}>
                  {summaryAcademicValue}
                </strong>
              </div>
              <div className="min-h-[154px] rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${theme.accentColor}14`, color: theme.accentColor }}
                  >
                    <School className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-[16px]" style={{ color: theme.mutedTextColor }}>{summarySchoolTitle}</span>
                </div>
                <strong className="mt-4 block text-[21px] leading-[1.3]" style={{ color: theme.titleColor }}>
                  {summarySchoolValue}
                </strong>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (key === "timeline") {
      const useDenseTimeline = timelineItems.length > 15;
      return (
        <section key={key} {...commonProps}>
          {layoutControls}
          <div data-testid={reportSectionTestId}>
            {renderFusionSectionHeading(key, config.moduleTitles.timeline, placement)}
            <ol className={useDenseTimeline ? "mt-4" : "mt-5"}>
              {timelineItems.map((item, index) => {
                const statusLabel =
                  item.status === "current"
                    ? "进行中"
                    : timelineStatusOptions.find(
                        (option) => option.value === item.status,
                      )?.label;
                return (
                  <li
                    className={
                      useDenseTimeline
                        ? "relative grid min-h-8 grid-cols-[30px_minmax(0,1fr)_auto] items-start gap-2 pb-0.5"
                        : "relative grid min-h-10 grid-cols-[34px_minmax(0,1fr)_auto] items-start gap-2 pb-1.5"
                    }
                    data-testid={includeTestIds ? `timeline-node-${index}` : undefined}
                    key={item.id}
                  >
                    {index < timelineItems.length - 1 ? (
                      <span
                        aria-hidden
                        className={
                          useDenseTimeline
                            ? "absolute left-3.5 top-6 h-[calc(100%-6px)] border-l-2"
                            : "absolute left-4 top-7 h-[calc(100%-8px)] border-l-2"
                        }
                        style={{ borderColor: theme.timelinePendingColor }}
                      />
                    ) : null}
                    <span
                      className={`relative z-10 flex items-center justify-center rounded-full bg-white ${
                        item.status === "pending"
                          ? useDenseTimeline
                            ? "ml-[8px] mt-2 h-3 w-3"
                            : "ml-[10px] mt-2 h-3 w-3"
                          : useDenseTimeline
                            ? "ml-0.5 h-6 w-6"
                            : "ml-0.5 h-7 w-7"
                      }`}
                      data-testid={includeTestIds ? `timeline-dot-${index}` : undefined}
                      style={{
                        backgroundColor: getTimelineColor(item.status),
                        color: "#ffffff",
                      }}
                    >
                      {item.status === "completed" ? (
                        <Check className={useDenseTimeline ? "h-5 w-5" : "h-6 w-6"} aria-hidden />
                      ) : item.status === "current" ? (
                        <span
                          className={useDenseTimeline ? "h-3.5 w-3.5 rounded-full bg-white" : "h-4 w-4 rounded-full bg-white"}
                          aria-hidden
                        />
                      ) : null}
                    </span>
                    <span className={useDenseTimeline ? "min-w-0 pt-0.5" : "min-w-0 pt-1"}>
                      <span
                        className="block font-semibold"
                        style={{
                          color:
                            item.status === "current"
                              ? theme.primaryColor
                              : theme.textColor,
                        }}
                      >
                        {item.label}
                      </span>
                      {item.note.trim() ? (
                        <span
                          className="mt-1 inline-flex rounded-full px-2.5 py-1 text-[15px] font-semibold"
                          style={{
                            backgroundColor: theme.secondarySoftColor,
                            color: theme.accentColor,
                          }}
                        >
                          {item.note}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={useDenseTimeline ? "pt-0.5 text-[15px]" : "pt-1 text-[16px]"}
                      style={{ color: theme.mutedTextColor }}
                    >
                      {statusLabel}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      );
    }

    if (key === "basicInfo") {
      const rows =
        studentInfoRows.length > 0
          ? studentInfoRows
          : [{ label: "基础信息", value: emptySectionPlaceholder }];
      return (
        <section key={key} {...commonProps}>
          {layoutControls}
          <div data-testid={reportSectionTestId}>
            {renderFusionSectionHeading(key, "基础信息", placement)}
            <div
              className={
                placement === "full"
                  ? "mt-4 grid grid-cols-2 gap-x-8"
                  : "mt-4 divide-y divide-slate-200"
              }
            >
              {rows.map((row, index) => {
                const sourceRange = studentInfoSourceRanges[index];
                return (
                  <div
                    className="grid grid-cols-[118px_minmax(0,1fr)] gap-3 border-b border-slate-100 py-2"
                    key={`${row.label}-${index}`}
                  >
                    <span style={{ color: theme.mutedTextColor }}>
                      {sourceRange?.labelStart >= 0
                        ? renderStyledText(
                            "studentBasicInfo",
                            content.studentBasicInfo,
                            sourceRange.labelStart,
                            sourceRange.labelEnd,
                          )
                        : row.label}
                    </span>
                    <span className="break-words" style={getTextFormattingStyle("studentBasicInfo")}>
                      {sourceRange?.valueStart >= 0
                        ? renderStyledText(
                            "studentBasicInfo",
                            content.studentBasicInfo,
                            sourceRange.valueStart,
                            sourceRange.valueEnd,
                          )
                        : row.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (key === "materialCollection") {
      const rows =
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
      return (
        <section key={key} {...commonProps}>
          {layoutControls}
          <div data-testid={reportSectionTestId}>
            {renderFusionSectionHeading(key, "材料收集", placement)}
            {placement === "rail" ? null : (
              <div className="mt-4 grid grid-cols-[1.2fr_112px_1fr] gap-3 border-b border-slate-300 pb-2 font-semibold" style={{ color: theme.mutedTextColor }}>
                <span>材料项目</span>
                <span>状态</span>
                <span>备注</span>
              </div>
            )}
            <div className="divide-y divide-slate-200">
              {rows.map((row, index) => {
                const statusStyle = statusStyles[row.status];
                const sourceRange = materialSourceRanges[index];
                const remarkStart =
                  sourceRange?.valueStart >= 0
                    ? content.materialCollectionStatus.indexOf(
                        row.remark,
                        sourceRange.valueStart,
                      )
                    : -1;
                const remarkEnd =
                  remarkStart >= 0 ? remarkStart + row.remark.length : -1;
                return (
                  <div
                    className={
                      placement === "rail"
                        ? "grid grid-cols-[minmax(0,1fr)_auto] gap-2 py-3"
                        : "grid grid-cols-[1.2fr_112px_1fr] gap-3 py-2"
                    }
                    key={`${row.item}-${row.remark}-${index}`}
                  >
                    <span className="sr-only">{row.item}：{row.remark}</span>
                    <span className="break-words" style={getTextFormattingStyle("materialCollectionStatus")}>
                      {sourceRange?.labelStart >= 0
                        ? renderStyledText(
                            "materialCollectionStatus",
                            content.materialCollectionStatus,
                            sourceRange.labelStart,
                            sourceRange.labelEnd,
                          )
                        : row.item}
                    </span>
                    <span
                      className="inline-flex h-fit w-fit rounded-full px-3 py-1 text-[16px] font-bold"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                    >
                      {row.statusLabel}
                    </span>
                    <span
                      className={`break-words ${placement === "rail" ? "col-span-2 text-[15px]" : ""}`}
                      style={getTextFormattingStyle("materialCollectionStatus")}
                    >
                      {remarkStart >= 0
                        ? renderStyledText(
                            "materialCollectionStatus",
                            content.materialCollectionStatus,
                            remarkStart,
                            remarkEnd,
                          )
                        : row.remark}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (key === "schoolApplications") {
      return (
        <section key={key} {...commonProps}>
          {layoutControls}
          <div data-testid={reportSectionTestId}>
            {renderFusionSectionHeading(key, "院校申请", placement)}
            {placement === "rail" ? (
              <div className="mt-4 grid gap-3">
                {schoolApplications.length > 0 ? (
                  schoolApplications.map((row) => (
                    <article
                      className="rounded-lg border border-slate-200 bg-white p-3"
                      key={row.id}
                    >
                      {schoolApplicationColumns.map((column) => (
                        <p
                          className="grid grid-cols-[112px_minmax(0,1fr)] gap-2 border-b border-slate-100 py-1.5 last:border-b-0"
                          key={column.id}
                        >
                          <span className="text-[14px]" style={{ color: theme.mutedTextColor }}>
                            {column.label}
                          </span>
                          <span className="break-words text-[15px]">
                            {row.values[column.id] || emptySectionPlaceholder}
                          </span>
                        </p>
                      ))}
                    </article>
                  ))
                ) : (
                  <p style={{ color: theme.mutedTextColor }}>{emptySectionPlaceholder}</p>
                )}
              </div>
            ) : (
              <div
                className="mt-4 overflow-hidden rounded-lg border border-slate-200"
                data-report-school-application-table="true"
              >
                <table
                  className={`w-full table-fixed border-collapse text-left ${
                    schoolApplicationColumns.length > 5
                      ? "text-[13px]"
                      : "text-[17px]"
                  }`}
                >
                  <colgroup>
                    {schoolApplicationColumns.map((column) => (
                      <col
                        key={column.id}
                        style={{
                          width: `${schoolApplicationColumnWidths[column.id] ?? 100}px`,
                        }}
                      />
                    ))}
                  </colgroup>
                  <thead
                    data-report-school-application-header="true"
                    style={{ backgroundColor: theme.primarySoftColor }}
                  >
                    <tr>
                      {schoolApplicationColumns.map((column, columnIndex) => (
                        <th
                          className="relative border-b border-slate-200 px-2 py-2 font-semibold"
                          key={column.id}
                          style={{ color: theme.titleColor }}
                        >
                          {column.label}
                          {editableLayout ? (
                            <span
                              aria-label={`调整院校申请第${columnIndex + 1}列列宽`}
                              aria-orientation="vertical"
                              className="absolute -right-1 top-0 z-20 h-full w-2 cursor-col-resize touch-none bg-transparent hover:bg-blue-300/50"
                              draggable={false}
                              role="separator"
                              title="拖动调整列宽"
                              onPointerDown={(event) =>
                                beginSchoolApplicationColumnResize(column.id, event)
                              }
                            />
                          ) : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schoolApplications.length > 0 ? (
                      schoolApplications.map((row, rowIndex) => (
                        <tr
                          data-report-school-application-row="true"
                          key={row.id}
                          style={{ height: schoolApplicationRowHeights[row.id] }}
                        >
                          {schoolApplicationColumns.map((column, columnIndex) => (
                            <td
                              className="relative break-words border-b border-slate-100 px-2 py-2 align-top last:border-b-0"
                              key={column.id}
                            >
                              {row.values[column.id] || emptySectionPlaceholder}
                              {editableLayout &&
                              columnIndex === schoolApplicationColumns.length - 1 ? (
                                <span
                                  aria-label={`调整院校申请第${rowIndex + 1}行行高`}
                                  aria-orientation="horizontal"
                                  className="absolute -bottom-1 left-0 z-20 h-2 w-full cursor-row-resize touch-none bg-transparent hover:bg-blue-300/50"
                                  draggable={false}
                                  role="separator"
                                  title="拖动调整行高"
                                  onPointerDown={(event) =>
                                    beginSchoolApplicationRowResize(row.id, event)
                                  }
                                />
                              ) : null}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="px-3 py-3"
                          colSpan={Math.max(1, schoolApplicationColumns.length)}
                          style={{ color: theme.mutedTextColor }}
                        >
                          {emptySectionPlaceholder}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      );
    }

    if (key === "completedThisMonth") {
      return (
        <section key={key} {...commonProps}>
          {layoutControls}
          <div data-testid={reportSectionTestId}>
            {renderFusionSectionHeading(key, completedThisMonthTitle, placement)}
            <p className="mt-4" style={getTextFormattingStyle("completedThisMonth")}>
              {completedThisMonthLineRanges.length > 0 ? (
                completedThisMonthLineRanges.map((line) => (
                  <i
                    className="mb-1 block not-italic last:mb-0"
                    key={`${line.start}-${line.text}`}
                  >
                    {renderStyledText(
                      "completedThisMonth",
                      content.completedThisMonth,
                      line.start,
                      line.end,
                    )}
                  </i>
                ))
              ) : (
                emptySectionPlaceholder
              )}
            </p>
          </div>
        </section>
      );
    }

    if (key === "nextMonthPlan") {
      return (
        <section key={key} {...commonProps}>
          {layoutControls}
          <div data-testid={reportSectionTestId}>
            {renderFusionSectionHeading(key, nextMonthPlanTitle, placement)}
            <div className="mt-4 space-y-1" style={getTextFormattingStyle("nextMonthPlan")}>
              {nextMonthPlanLineRanges.length > 0 ? (
                nextMonthPlanLineRanges.map((line) => (
                  <p key={`${line.start}-${line.text}`}>
                    {renderStyledText(
                      "nextMonthPlan",
                      content.nextMonthPlan,
                      line.start,
                      line.end,
                    )}
                  </p>
                ))
              ) : (
                <p>{emptySectionPlaceholder}</p>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (key === "clientTasks") {
      return (
        <section key={key} {...commonProps}>
          {layoutControls}
          <div data-testid={reportSectionTestId}>
            {renderFusionSectionHeading(key, clientTasksTitle, placement)}
            <p className="mt-4" style={getTextFormattingStyle("clientTasks")}>
              {clientTasksLineRanges.length > 0 ? (
                clientTasksLineRanges.map((line) => (
                  <i
                    className="mb-1 block not-italic last:mb-0"
                    key={`${line.start}-${line.text}`}
                  >
                    {renderStyledText(
                      "clientTasks",
                      content.clientTasks,
                      line.start,
                      line.end,
                    )}
                  </i>
                ))
              ) : (
                emptySectionPlaceholder
              )}
            </p>
          </div>
        </section>
      );
    }

    return (
      <section key={key} {...commonProps}>
        {layoutControls}
        <div data-testid={reportSectionTestId}>
          {renderFusionSectionHeading(key, "附件", placement)}
          <p className="sr-only">本次报告附件：{attachmentNames}</p>
          <div className={`mt-4 grid gap-3 ${placement === "rail" ? "grid-cols-1" : "grid-cols-2"}`}>
            {attachments.map((attachment) => (
              <article
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                key={attachment.id}
              >
                {attachment.previewKind === "image" && attachment.previewUrl ? (
                  <img
                    alt={attachment.name}
                    className="max-h-[360px] w-full object-contain"
                    src={attachment.previewUrl}
                  />
                ) : attachment.previewKind === "text" ? (
                  <pre className="max-h-[260px] overflow-hidden whitespace-pre-wrap break-words bg-slate-50 p-3 text-[15px] leading-6">
                    {attachment.textContent || emptySectionPlaceholder}
                  </pre>
                ) : (
                  <div className="flex min-h-24 items-center gap-3 bg-slate-50 p-4">
                    <FileText className="h-9 w-9 shrink-0 text-slate-400" aria-hidden />
                    <p className="min-w-0 break-all text-[16px]">
                      {attachment.previewKind === "pdf"
                        ? "PDF 内容可在附件预览中逐页查看"
                        : "此格式可在附件预览中打开原文件"}
                    </p>
                  </div>
                )}
                <div className="border-t border-slate-200 px-3 py-2">
                  <p className="break-all font-semibold">{attachment.name}</p>
                  <p className="text-[14px]" style={{ color: theme.mutedTextColor }}>
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderFusionReportDocument(
    exportTarget: boolean,
    includeTestIds = !exportTarget,
  ) {
    const hasInformationPair = modules.basicInfo && modules.materialCollection;
    const editableLayout = !exportTarget;
    const compactModuleKeys = reportModuleOrder.filter(
      (key) => modules[key] && reportModuleWidths[key] === "compact",
    );
    const wideModuleKeys = reportModuleOrder.filter(
      (key) => modules[key] && reportModuleWidths[key] === "wide",
    );

    return (
      <article
        ref={exportTarget ? exportReportRef : undefined}
        aria-label="反馈报告导出视图"
        className="relative isolate min-h-[1754px] w-[1240px] overflow-hidden"
        style={{
          backgroundColor: theme.cardColor,
          color: theme.textColor,
          fontFamily: theme.fontFamily,
        }}
      >
        <header className="px-[58px] pb-2.5 pt-[46px]" data-report-header="true">
          <div
            className="flex items-start justify-between gap-8"
            data-report-running-header="true"
          >
            <div className="flex min-w-0 items-center gap-[45px]">
              <img
                alt="新东方"
                className="h-[52px] w-[152px] object-contain object-left"
                src={companyLogoSrc}
              />
              <p className="text-[19px] font-medium" style={{ color: theme.textColor }}>
                {content.departmentLabel}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[16px] font-bold">
              {modules.season ? (
                <span className="rounded-full px-5 py-2.5" style={{ backgroundColor: theme.secondarySoftColor, color: theme.accentColor }}>
                  {content.season}
                </span>
              ) : null}
              {modules.applicationType ? (
                <span className="rounded-full px-5 py-2.5" style={{ backgroundColor: theme.primarySoftColor, color: theme.primaryColor }}>
                  {applicationType}
                </span>
              ) : null}
            </div>
          </div>
          <p className="sr-only">Application Progress Report</p>
          <span className="sr-only">第 1 页，共 {reportPageCount} 页</span>
          <h3 className="mt-[50px] max-w-[1020px] text-[40px] font-bold leading-[1.16]" style={{ color: theme.titleColor }}>
            {reportTitle}
          </h3>
          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-1 text-[18px]" style={{ color: theme.textColor }}>
            {modules.studentName ? <span>学生姓名：{content.studentName}</span> : null}
            {modules.season ? <span>申请季度：{content.season}</span> : null}
            {modules.applicationType ? <span>申请类型：{applicationType}</span> : null}
            <span>报告日期：{reportDateDisplay}</span>
          </div>
        </header>

        <div
          className="grid grid-cols-[374px_minmax(0,1fr)] items-start gap-[30px] px-[56px] pb-[56px] pt-2"
          data-testid={includeTestIds && hasInformationPair ? "basic-material-pair" : undefined}
        >
          <aside
            className="min-h-[1418px] rounded-xl p-6"
            data-report-rail="true"
            style={{ backgroundColor: `${theme.timelineCompletedColor}0d` }}
          >
            <section>
              <h3 className="text-[24px] font-bold" style={{ color: theme.timelineCompletedColor }}>
                学生概览
              </h3>
              <div className="mt-5 flex items-center gap-5">
                <span
                  className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: theme.timelineCompletedColor }}
                >
                  <UserRound className="h-11 w-11" aria-hidden />
                </span>
                <div className="min-w-0 text-[18px] leading-[1.5]">
                  {modules.studentName ? (
                    <p className="truncate text-[23px] font-bold" style={{ color: theme.titleColor }}>
                      {content.studentName}
                    </p>
                  ) : null}
                  {modules.season ? <p>申请季：{content.season}</p> : null}
                  {modules.applicationType ? <p>{applicationType}</p> : null}
                </div>
              </div>
              <div className="mt-6 border-t border-dashed border-slate-300 pt-5">
                <p className="text-[24px] font-bold" style={{ color: theme.timelineCompletedColor }}>
                  申请进度
                </p>
                <p className="mt-4 text-[56px] font-bold leading-none" style={{ color: theme.timelineCompletedColor }}>
                  {completedTimelineCount} <span className="text-[28px]">/ {timelineItems.length || 1}</span>
                </p>
                <p className="mt-4 text-[17px]" style={{ color: theme.mutedTextColor }}>
                  已完成 {completedTimelineCount} 个节点
                </p>
                <span className="mt-3 block h-3 overflow-hidden rounded-full bg-slate-300/70">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${timelineProgress}%`, backgroundColor: theme.timelineCompletedColor }}
                  />
                </span>
              </div>
            </section>

            {compactModuleKeys.map((key) =>
              renderFusionModule(
                key,
                "rail",
                includeTestIds,
                hasInformationPair && ["basicInfo", "materialCollection"].includes(key),
                editableLayout,
              ),
            )}
          </aside>

          <main
            className="grid min-w-0 content-start gap-0 pt-6"
            data-report-main="true"
          >
            {wideModuleKeys.map((key) =>
              renderFusionModule(
                key,
                "main",
                includeTestIds,
                hasInformationPair && ["basicInfo", "materialCollection"].includes(key),
                editableLayout,
              ),
            )}
          </main>
        </div>
      </article>
    );
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

      {isPreviewExpanded ? (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 p-3 sm:p-5">
          <section
            aria-label="放大报告预览"
            aria-modal="true"
            className="mx-auto flex h-full max-w-[1480px] flex-col overflow-hidden rounded-lg bg-slate-100 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <h2 className="font-semibold text-slate-950">放大报告预览</h2>
              <button
                aria-label="关闭放大报告预览"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
                title="关闭"
                type="button"
                onClick={() => setIsPreviewExpanded(false)}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div className="mx-auto w-[1240px] shadow-xl">
                {renderFusionReportDocument(false, false)}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {previewAttachment ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4">
          <section
            aria-label={`附件预览 ${previewAttachment.name}`}
            aria-modal="true"
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
            role="dialog"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-slate-950">
                  {previewAttachment.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {previewAttachment.type} · {formatFileSize(previewAttachment.size)}
                </p>
              </div>
              <button
                aria-label="关闭附件预览"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600"
                title="关闭"
                type="button"
                onClick={() => setPreviewAttachmentId(null)}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
              {previewAttachment.previewKind === "image" && previewAttachment.previewUrl ? (
                <img
                  alt={previewAttachment.name}
                  className="mx-auto max-h-full max-w-full bg-white object-contain shadow-sm"
                  src={previewAttachment.previewUrl}
                />
              ) : previewAttachment.previewKind === "pdf" && previewAttachment.previewUrl ? (
                <object
                  aria-label={`PDF 内容 ${previewAttachment.name}`}
                  className="h-[76vh] w-full rounded-lg bg-white"
                  data={previewAttachment.previewUrl}
                  type="application/pdf"
                >
                  <p className="p-4 text-sm text-slate-600">
                    当前浏览器无法内嵌显示此 PDF，请使用下方按钮打开原文件。
                  </p>
                </object>
              ) : previewAttachment.previewKind === "text" ? (
                <pre className="min-h-[320px] whitespace-pre-wrap break-words rounded-lg bg-white p-4 text-sm leading-6 text-slate-800">
                  {previewAttachment.textContent || emptySectionPlaceholder}
                </pre>
              ) : (
                <div className="grid min-h-[320px] place-items-center rounded-lg bg-white p-6 text-center">
                  <div>
                    <FileText className="mx-auto h-12 w-12 text-slate-400" aria-hidden />
                    <p className="mt-3 font-medium text-slate-900">浏览器暂不支持直接预览此格式</p>
                    <p className="mt-1 text-sm text-slate-500">可以打开原文件查看完整内容。</p>
                  </div>
                </div>
              )}
            </div>
            {previewAttachment.previewUrl ? (
              <div className="border-t border-slate-200 bg-white p-3 text-right">
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                  href={previewAttachment.previewUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Eye className="h-4 w-4" aria-hidden />
                  打开原文件
                </a>
              </div>
            ) : null}
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
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-inner outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
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
              <label className="grid gap-1 text-sm font-medium">
                报告日期
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  type="date"
                  value={content.reportDate}
                  onChange={(event) =>
                    updateContent("reportDate", event.target.value)
                  }
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
              上传此前报告
              <span className="flex items-center gap-2 text-slate-500">
                <Upload className="h-4 w-4" aria-hidden />
                新版 PDF 可完整回填；旧版 PDF 和报告图片会通过本地 OCR 尽可能恢复，也兼容 txt、md、html、json
              </span>
              <input
                aria-label="上传此前报告"
                accept=".txt,.md,.html,.htm,.pdf,.json,.png,.jpg,.jpeg,.webp,.bmp,image/*"
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
                onChange={(event) => void handleAttachmentUpload(event.target.files)}
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
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        aria-label={`预览附件 ${attachment.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-500"
                        title="预览附件"
                        type="button"
                        onClick={() => setPreviewAttachmentId(attachment.id)}
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        aria-label={`删除附件 ${attachment.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-500"
                        title="删除附件"
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
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
              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:col-span-2">
                <label className="grid gap-1 text-sm font-medium">
                  当前阶段重点和下一步建议板块标题
                  <input
                    aria-label="当前阶段重点和下一步建议板块标题"
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-inner outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    value={content.stageFocusTitle}
                    onChange={(event) =>
                      updateContent("stageFocusTitle", event.target.value)
                    }
                  />
                </label>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3">
                    <label className="grid gap-1 text-sm font-medium">
                      当前阶段重点标题
                      <input
                        aria-label="当前阶段重点标题"
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-inner outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        value={content.currentStageFocusTitle}
                        onChange={(event) =>
                          updateContent("currentStageFocusTitle", event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      当前阶段重点内容
                      <textarea
                        aria-label="当前阶段重点内容"
                        className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6"
                        value={content.currentStageFocus}
                        onChange={(event) =>
                          updateContent("currentStageFocus", event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3">
                    <label className="grid gap-1 text-sm font-medium">
                      下一步建议标题
                      <input
                        aria-label="下一步建议标题"
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-inner outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        value={content.nextStageFocusTitle}
                        onChange={(event) =>
                          updateContent("nextStageFocusTitle", event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-medium">
                      下一步建议内容
                      <textarea
                        aria-label="下一步建议内容"
                        className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6"
                        value={content.nextStageFocus}
                        onChange={(event) =>
                          updateContent("nextStageFocus", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:col-span-2">
                <label className="grid gap-1 text-sm font-medium">
                  关键摘要板块标题
                  <input
                    aria-label="关键摘要板块标题"
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-inner outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    value={content.summaryTitle}
                    onChange={(event) =>
                      updateContent("summaryTitle", event.target.value)
                    }
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    {
                      id: "material",
                      titleLabel: "关键摘要材料标题",
                      valueLabel: "关键摘要材料内容",
                      title: content.summaryMaterialTitle,
                      value: summaryMaterialValue,
                      titleField: "summaryMaterialTitle" as const,
                      valueField: "summaryMaterialValue" as const,
                    },
                    {
                      id: "academic",
                      titleLabel: "关键摘要学术标题",
                      valueLabel: "关键摘要学术内容",
                      title: content.summaryAcademicTitle,
                      value: summaryAcademicValue,
                      titleField: "summaryAcademicTitle" as const,
                      valueField: "summaryAcademicValue" as const,
                    },
                    {
                      id: "school",
                      titleLabel: "关键摘要学校标题",
                      valueLabel: "关键摘要学校内容",
                      title: content.summarySchoolTitle,
                      value: summarySchoolValue,
                      titleField: "summarySchoolTitle" as const,
                      valueField: "summarySchoolValue" as const,
                    },
                  ].map((item) => (
                    <div
                      className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3"
                      key={item.id}
                    >
                      <label className="grid gap-1 text-sm font-medium">
                        {item.titleLabel}
                        <input
                          aria-label={item.titleLabel}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm shadow-inner outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                          value={item.title}
                          onChange={(event) =>
                            updateContent(item.titleField, event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-medium">
                        {item.valueLabel}
                        <textarea
                          aria-label={item.valueLabel}
                          className="min-h-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6"
                          value={item.value}
                          onChange={(event) =>
                            updateContent(item.valueField, event.target.value)
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              <ReportTextEditor
                formatting={textFormatting.completedThisMonth}
                formattingRanges={textFormattingRanges.completedThisMonth}
                id="completed-this-month"
                label="阶段性反馈"
                sectionTitle={content.completedThisMonthTitle}
                value={content.completedThisMonth}
                onSectionTitleChange={(value) =>
                  updateContent("completedThisMonthTitle", value)
                }
                onFormattingChange={(patch, selection) =>
                  updateTextFormatting("completedThisMonth", patch, selection)
                }
                onValueChange={(value) =>
                  updateContent("completedThisMonth", value)
                }
              />
              <ReportTextEditor
                formatting={textFormatting.nextMonthPlan}
                formattingRanges={textFormattingRanges.nextMonthPlan}
                id="next-month-plan"
                label="下一阶段计划"
                sectionTitle={content.nextMonthPlanTitle}
                value={content.nextMonthPlan}
                onSectionTitleChange={(value) =>
                  updateContent("nextMonthPlanTitle", value)
                }
                onFormattingChange={(patch, selection) =>
                  updateTextFormatting("nextMonthPlan", patch, selection)
                }
                onValueChange={(value) => updateContent("nextMonthPlan", value)}
              />
              <ReportTextEditor
                formatting={textFormatting.clientTasks}
                formattingRanges={textFormattingRanges.clientTasks}
                id="client-tasks"
                label="需要学生/家庭配合"
                minHeightClass="min-h-24"
                sectionTitle={content.clientTasksTitle}
                value={content.clientTasks}
                onSectionTitleChange={(value) =>
                  updateContent("clientTasksTitle", value)
                }
                onFormattingChange={(patch, selection) =>
                  updateTextFormatting("clientTasks", patch, selection)
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
                formattingRanges={textFormattingRanges.studentBasicInfo}
                id="student-basic-info"
                label="基础信息"
                minHeightClass="min-h-24"
                placeholder="就读年级、就读学校、国籍、生日、语言成绩、标化考试、AP、GPA 等信息会显示在这里。"
                value={content.studentBasicInfo}
                onFormattingChange={(patch, selection) =>
                  updateTextFormatting("studentBasicInfo", patch, selection)
                }
                onValueChange={(value) => updateContent("studentBasicInfo", value)}
              />
              <ReportTextEditor
                className="lg:col-span-2"
                formatting={textFormatting.materialCollectionStatus}
                formattingRanges={textFormattingRanges.materialCollectionStatus}
                id="material-collection-status"
                label="材料收集"
                minHeightClass="min-h-24"
                placeholder="简历信息表、文书信息表、推荐人信息、成绩单、护照、签证页、存款证明等状态会显示在这里。"
                value={content.materialCollectionStatus}
                onFormattingChange={(patch, selection) =>
                  updateTextFormatting(
                    "materialCollectionStatus",
                    patch,
                    selection,
                  )
                }
                onValueChange={(value) =>
                  updateContent("materialCollectionStatus", value)
                }
              />
              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">院校申请</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Excel 中识别到申请院校表时会自动填入；表头和每个单元格均可修改，列宽和行高可在右侧报告预览中拖动调整。
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium"
                      type="button"
                      onClick={resetSchoolApplicationTableSizing}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      恢复默认尺寸
                    </button>
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium"
                      type="button"
                      onClick={addSchoolApplicationColumn}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      新增字段
                    </button>
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium"
                      type="button"
                      onClick={addSchoolApplicationRow}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      新增院校
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <div className="min-w-max p-2">
                    <div
                      className="grid items-end gap-2 border-b border-slate-200 pb-2"
                      style={{
                        gridTemplateColumns: `repeat(${schoolApplicationColumns.length}, minmax(180px, 1fr)) 42px`,
                      }}
                    >
                      {schoolApplicationColumns.map((column, columnIndex) => (
                        <label className="grid gap-1 text-xs font-medium" key={column.id}>
                          表头 {columnIndex + 1}
                          <span className="flex items-center gap-1">
                            <input
                              aria-label={`院校申请表头 ${columnIndex + 1}`}
                              className="min-w-0 flex-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-sm"
                              value={column.label}
                              onChange={(event) =>
                                updateSchoolApplicationColumn(
                                  column.id,
                                  event.target.value,
                                )
                              }
                            />
                            <button
                              aria-label={`删除院校申请表头 ${columnIndex + 1}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-500 disabled:opacity-40"
                              disabled={schoolApplicationColumns.length <= 1}
                              type="button"
                              onClick={() => removeSchoolApplicationColumn(column.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </span>
                        </label>
                      ))}
                      <span aria-hidden />
                    </div>
                    <div className="grid gap-2 pt-2">
                      {schoolApplications.length > 0 ? (
                        schoolApplications.map((row, rowIndex) => (
                          <div
                            className="grid items-center gap-2"
                            key={row.id}
                            style={{
                              gridTemplateColumns: `repeat(${schoolApplicationColumns.length}, minmax(180px, 1fr)) 42px`,
                            }}
                          >
                            {schoolApplicationColumns.map((column, columnIndex) => (
                              <input
                                aria-label={`院校申请第${rowIndex + 1}行第${columnIndex + 1}列`}
                                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                key={column.id}
                                placeholder={column.label}
                                value={row.values[column.id] ?? ""}
                                onChange={(event) =>
                                  updateSchoolApplicationCell(
                                    row.id,
                                    column.id,
                                    event.target.value,
                                  )
                                }
                              />
                            ))}
                            <button
                              aria-label={`删除院校申请第 ${rowIndex + 1} 行`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-500"
                              type="button"
                              onClick={() => removeSchoolApplicationRow(row.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="px-1 py-2 text-sm text-slate-500">
                          尚未识别院校申请记录，可上传 Excel 或手动新增院校。
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
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
                  aria-label={`拖动时间点 ${index + 1}`}
                  className="grid cursor-grab gap-2 rounded-lg border border-slate-200 p-3 active:cursor-grabbing md:grid-cols-[36px_1fr_1fr_120px_auto_auto]"
                  draggable
                  key={item.id}
                  onDragEnd={() => setDraggedTimelineItem(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggedTimelineItem(item.id)}
                  onDrop={() => {
                    if (draggedTimelineItem) {
                      moveTimelineItemTo(draggedTimelineItem, item.id);
                    }
                  }}
                >
                  <span
                    className="flex h-10 items-center justify-center self-end rounded-lg border border-slate-200 bg-slate-50 text-slate-400"
                    title="拖动调整顺序"
                  >
                    <GripVertical className="h-4 w-4" aria-hidden />
                  </span>
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">报告预览</h2>
            <button
              aria-label="放大报告预览"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
              title="放大查看"
              type="button"
              onClick={() => setIsPreviewExpanded(true)}
            >
              <Maximize2 className="h-4 w-4" aria-hidden />
              放大查看
            </button>
          </div>
          <div className="cursor-zoom-in overflow-auto rounded-lg bg-slate-100 p-2" onDoubleClick={() => setIsPreviewExpanded(true)}>
            <div className="mx-auto w-[1240px] origin-top-left [zoom:0.26] sm:[zoom:0.45] lg:[zoom:0.75] 2xl:[zoom:0.3]">
              {renderFusionReportDocument(false)}
            </div>
          </div>

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

      {shouldRenderExportTarget ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-20000px] top-0"
        >
          {renderFusionReportDocument(true)}
        </div>
      ) : null}

    </section>
  );
}
