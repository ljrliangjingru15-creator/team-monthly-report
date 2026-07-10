import type { ImportConfigDefinition } from "./types";

const commonSensitiveRules = [
  {
    category: "password",
    patterns: ["密码", "password", "pwd", "邮箱密码", "portal密码"],
    action: "drop_without_value_logging",
  },
  {
    category: "accountCredential",
    patterns: ["账号密码", "账密", "用户名和密码", "account/password", "ID/password"],
    action: "drop_without_value_logging",
  },
  {
    category: "phone",
    patterns: ["学生电话", "家长电话", "家庭电话", "手机号", "手机"],
    action: "drop_without_value_logging",
  },
  {
    category: "identityDocument",
    patterns: ["身份证", "护照号", "证件号"],
    action: "drop_without_value_logging",
  },
] satisfies ImportConfigDefinition["sensitiveRules"];

export const studentMasterDefaultConfig = {
  name: "总表默认配置",
  importType: "STUDENT_MASTER",
  description: "默认读取总表中的 2026申请 Sheet，主要导入学生主档、顾问分配、合同、背景与交接状态。",
  sheetRules: {
    mode: "fixed",
    sheetName: "2026申请",
  },
  headerRules: {
    headerRow: 3,
    allowHeaderAliases: true,
    normalizeWhitespace: true,
  },
  fieldMappings: [
    {
      target: "name",
      entity: "student",
      aliases: ["学生姓名", "姓名"],
      required: true,
    },
    {
      target: "counselor",
      entity: "student",
      aliases: ["预计分配后期", "后期顾问", "负责顾问"],
    },
    {
      target: "midTermCounselor",
      entity: "student",
      aliases: ["中期顾问"],
    },
    {
      target: "salesCounselor",
      entity: "student",
      aliases: ["前期顾问", "离境前期"],
    },
    {
      target: "contractNumber",
      entity: "student",
      aliases: ["合同号"],
    },
    {
      target: "contractType",
      entity: "student",
      aliases: ["合同类型", "合同模板"],
    },
    {
      target: "contractAmount",
      entity: "student",
      aliases: ["合同金额"],
      notes: "入库但后续仅管理员/组长可见。",
    },
    {
      target: "contractAmountNotes",
      entity: "student",
      aliases: ["合同金额备注"],
    },
    {
      target: "applicationType",
      entity: "student",
      aliases: ["申请类别", "条线"],
    },
    {
      target: "handoffStatus",
      entity: "schoolFinalization",
      aliases: ["定校交接", "选校报完成", "系统定校数量", "合同定校数量"],
    },
    {
      target: "currentSchool",
      entity: "student",
      aliases: ["在读院校"],
    },
    {
      target: "highSchoolType",
      entity: "student",
      aliases: ["高中类型"],
    },
    {
      target: "curriculum",
      entity: "student",
      aliases: ["课程体系"],
    },
    {
      target: "applicationIdentity",
      entity: "student",
      aliases: ["申请身份"],
    },
    {
      target: "visaStatus",
      entity: "student",
      aliases: ["签证情况"],
    },
    {
      target: "gpa",
      entity: "student",
      aliases: ["GPA"],
    },
    {
      target: "languageScore",
      entity: "student",
      aliases: ["语言", "语言成绩"],
    },
    {
      target: "standardizedTest",
      entity: "student",
      aliases: ["标化", "标化成绩"],
    },
    {
      target: "apIbALevel",
      entity: "student",
      aliases: ["AP", "课程背景"],
    },
    {
      target: "backgroundSummary",
      entity: "student",
      aliases: ["背景"],
    },
    {
      target: "posterBackground",
      entity: "student",
      aliases: ["喜报用背景"],
    },
    {
      target: "specialNotes",
      entity: "student",
      aliases: ["特殊情况备注", "交接备注"],
    },
  ],
  skippedFields: ["学生电话", "家长电话", "家庭电话", "手机号", "账号", "密码", "账密"],
  sensitiveRules: commonSensitiveRules,
  studentMatchRules: [
    {
      strategy: "contract_number",
      fields: ["contractNumber"],
      onAmbiguous: "manual_review",
    },
    {
      strategy: "name_counselor_season",
      fields: ["name", "counselor", "season"],
      onAmbiguous: "manual_review",
    },
  ],
  conflictRules: {
    defaultAction: "manual_confirm",
    allowBulkConfirm: true,
    emptyCellPolicy: "do_not_overwrite",
    logConfirmedOverwrite: true,
  },
  isDefault: true,
  isActive: true,
} satisfies ImportConfigDefinition;

