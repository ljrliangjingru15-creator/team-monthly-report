import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const offlineDir = join(process.cwd(), "offline");
const htmlPath = join(offlineDir, "2027申请管理单机版.html");
const xlsxPath = join(offlineDir, "vendor", "xlsx.full.min.js");

function createOfflineRuntime() {
  const html = readFileSync(htmlPath, "utf8");
  const script = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!script) throw new Error("Offline page script not found");

  const elements = new Map<string, any>();
  const makeElement = (id = "") => ({
    id,
    value: "",
    textContent: "",
    disabled: false,
    _innerHTML: "",
    files: [],
    dataset: {},
    classList: {
      contains: () => false,
      add: () => undefined,
      remove: () => undefined,
    },
    addEventListener: () => undefined,
    click: () => undefined,
    get innerHTML() {
      return this._innerHTML;
    },
    set innerHTML(value) {
      this._innerHTML = String(value);
    },
    get options() {
      return [...this._innerHTML.matchAll(/<option[^>]*value="([^"]*)"/g)].map(match => ({ value: match[1] }));
    },
  });
  const getElement = (id: string) => {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  };

  const context = vm.createContext({
    console,
    Date,
    Math,
    JSON,
    String,
    Number,
    RegExp,
    Array,
    Object,
    Blob: function Blob() {},
    URL: { createObjectURL: () => "", revokeObjectURL: () => undefined },
    confirm: () => true,
    localStorage: {
      getItem: () => null,
      setItem: () => undefined,
    },
    document: {
      getElementById: getElement,
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => makeElement(),
    },
    XLSX: {
      read: () => ({}),
      utils: {
        sheet_to_json: (sheet: { rows: unknown[][] }) => sheet.rows,
      },
    },
  });

  vm.runInContext(script, context);
  return context as typeof context & {
    buildImportPreview: (workbook: unknown, fileName: string) => {
      createdStudents: Array<Record<string, string>>;
      createdApplications: Array<Record<string, string>>;
      review: string[];
    };
  };
}

