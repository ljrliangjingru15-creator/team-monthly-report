import * as XLSX from "xlsx";

export const masterHeaders = [
  "序号",
  "条线",
  "学生姓名",
  "预计分配后期",
  "中期顾问",
  "前期顾问",
  "交接备注",
  "特殊情况备注",
  "申请类别",
  "合同号",
  "合同类型",
  "合同金额",
  "在读院校",
  "课程体系",
  "GPA",
  "语言",
  "标化",
  "AP",
  "背景",
  "喜报用背景",
];

export const counselorHeaders = [
  "学生姓名",
  "邮箱",
  "申请学校",
  "申请方式",
  "学院",
  "专业",
  "轮次",
  "DDL",
  "面试状态",
  "材料状态",
  "提交日期",
  "申请状态",
  "录取结果",
  "学生电话",
  "账号",
  "密码",
];

export function buildMasterWorkbook() {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["2026 申请季总表"],
    ["仅用于测试的脱敏结构"],
    masterHeaders,
    [
      "1",
      "美本",
      "测试学生甲",
      "顾问甲",
      "中期甲",
      "前期甲",
      "交接备注",
      "特殊备注",
      "本科",
      "CONTRACT-001",
      "常规合同",
      "100000",
      "测试高中",
      "AP",
      "3.9",
      "TOEFL 110",
      "SAT 1500",
      "5门",
      "背景摘要",
      "喜报背景",
    ],
  ]);

  XLSX.utils.book_append_sheet(workbook, sheet, "2026申请");
  return workbook;
}

export function buildCounselorWorkbook() {
  const workbook = XLSX.utils.book_new();
  const normalSheet = XLSX.utils.aoa_to_sheet([
    counselorHeaders,
    [
      "测试学生甲",
      "student@example.com",
      "Test University",
      "Common App",
      "College of Arts",
      "Economics",
      "EA",
      "2027-01-01",
      "未安排",
      "准备中",
      "",
      "未提交",
      "",
      "不应入库的电话",
      "不应入库的账号",
      "不应入库的密码",
    ],
  ]);
  const specialSheet = XLSX.utils.aoa_to_sheet([
    ["申请学校", "完成情况", "DDL"],
    ["Special College", "文书中", "2027-02-01"],
  ]);

  XLSX.utils.book_append_sheet(workbook, normalSheet, "1. 测试学生甲");
  XLSX.utils.book_append_sheet(workbook, specialSheet, "特殊结构");
  return workbook;
}

export function buildUnknownWorkbook() {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["无关字段A", "无关字段B"],
    ["foo", "bar"],
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  return workbook;
}