export const counselorProgressDefaultConfig = {
  name: "顾问进度表默认配置",
  importType: "COUNSELOR_PROGRESS",
  description: "识别顾问进度表中的多个学生 Sheet，普通结构直接解析，特殊结构进入兼容解析或人工确认。",
  sheetRules: {
    mode: "multi_sheet",
    includeHiddenSheets: false,
    studentSheetNamePattern: "序号. 学生姓名 或 学生姓名",
    specialSheetStrategy: "parse_when_possible_otherwise_review",
  },
  headerRules: {
    headerRow: 1,
    groupHeaderRow: 1,
    allowHeaderAliases: true,
    normalizeWhitespace: true,
  },
  fieldMappings: [
    {
      target: "name",
      entity: "student",
      aliases: ["学生姓名", "姓名"],
      required: true,
    },
    {
      target: "email",
      entity: "student",
      aliases: ["邮箱", "email", "Email"],
      notes: "入库但按权限展示：顾问仅本人学生可见。",
    },
    {
      target: "schoolName",
      entity: "application",
      aliases: ["申请学校", "学校", "学校名称", "University", "College"],
      required: true,
    },
    {
      target: "applicationMethod",
      entity: "application",
      aliases: ["申请方式", "申请系统", "Common App"],
    },
    {
      target: "college",
      entity: "application",
      aliases: ["学院", "college"],
    },
    {
      target: "major",
      entity: "application",
      aliases: ["专业", "申请专业", "major"],
    },
    {
      target: "round",
      entity: "application",
      aliases: ["轮次", "申请轮次", "ED/EA/RD"],
    },
    {
      target: "deadline",
      entity: "application",
      aliases: ["截止日期", "DDL", "Deadline"],
    },
    {
      target: "interviewStatus",
      entity: "application",
      aliases: ["面试", "面试状态", "Interview"],
    },
    {
      target: "materialStatus",
      entity: "application",
      aliases: ["材料", "材料状态", "Checklist"],
    },
    {
      target: "submittedAt",
      entity: "application",
      aliases: ["递交日期", "提交日期", "submit date"],
    },
    {
      target: "applicationStatus",
      entity: "application",
      aliases: ["申请状态", "完成情况", "completion stage"],
    },
    {
      target: "result",
      entity: "admissionResult",
      aliases: ["录取结果", "结果", "申请结果", "result"],
    },
    {
      target: "enrollmentStatus",
      entity: "admissionResult",
      aliases: ["入读", "确认入读", "押金", "enrollment"],
    },
  ],
  skippedFields: [
    "学生电话",
    "家长电话",
    "家庭电话",
    "手机号",
    "账号",
    "密码",
    "account",
    "password",
    "ID/password",
  ],
  sensitiveRules: commonSensitiveRules,
  studentMatchRules: [
    {
      strategy: "name_counselor_season",
      fields: ["name", "counselor", "season"],
      onAmbiguous: "manual_review",
    },
  ],
  applicationMatchRules: [
    {
      strategy: "student_school_major_round",
      fields: ["studentId", "schoolName", "major", "round"],
      onAmbiguous: "manual_review",
    },
  ],
  conflictRules: {
    defaultAction: "manual_confirm",
    allowBulkConfirm: true,
    emptyCellPolicy: "do_not_overwrite",
    logConfirmedOverwrite: true,
  },
  isDefault: true,
  isActive: true,
} satisfies ImportConfigDefinition;

export const defaultImportConfigs = [
  studentMasterDefaultConfig,
  counselorProgressDefaultConfig,
] as const;