describe("C1 offline single-machine version", () => {
  it("ships a double-clickable local HTML app with local spreadsheet parser", () => {
    expect(existsSync(htmlPath)).toBe(true);
    expect(existsSync(xlsxPath)).toBe(true);

    const html = readFileSync(htmlPath, "utf8");

    expect(html).toContain("./vendor/xlsx.full.min.js");
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).toContain("2027 申请管理单机版");
    expect(html).toContain("导入 Excel");
    expect(html).toContain("学生视图");
    expect(html).toContain("申请视图");
    expect(html).toContain("DDL 风险");
    expect(html).toContain("月度反馈");
    expect(html).toContain("喜报/海报");
    expect(html).toContain("案例/经验库");
    expect(html).toContain("导出备份");
    expect(html).toContain("导入备份");
  });

  it("supports import preview, explicit confirmation, and undo in offline mode", () => {
    const html = readFileSync(htmlPath, "utf8");

    expect(html).toContain("导入预览");
    expect(html).toContain("确认合并到本机数据");
    expect(html).toContain("撤销最近一次导入");
    expect(html).toContain("pendingImportPreview");
    expect(html).toContain("buildImportPreview");
    expect(html).toContain("commitPendingImportPreview");
    expect(html).toContain("undoLastImport");
    expect(html).toContain("新增学生");
    expect(html).toContain("更新学生");
    expect(html).toContain("新增申请项");
    expect(html).toContain("更新申请项");
    expect(html).toContain("需人工确认");
    expect(html).toContain("敏感字段已拦截");
  });

  it("supports C1.3 counselor-sheet parsing, filters, and DDL completion rules", () => {
    const html = readFileSync(htmlPath, "utf8");

    expect(html).toContain("inferCounselorName");
    expect(html).toContain("lastStudentName");
    expect(html).toContain("sourceSheet");
    expect(html).toContain("studentCounselorFilter");
    expect(html).toContain("studentNameFilter");
    expect(html).toContain("appCounselorFilter");
    expect(html).toContain("appStudentFilter");
    expect(html).toContain("appSchoolFilter");
    expect(html).toContain("appDdlFilter");
    expect(html).toContain("appResultFilter");
    expect(html).toContain("filterStudents");
    expect(html).toContain("filterApplications");
    expect(html).toContain("isApplicationCompleted");
    expect(html).toContain("studentDataQualityNotice");
    expect(html).toContain("looksLikeSheetOnlyStudent");
    expect(html).toContain("旧版顾问 Sheet 占位数据");
    expect(html).toContain("放弃申请");
    expect(html).toContain("withdrawn");
    expect(html).toContain("sheetRole");
    expect(html).toContain("顾问 Sheet");
  });

  it("parses real-world counselor sheets without losing students or shifting schools", () => {
    const runtime = createOfflineRuntime();
    const workbook = {
      SheetNames: ["冯莉莉美本", "1. 刘博恺(有IV)"],
      Sheets: {
        "冯莉莉美本": {
          rows: [
            ["", "申请大学英文名称", "合作/直申", "申请学院", "专业", "申请轮次", "申请截止时间", "录取结果"],
            ["王紫嫣", "Cornell University", "直申", "College of Agriculture", "Information Science", "ED", "2025.11.1", ""],
            ["University of Michigan Ann Arbor", "直申", "College of Literature", "Statistics", "EA", "2025.11.1", "waitlist"],
          ],
        },
        "1. 刘博恺(有IV)": {
          rows: [
            ["学生姓名", "合同类型", "入学时间", "前期顾问", "中期顾问", "学生电话", "家长电话", "就读高中", "托福/雅思登录账号和密码", "申请大学英文名称", "合作/直申", "申请学院", "专业", "申请截止时间", "录取结果"],
            ["刘博恺(GZMB2025001)", "合同", "2026秋", "前期", "中期", "", "", "高中", "账号密码", "Boston University", "直申", "CAS", "Economics", "2025.11.1", ""],
            ["账号备注不应变成学生姓名", "", "", "", "", "", "", "", "", "Northeastern University", "直申", "Explore", "Undeclared", "2025.11.1", "录取"],
          ],
        },
      },
    };

    const preview = runtime.buildImportPreview(workbook, "fixture.xlsx");

    expect(preview.review).toEqual([]);
    expect(preview.createdStudents.map(student => student.name)).toEqual(["王紫嫣", "刘博恺(GZMB2025001)"]);
    expect(preview.createdApplications.map(app => `${app.studentName}｜${app.schoolName}`)).toEqual([
      "王紫嫣｜Cornell University",
      "王紫嫣｜University of Michigan Ann Arbor",
      "刘博恺(GZMB2025001)｜Boston University",
      "刘博恺(GZMB2025001)｜Northeastern University",
    ]);
  });

  it("imports and displays the full student profile fields required by the main workbook", () => {
    const runtime = createOfflineRuntime();
    const html = readFileSync(htmlPath, "utf8");
    const workbook = {
      SheetNames: ["2026申请"],
      Sheets: {
        "2026申请": {
          rows: [
            ["说明"],
            ["说明"],
            ["统计", "不是表头"],
            ["日期标红说明", "仍然不是表头"],
            [
              "学生姓名",
              "预计分配后期",
              "中期顾问",
              "前期顾问",
              "交接备注",
              "申请类别",
              "合同号",
              "合同模板",
              "合同金额",
              "归档日期",
              "合同类型",
              "welcome letter",
              "开案邮件",
              "Initial Call/首次头脑风暴",
              "简历初稿",
              "PS outline",
              "BFT",
              "文书初稿",
              "高中类型",
              "在读院校",
              "课程体系",
              "申请身份",
              "签证情况",
              "夏校",
              "GPA",
              "语言",
              "标化",
              "AP",
              "背景",
              "喜报用背景",
            ],
            [
              "测试学生",
              "后期A",
              "中期B",
              "前期C",
              "交接备注内容",
              "美本",
              "CN-001",
              "常春藤申请合同",
              "100000",
              "2026-03-25",
              "新生",
              "已发送",
              "已发送开案邮件",
              "已完成",
              "已出",
              "已出outline",
              "已完成BFT",
              "初稿完成",
              "国际学校",
              "测试高中",
              "AP课程",
              "国际生",
              "F1",
              "参加夏校",
              "3.9",
              "TOEFL 110",
              "SAT 1500",
              "5门",
              "活动背景",
              "喜报亮点",
            ],
          ],
        },
      },
    };

    const preview = runtime.buildImportPreview(workbook, "main.xlsx");
    const student = preview.createdStudents[0];

    expect(student).toMatchObject({
      name: "测试学生",
      counselor: "后期A",
      midTermCounselor: "中期B",
      salesCounselor: "前期C",
      handoffNotes: "交接备注内容",
      applicationType: "美本",
      contractNumber: "CN-001",
      contractTemplate: "常春藤申请合同",
      contractAmount: "100000",
      archivedAt: "2026-03-25",
      contractType: "新生",
      welcomeLetter: "已发送",
      openingEmail: "已发送开案邮件",
      initialCall: "已完成",
      resumeDraft: "已出",
      psOutline: "已出outline",
      bft: "已完成BFT",
      essayDraft: "初稿完成",
      highSchoolType: "国际学校",
      currentSchool: "测试高中",
      curriculum: "AP课程",
      applicationIdentity: "国际生",
      visaStatus: "F1",
      summerSchool: "参加夏校",
      gpa: "3.9",
      languageScore: "TOEFL 110",
      standardizedTest: "SAT 1500",
      ap: "5门",
      backgroundSummary: "活动背景",
      posterBackground: "喜报亮点",
    });

    [
      "中期顾问",
      "前期顾问",
      "交接备注",
      "合同模板",
      "合同金额",
      "归档日期",
      "welcome letter",
      "开案邮件",
      "Initial Call",
      "简历初稿",
      "PS outline",
      "BFT",
      "文书初稿",
      "高中类型",
      "课程体系",
      "申请身份",
      "签证情况",
      "夏校",
      "标化",
      "AP",
      "背景",
      "喜报用背景",
    ].forEach(label => expect(html).toContain(label));
  });
});
