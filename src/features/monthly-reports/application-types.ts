export const APPLICATION_TYPE_OPTIONS = [
  "美国本科新生",
  "美国本科转学",
  "美国中学",
  "加拿大中学",
  "加拿大本科",
  "美国硕博",
  "加拿大硕博",
  "综合评价申请",
  "中外合办申请",
] as const;

export type MonthlyReportApplicationType =
  (typeof APPLICATION_TYPE_OPTIONS)[number];

export type MonthlyReportTheme = {
  themeName: string;
  primaryColor: string;
  primaryDarkColor: string;
  primarySoftColor: string;
  secondaryColor: string;
  secondarySoftColor: string;
  backgroundColor: string;
  cardColor: string;
  titleColor: string;
  textColor: string;
  mutedTextColor: string;
  timelineCompletedColor: string;
  timelineCurrentColor: string;
  timelinePendingColor: string;
  accentColor: string;
  gradient: string;
  fontFamily: string;
};

export type MonthlyReportModuleTitles = {
  timeline: string;
  schoolProgress: string;
  completedThisMonth: string;
  nextMonthPlan: string;
  nextStageFocus: string;
  clientTasks: string;
};

export type MonthlyReportApplicationConfig = {
  applicationType: MonthlyReportApplicationType;
  templateName: string;
  theme: MonthlyReportTheme;
  timeline: string[];
  stageKeywords: string[];
  moduleTitles: MonthlyReportModuleTitles;
  defaultContent: {
    completedThisMonth: string;
    nextMonthPlan: string;
    nextStageFocus: string;
    clientTasks: string[];
  };
  exportStyle: {
    defaultFormats: ReadonlyArray<"PDF" | "PNG">;
    fileNameSeparator: "_";
    reportLabel: "反馈报告";
  };
  attachmentRules: {
    enabled: boolean;
    displayMode: "summary" | "list";
    labels: string[];
  };
  todoRules: {
    enabled: boolean;
    keywords: string[];
  };
};

const baseModuleTitles: MonthlyReportModuleTitles = {
  timeline: "申请时间轴",
  schoolProgress: "院校申请进度",
  completedThisMonth: "本月完成情况",
  nextMonthPlan: "下月计划",
  nextStageFocus: "下一阶段重点",
  clientTasks: "需要学生/家庭配合",
};

const baseExportStyle = {
  defaultFormats: ["PDF", "PNG"],
  fileNameSeparator: "_",
  reportLabel: "反馈报告",
} as const;

