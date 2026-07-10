import type { ExportConfigDefinition } from "./types";

const externalAlwaysHide = [
  "contractAmount",
  "studentPhone",
  "parentPhone",
  "password",
  "accountPassword",
  "portalPassword",
  "internalResponsibility",
  "internalHandoffNotes",
];

export const monthlyReportExportConfig = {
  name: "月度反馈默认模板",
  kind: "MONTHLY_REPORT",
  description: "对外客户月度反馈，支持预览并导出 PDF/PNG。",
  templateKey: "monthly-report-basic",
  fieldRules: {
    include: [
      "studentName",
      "season",
      "schoolProgress",
      "completedThisMonth",
      "nextMonthPlan",
      "nextStageFocus",
      "clientTasks",
    ],
    exclude: externalAlwaysHide,
  },
  templateRules: {
    sections: ["基础信息", "院校申请进度", "本月完成情况", "下月计划", "下一阶段重点"],
    editableSections: ["本月完成情况", "下月计划", "下一阶段重点"],
  },
  styleRules: {
    outputFormats: ["PDF", "PNG"],
    pageSize: "A4",
    theme: "clean-client-facing",
  },
  watermarkRules: {
    enabled: false,
  },
  redactionRules: {
    audience: "external",
    alwaysHide: externalAlwaysHide,
    roleLimited: ["email"],
  },
  isDefault: true,
  isActive: true,
} satisfies ExportConfigDefinition;

export const admissionPosterExportConfig = {
  name: "录取喜报基础模板",
  kind: "ADMISSION_POSTER",
  description: "从录取结果生成基础可对外使用的 PNG/PDF 喜报。",
  templateKey: "admission-poster-basic",
  fieldRules: {
    include: ["studentName", "schoolName", "result", "posterBackground", "counselor"],
    exclude: externalAlwaysHide,
  },
  templateRules: {
    sections: ["标题", "录取学校", "学生背景", "服务团队"],
    editableSections: ["标题", "学生背景"],
  },
  styleRules: {
    outputFormats: ["PNG", "PDF"],
    pageSize: "POSTER",
    theme: "clean-poster",
  },
  watermarkRules: {
    enabled: true,
    text: "仅供申请服务反馈使用",
  },
  redactionRules: {
    audience: "external",
    alwaysHide: externalAlwaysHide,
  },
  isDefault: true,
  isActive: true,
} satisfies ExportConfigDefinition;

export const internalCaseExportConfig = {
  name: "内部案例默认模板",
  kind: "INTERNAL_CASE",
  description: "内部成功案例和经验沉淀模板。",
  templateKey: "internal-case-basic",
  fieldRules: {
    include: [
      "studentName",
      "schoolName",
      "season",
      "backgroundSummary",
      "challenge",
      "handling",
      "outcome",
      "reusableInsight",
      "internalTags",
    ],
    exclude: ["password", "accountPassword", "portalPassword", "studentPhone", "parentPhone"],
  },
  templateRules: {
    sections: ["背景", "挑战", "处理方式", "结果", "可复用经验"],
    editableSections: ["挑战", "处理方式", "可复用经验"],
  },
  styleRules: {
    outputFormats: ["PDF"],
    pageSize: "A4",
    theme: "internal-brief",
  },
  watermarkRules: {
    enabled: true,
    text: "内部资料",
  },
  redactionRules: {
    audience: "internal",
    alwaysHide: ["password", "accountPassword", "portalPassword", "studentPhone", "parentPhone"],
    roleLimited: ["contractAmount"],
  },
  isDefault: true,
  isActive: true,
} satisfies ExportConfigDefinition;

export const listExcelExportConfig = {
  name: "列表 Excel 默认导出",
  kind: "LIST_EXCEL",
  description: "学生、申请、录取、问题列表的基础 Excel 导出字段配置。",
  templateKey: "list-excel-basic",
  fieldRules: {
    include: [
      "studentName",
      "counselor",
      "schoolName",
      "round",
      "deadline",
      "applicationStatus",
      "result",
      "riskLevel",
    ],
    exclude: externalAlwaysHide,
  },
  styleRules: {
    outputFormats: ["XLSX"],
    theme: "table",
  },
  redactionRules: {
    audience: "internal",
    alwaysHide: ["password", "accountPassword", "portalPassword", "studentPhone", "parentPhone"],
    roleLimited: ["contractAmount", "email"],
  },
  isDefault: true,
  isActive: true,
} satisfies ExportConfigDefinition;

export const defaultExportConfigs = [
  monthlyReportExportConfig,
  admissionPosterExportConfig,
  internalCaseExportConfig,
  listExcelExportConfig,
] as const;