const configs: Record<MonthlyReportApplicationType, MonthlyReportApplicationConfig> = {
  美国本科新生: {
    applicationType: "美国本科新生",
    templateName: "美国本科申请阶段报告",
    theme: {
      themeName: "美国本科",
      primaryColor: "#2563eb",
      primaryDarkColor: "#1e3a8a",
      primarySoftColor: "#eff6ff",
      secondaryColor: "#f59e0b",
      secondarySoftColor: "#fff7ed",
      backgroundColor: "#f8fafc",
      cardColor: "#ffffff",
      titleColor: "#172554",
      textColor: "#1f2937",
      mutedTextColor: "#64748b",
      timelineCompletedColor: "#047857",
      timelineCurrentColor: "#3730a3",
      timelinePendingColor: "#cbd5e1",
      accentColor: "#f59e0b",
      gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 68%, #38bdf8 100%)",
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    timeline: [
      "文书素材收集",
      "主文书写作",
      "早申定校定专",
      "早申请准备",
      "早申请提交",
      "UC申请准备",
      "UC申请提交",
      "常规申请准备",
      "常规申请提交",
      "申请状态跟进",
      "确认入读",
      "行前准备",
      "签证准备",
    ],
    stageKeywords: ["Common App", "UC", "主文书", "附加文书", "EA", "ED", "RD"],
    moduleTitles: baseModuleTitles,
    defaultContent: {
      completedThisMonth: "本月围绕美本新生申请规划推进，具体进展待顾问补充。",
      nextMonthPlan: "下月继续推进选校、文书、系统填写或材料确认事项。",
      nextStageFocus: "下一阶段重点关注申请材料完整度、文书推进节奏和递交节点。",
      clientTasks: ["按顾问要求补充活动、文书素材或申请系统信息。"],
    },
    exportStyle: baseExportStyle,
    attachmentRules: {
      enabled: true,
      displayMode: "summary",
      labels: ["文书", "活动列表", "申请系统截图", "推荐信材料"],
    },
    todoRules: {
      enabled: true,
      keywords: ["补充", "确认", "上传", "签字", "缴费", "提交"],
    },
  },
  美国本科转学: {
    applicationType: "美国本科转学",
    templateName: "美国本科申请阶段报告",
    theme: {
      themeName: "转学申请",
      primaryColor: "#5046e5",
      primaryDarkColor: "#211a74",
      primarySoftColor: "#eef2ff",
      secondaryColor: "#10b981",
      secondarySoftColor: "#ddf7ed",
      backgroundColor: "#f8fafc",
      cardColor: "#ffffff",
      titleColor: "#312e81",
      textColor: "#1f2937",
      mutedTextColor: "#6b7280",
      timelineCompletedColor: "#047857",
      timelineCurrentColor: "#3730a3",
      timelinePendingColor: "#cbd5e1",
      accentColor: "#7c3aed",
      gradient: "linear-gradient(135deg, #211a74 0%, #5046e5 66%, #7c3aed 100%)",
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    timeline: [
      "文书素材收集",
      "文书写作沟通",
      "定校定专",
      "申请系统准备",
      "申请提交",
      "申请状态跟进",
      "确认入读",
      "行前准备",
      "签证准备",
    ],
    stageKeywords: ["转学", "成绩单", "课程信息", "学分", "选校"],
    moduleTitles: baseModuleTitles,
    defaultContent: {
      completedThisMonth: "本月围绕转学路径和材料准备推进，具体进展待顾问补充。",
      nextMonthPlan: "下月继续推进课程信息、转学文书、推荐信或系统填写事项。",
      nextStageFocus: "下一阶段重点关注转学定位、课程匹配度和递交材料完整度。",
      clientTasks: ["补充大学课程、成绩单、在读证明或推荐人信息。"],
    },
    exportStyle: baseExportStyle,
    attachmentRules: {
      enabled: true,
      displayMode: "list",
      labels: ["成绩单", "课程描述", "文书", "推荐信"],
    },
    todoRules: {
      enabled: true,
      keywords: ["成绩单", "课程", "推荐信", "补充", "确认"],
    },
  },
  美国中学: {
    applicationType: "美国中学",
    templateName: "美国留学申请阶段报告",
    theme: {
      themeName: "中学申请",
      primaryColor: "#0f766e",
      primaryDarkColor: "#134e4a",
      primarySoftColor: "#ecfdf5",
      secondaryColor: "#f97316",
      secondarySoftColor: "#ffedd5",
      backgroundColor: "#f8fafc",
      cardColor: "#ffffff",
      titleColor: "#134e4a",
      textColor: "#1f2937",
      mutedTextColor: "#64748b",
      timelineCompletedColor: "#047857",
      timelineCurrentColor: "#3730a3",
      timelinePendingColor: "#cbd5e1",
      accentColor: "#f97316",
      gradient: "linear-gradient(135deg, #134e4a 0%, #0f766e 65%, #2dd4bf 100%)",
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    timeline: [
      "文书素材收集",
      "确定申请学校",
      "文书写作沟通",
      "申请系统准备",
      "申请提交",
      "申请状态跟进",
      "确认入读",
      "行前准备",
      "签证准备",
    ],
    stageKeywords: ["标化", "面试", "问答", "成绩单", "推荐信"],
    moduleTitles: baseModuleTitles,
    defaultContent: {
      completedThisMonth: "本月围绕低龄申请准备和面试节奏推进，具体进展待顾问补充。",
      nextMonthPlan: "下月继续推进学校名单、材料、面试或申请系统事项。",
      nextStageFocus: "下一阶段重点关注学生表达准备、材料准确性和家校配合节奏。",
      clientTasks: ["按清单补充成绩单、推荐材料、面试素材或家庭信息。"],
    },
    exportStyle: baseExportStyle,
    attachmentRules: {
      enabled: true,
      displayMode: "summary",
      labels: ["成绩单", "推荐材料", "问答素材", "面试反馈"],
    },
    todoRules: {
      enabled: true,
      keywords: ["面试", "成绩单", "推荐", "补充", "确认"],
    },
  },
  加拿大中学: {
    applicationType: "加拿大中学",
    templateName: "加拿大申请阶段反馈报告",
    theme: {
      themeName: "中学申请",
      primaryColor: "#dc2626",
      primaryDarkColor: "#7f1d1d",
      primarySoftColor: "#fef2f2",
      secondaryColor: "#2563eb",
      secondarySoftColor: "#dbeafe",
      backgroundColor: "#f8fafc",
      cardColor: "#ffffff",
      titleColor: "#7f1d1d",
      textColor: "#1f2937",
      mutedTextColor: "#78716c",
      timelineCompletedColor: "#047857",
      timelineCurrentColor: "#3730a3",
      timelinePendingColor: "#cbd5e1",
      accentColor: "#2563eb",
      gradient: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 64%, #fb7185 100%)",
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    timeline: [
      "文书素材收集",
      "签证方案规划",
      "确定申请学校",
      "文书写作沟通",
      "申请系统准备",
      "申请提交",
      "申请状态跟进",
      "确认入读",
      "签证准备",
      "行前准备",
    ],
    stageKeywords: ["监护", "住宿", "签证", "成绩单", "在读证明"],
    moduleTitles: baseModuleTitles,
    defaultContent: {
      completedThisMonth: "本月围绕加拿大中学申请材料和后续衔接推进，具体进展待顾问补充。",
      nextMonthPlan: "下月继续推进申请表、补件、录取后监护住宿或签证衔接事项。",
      nextStageFocus: "下一阶段重点关注材料清单完整度、补件响应和入读衔接安排。",
      clientTasks: ["补充成绩单、在读证明、监护住宿或签证衔接所需信息。"],
    },
    exportStyle: baseExportStyle,
    attachmentRules: {
      enabled: true,
      displayMode: "list",
      labels: ["成绩单", "在读证明", "推荐材料", "监护住宿材料"],
    },
    todoRules: {
      enabled: true,
      keywords: ["监护", "住宿", "签证", "补件", "确认"],
    },
  },
  加拿大本科: {
    applicationType: "加拿大本科",
    templateName: "加拿大申请阶段反馈报告",
    theme: {
      themeName: "本科申请",
      primaryColor: "#be123c",
      primaryDarkColor: "#881337",
      primarySoftColor: "#fff1f2",
      secondaryColor: "#0ea5e9",
      secondarySoftColor: "#e0f2fe",
      backgroundColor: "#f8fafc",
      cardColor: "#ffffff",
      titleColor: "#7f1d1d",
      textColor: "#1f2937",
      mutedTextColor: "#64748b",
      timelineCompletedColor: "#047857",
      timelineCurrentColor: "#3730a3",
      timelinePendingColor: "#cbd5e1",
      accentColor: "#0ea5e9",
      gradient: "linear-gradient(135deg, #881337 0%, #be123c 64%, #f43f5e 100%)",
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    timeline: [
      "文书素材收集",
      "签证方案规划",
      "确定申请学校",
      "文书写作沟通",
      "申请系统准备",
      "申请提交",
      "申请状态跟进",
      "确认入读",
      "签证准备",
      "行前准备",
    ],
    stageKeywords: ["OUAC", "院校系统", "成绩", "补充材料", "接受录取"],
    moduleTitles: baseModuleTitles,
    defaultContent: {
      completedThisMonth: "本月围绕加拿大本科院校与专业申请推进，具体进展待顾问补充。",
      nextMonthPlan: "下月继续推进 OUAC、院校系统、成绩材料或补充材料事项。",
      nextStageFocus: "下一阶段重点关注院校系统节点、成绩材料和录取后接受流程。",
      clientTasks: ["补充成绩材料、专业确认信息或院校系统所需内容。"],
    },
    exportStyle: baseExportStyle,
    attachmentRules: {
      enabled: true,
      displayMode: "summary",
      labels: ["成绩材料", "OUAC 信息", "补充材料", "录取文件"],
    },
    todoRules: {
      enabled: true,
      keywords: ["OUAC", "成绩", "补充材料", "接受录取", "确认"],
    },
  },
  美国硕博: {
    applicationType: "美国硕博",
    templateName: "美国硕博申请阶段报告",
    theme: {
      themeName: "美国硕博",
      primaryColor: "#334155",
      primaryDarkColor: "#0f172a",
      primarySoftColor: "#f1f5f9",
      secondaryColor: "#0d9488",
      secondarySoftColor: "#ccfbf1",
      backgroundColor: "#f8fafc",
      cardColor: "#ffffff",
      titleColor: "#0f172a",
      textColor: "#1f2937",
      mutedTextColor: "#64748b",
      timelineCompletedColor: "#047857",
      timelineCurrentColor: "#3730a3",
      timelinePendingColor: "#cbd5e1",
      accentColor: "#0d9488",
      gradient: "linear-gradient(135deg, #0f172a 0%, #334155 66%, #0d9488 100%)",
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    timeline: [
      "文书素材收集",
      "简历CV写作",
      "推荐信RL写作",
      "主文书SOP写作",
      "附加文书写作",
      "第一所院校提交",
      "第二所院校提交",
      "第三所院校提交",
      "第四所院校提交",
      "第五所院校提交",
      "第六所院校提交",
      "第七所院校提交",
      "第八所院校提交",
      "第九所院校提交",
      "第十所院校提交",
      "结果跟踪",
      "确认入读",
      "行前准备",
      "签证准备",
    ],
    stageKeywords: ["CV", "RL", "SOP", "推荐信", "硕博", "研究生"],
    moduleTitles: baseModuleTitles,
    defaultContent: {
      completedThisMonth: "本月围绕美国硕博申请材料、文书与院校递交推进，具体进展待顾问补充。",
      nextMonthPlan: "下月继续推进 CV、推荐信、SOP、附加文书或院校系统递交事项。",
      nextStageFocus: "下一阶段重点关注文书完整度、推荐信进度和各院校递交节点。",
      clientTasks: ["补充 CV 经历、推荐人信息、SOP 素材或院校系统所需材料。"],
    },
    exportStyle: baseExportStyle,
    attachmentRules: {
      enabled: true,
      displayMode: "list",
      labels: ["CV", "推荐信", "SOP", "附加文书", "院校提交截图"],
    },
    todoRules: {
      enabled: true,
      keywords: ["CV", "RL", "SOP", "推荐信", "提交", "确认"],
    },
  },
  加拿大硕博: {
    applicationType: "加拿大硕博",
    templateName: "加拿大申请阶段反馈报告",
    theme: {
      themeName: "加拿大硕博",
      primaryColor: "#9f1239",
      primaryDarkColor: "#4c0519",
      primarySoftColor: "#fff1f2",
      secondaryColor: "#0f766e",
      secondarySoftColor: "#ccfbf1",
      backgroundColor: "#f8fafc",
      cardColor: "#ffffff",
      titleColor: "#4c0519",
      textColor: "#1f2937",
      mutedTextColor: "#64748b",
      timelineCompletedColor: "#047857",
      timelineCurrentColor: "#3730a3",
      timelinePendingColor: "#cbd5e1",
      accentColor: "#0f766e",
      gradient: "linear-gradient(135deg, #4c0519 0%, #9f1239 64%, #0f766e 100%)",
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    timeline: [
      "文书素材收集",
      "文书写作",
      "院校提交",
      "结果跟踪",
      "确认入读",
      "行前准备",
      "签证准备",
    ],
    stageKeywords: ["硕博", "研究生", "文书", "导师", "院校提交"],
    moduleTitles: baseModuleTitles,
    defaultContent: {
      completedThisMonth: "本月围绕加拿大硕博申请材料、文书与院校递交推进，具体进展待顾问补充。",
      nextMonthPlan: "下月继续推进文书修改、院校提交、结果跟踪或录取后衔接事项。",
      nextStageFocus: "下一阶段重点关注文书质量、院校系统节点和结果跟踪安排。",
      clientTasks: ["补充文书素材、成绩材料、推荐人信息或院校系统所需内容。"],
    },
    exportStyle: baseExportStyle,
    attachmentRules: {
      enabled: true,
      displayMode: "summary",
      labels: ["文书材料", "成绩材料", "推荐材料", "院校提交截图"],
    },
    todoRules: {
      enabled: true,
      keywords: ["文书", "导师", "提交", "结果", "确认"],
    },
  },
  综合评价申请: {
    applicationType: "综合评价申请",
    templateName: "综合评价申请反馈报告",
    theme: {
      themeName: "广东省",
      primaryColor: "#7c2d12",
      primaryDarkColor: "#431407",
      primarySoftColor: "#fff7ed",
      secondaryColor: "#ca8a04",
      secondarySoftColor: "#fef9c3",
      backgroundColor: "#f8fafc",
      cardColor: "#ffffff",
      titleColor: "#431407",
      textColor: "#1f2937",
      mutedTextColor: "#64748b",
      timelineCompletedColor: "#047857",
      timelineCurrentColor: "#3730a3",
      timelinePendingColor: "#cbd5e1",
      accentColor: "#ca8a04",
      gradient: "linear-gradient(135deg, #431407 0%, #7c2d12 64%, #ca8a04 100%)",
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    timeline: [
      "学生背景梳理",
      "院校与专业方向确认",
      "报名条件核查",
      "申请材料准备",
      "报名系统填写",
      "材料审核",
      "校测 / 面试准备",
      "入围结果",
      "录取结果",
      "入读确认",
    ],
    stageKeywords: ["报名条件", "报名系统", "材料审核", "校测", "入围"],
    moduleTitles: baseModuleTitles,
    defaultContent: {
      completedThisMonth: "本月围绕综合评价申请条件与材料推进，具体进展待顾问补充。",
      nextMonthPlan: "下月继续推进报名条件核查、系统填写、材料审核或校测准备事项。",
      nextStageFocus: "下一阶段重点关注政策条件、材料合规性和校测面试准备。",
      clientTasks: ["补充综评报名材料、奖项证明、活动证明或校测准备素材。"],
    },
    exportStyle: baseExportStyle,
    attachmentRules: {
      enabled: true,
      displayMode: "list",
      labels: ["报名材料", "奖项证明", "活动证明", "校测素材"],
    },
    todoRules: {
      enabled: true,
      keywords: ["报名", "审核", "校测", "入围", "证明"],
    },
  },
  中外合办申请: {
    applicationType: "中外合办申请",
    templateName: "中外合办多元路径反馈报告",
    theme: {
      themeName: "大湾区",
      primaryColor: "#0f4c81",
      primaryDarkColor: "#082f49",
      primarySoftColor: "#e0f2fe",
      secondaryColor: "#a16207",
      secondarySoftColor: "#fef3c7",
      backgroundColor: "#f8fafc",
      cardColor: "#ffffff",
      titleColor: "#082f49",
      textColor: "#1f2937",
      mutedTextColor: "#64748b",
      timelineCompletedColor: "#047857",
      timelineCurrentColor: "#3730a3",
      timelinePendingColor: "#cbd5e1",
      accentColor: "#a16207",
      gradient: "linear-gradient(135deg, #082f49 0%, #0f4c81 66%, #0369a1 100%)",
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    timeline: [
      "学生背景梳理",
      "院校与专业方向确认",
      "报名条件核查",
      "申请材料准备",
      "报名系统填写",
      "材料审核",
      "校测 / 面试准备",
      "入围结果",
      "录取结果",
      "入读确认",
    ],
    stageKeywords: ["项目", "合办", "报名条件", "笔试", "面试"],
    moduleTitles: baseModuleTitles,
    defaultContent: {
      completedThisMonth: "本月围绕中外合办项目申请路径推进，具体进展待顾问补充。",
      nextMonthPlan: "下月继续推进项目名单、报名条件、材料、笔试或面试准备事项。",
      nextStageFocus: "下一阶段重点关注项目匹配度、报名条件和笔面试准备节奏。",
      clientTasks: ["补充项目报名信息、文书面试素材或笔试准备相关材料。"],
    },
    exportStyle: baseExportStyle,
    attachmentRules: {
      enabled: true,
      displayMode: "summary",
      labels: ["报名材料", "文书材料", "面试素材", "笔试安排"],
    },
    todoRules: {
      enabled: true,
      keywords: ["项目", "报名", "笔试", "面试", "确认"],
    },
  },
};

export const DEFAULT_APPLICATION_TYPE: MonthlyReportApplicationType = "美国本科新生";

const legacyApplicationTypeMap: Record<string, MonthlyReportApplicationType> = {
  美本: "美国本科新生",
  美本新生: "美国本科新生",
  美本转学: "美国本科转学",
  美高: "美国中学",
  加高: "加拿大中学",
  加本: "加拿大本科",
  美研: "美国硕博",
  美国研究生: "美国硕博",
  美国硕士: "美国硕博",
  美国博士: "美国硕博",
  加研: "加拿大硕博",
  加拿大研究生: "加拿大硕博",
  加拿大硕士: "加拿大硕博",
  加拿大博士: "加拿大硕博",
  综评: "综合评价申请",
  中外合办: "中外合办申请",
};

export function normalizeMonthlyReportApplicationType(
  value: string | null | undefined,
): MonthlyReportApplicationType {
  if (!value) return DEFAULT_APPLICATION_TYPE;
  if (APPLICATION_TYPE_OPTIONS.includes(value as MonthlyReportApplicationType)) {
    return value as MonthlyReportApplicationType;
  }

  return legacyApplicationTypeMap[value] ?? DEFAULT_APPLICATION_TYPE;
}

export function getMonthlyReportApplicationConfig(
  value: string | null | undefined,
) {
  return configs[normalizeMonthlyReportApplicationType(value)];
}
