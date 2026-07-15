import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MonthlyReportsPage from "@/app/monthly-reports/page";
import {
  APPLICATION_TYPE_OPTIONS,
  getMonthlyReportApplicationConfig,
} from "@/features/monthly-reports/application-types";
import { buildMonthlyReportExportPlan } from "@/features/monthly-reports/export-plan";
import { generateMonthlyReportDraft } from "@/features/monthly-reports/generate";
import {
  buildExternalMonthlyReportPreview,
  containsForbiddenMonthlyReportContent,
} from "@/features/monthly-reports/redact";
import type { ApplicationWithStudent } from "@/features/applications/types";
import type { StudentRecord } from "@/features/students/types";

const student: StudentRecord = {
  id: "student-1",
  season: "2027 Fall",
  name: "测试学生甲",
  counselor: "顾问甲",
  applicationType: "美本",
  contractAmount: 100000,
  backgroundSummary: "背景摘要；合同金额:100000；内部责任:顾问甲",
};

const applications: ApplicationWithStudent[] = [
  {
    id: "application-1",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    season: "2027 Fall",
    schoolName: "Submitted University",
    applicationStatus: "已提交",
    submittedAt: new Date(Date.UTC(2026, 6, 1)),
    student,
  },
  {
    id: "application-2",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    season: "2027 Fall",
    schoolName: "Offer University",
    result: "accepted",
    student,
  },
  {
    id: "application-3",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    season: "2027 Fall",
    schoolName: "Todo College",
    applicationStatus: "未提交",
    student,
  },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("monthly reports page", () => {
  it("renders a focused communication feedback workspace without unrelated module entries", () => {
    render(<MonthlyReportsPage />);

    expect(
      screen.getByRole("heading", { name: "沟通反馈/月度反馈生成工作台" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "沟通内容输入" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "申请类型与主题配色" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "自动识别结果" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "模块选择" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "报告预览" })).toBeInTheDocument();
    expect(screen.getByLabelText("粘贴沟通内容")).toBeInTheDocument();
    expect(screen.getByLabelText("上传沟通记录")).toBeInTheDocument();
    expect(screen.getByLabelText("上传 Excel 表格")).toBeInTheDocument();
    expect(screen.getByLabelText("上传此前报告")).toBeInTheDocument();
    expect(screen.getByLabelText("上传附件")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "识别并生成反馈" })).toBeInTheDocument();
    expect(screen.getByLabelText("申请类型")).toHaveValue("美国本科新生");
    expect(screen.getByLabelText("申请季度")).toHaveValue("2027秋");
    expect(screen.getAllByText("美国本科转学").length).toBeGreaterThan(0);
    expect(screen.getAllByText("早申请准备").length).toBeGreaterThan(0);
    expect(screen.queryByText("学生管理")).not.toBeInTheDocument();
    expect(screen.queryByText("申请管理")).not.toBeInTheDocument();
  });

  it("shows the requested default report sections before recognition", () => {
    render(<MonthlyReportsPage />);

    const preview = screen.getByTestId("monthly-report-preview");

    [
      "学生姓名",
      "申请季度",
      "申请类型",
      "申请时间轴",
      "基础信息",
      "材料收集",
      "阶段性反馈",
      "下一阶段计划",
      "需要学生/家庭配合",
    ].forEach((sectionTitle) => {
      expect(preview).toHaveTextContent(sectionTitle);
    });

    expect(preview).not.toHaveTextContent("其他识别字段");
    expect(preview).not.toHaveTextContent("本月完成情况");
    expect(preview).not.toHaveTextContent("下月计划");
    expect(preview).not.toHaveTextContent("截图识别");
    expect(preview).not.toHaveTextContent("上传识别");
    expect(preview).not.toHaveTextContent("附件展示");
    expect(screen.getByLabelText("展示附件列表")).not.toBeChecked();
  });

  it("renders the optimized A4 export visual structure in the preview", () => {
    render(<MonthlyReportsPage />);

    const preview = screen.getByTestId("monthly-report-preview");

    expect(preview).toHaveTextContent("Application Progress Report");
    expect(preview).toHaveTextContent("测试学生甲申请季阶段性反馈报告");
    expect(preview).toHaveTextContent("关键摘要");
    expect(preview).toHaveTextContent("材料完整度");
    expect(preview).toHaveTextContent("核心学术信息");
    expect(preview).toHaveTextContent("当前就读学校");
    expect(preview).toHaveTextContent("材料项目");
    expect(preview).toHaveTextContent("状态");
    expect(preview).toHaveTextContent("备注");
    expect(preview).toHaveTextContent("下一阶段计划");
    expect(preview).toHaveTextContent("阶段性反馈");
    expect(preview).not.toHaveTextContent("报告版本");
    expect(preview).not.toHaveTextContent("免责声明");
  });

  it("uses the editable report title as the largest report heading", () => {
    render(<MonthlyReportsPage />);

    const preview = screen.getByTestId("monthly-report-preview");

    expect(screen.getByLabelText("本次报告标题")).toHaveValue(
      "测试学生甲申请季阶段性反馈报告",
    );
    expect(
      within(preview).getByRole("heading", {
        name: "测试学生甲申请季阶段性反馈报告",
        level: 3,
      }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("本次报告标题"), {
      target: { value: "王同学美国本科阶段反馈报告" },
    });

    expect(
      within(preview).getByRole("heading", {
        name: "王同学美国本科阶段反馈报告",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(preview).not.toHaveTextContent("测试学生甲申请季阶段性反馈报告");
  });

  it("renders current focus as an independent card before the summary", () => {
    render(<MonthlyReportsPage />);

    const preview = screen.getByTestId("monthly-report-preview");
    const orderedSections = within(preview).getAllByTestId("report-section");

    expect(orderedSections[0]).toHaveTextContent("当前阶段重点和下一步建议");
    expect(orderedSections[1]).toHaveTextContent("关键摘要");
    expect(within(orderedSections[0]).getByText("当前阶段重点")).toBeInTheDocument();
    expect(within(orderedSections[0]).getByText("下一步建议")).toBeInTheDocument();
  });

  it("allows report sections to be hidden, highlighted, and reordered", () => {
    render(<MonthlyReportsPage />);

    const preview = screen.getByTestId("monthly-report-preview");

    expect(screen.getByLabelText("展示关键摘要")).toBeChecked();
    fireEvent.click(screen.getByLabelText("展示关键摘要"));
    expect(preview).not.toHaveTextContent("关键摘要");

    fireEvent.click(screen.getByLabelText("展示关键摘要"));
    fireEvent.click(screen.getByLabelText("重点展示关键摘要"));
    expect(screen.getByTestId("report-section-summary")).toHaveAttribute(
      "data-highlighted",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "上移关键摘要" }));
    const orderedSections = within(preview).getAllByTestId("report-section");
    expect(orderedSections[0]).toHaveTextContent("关键摘要");
    expect(orderedSections[1]).toHaveTextContent("当前阶段重点和下一步建议");
  });

  it("shows selectable report template cards for every application type", () => {
    render(<MonthlyReportsPage />);

    const templateLibrary = screen.getByTestId("application-template-library");

    APPLICATION_TYPE_OPTIONS.forEach((option) => {
      expect(
        within(templateLibrary).getByRole("button", {
          name: `选择${option}模板`,
        }),
      ).toBeInTheDocument();
    });

    expect(
      within(templateLibrary).getByRole("button", {
        name: "选择美国本科新生模板",
        pressed: true,
      }),
    ).toBeInTheDocument();
  });

  it("switches application type and report template from the template cards", () => {
    render(<MonthlyReportsPage />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "选择综合评价申请模板",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "使用申请类型 + 报告模板 + 时间轴 + 配色",
      }),
    );

    expect(screen.getByLabelText("申请类型")).toHaveValue("综合评价申请");
    expect(screen.getByTestId("monthly-report-preview")).toHaveStyle({
      borderColor: "#7c2d12",
    });
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "综合评价申请",
    );
    expect(
      screen.getByRole("button", {
        name: "选择综合评价申请模板",
        pressed: true,
      }),
    ).toBeInTheDocument();
  });

  it("removes report template names and style labels from the workspace and preview", () => {
    render(<MonthlyReportsPage />);

    expect(screen.queryByLabelText("报告模板名称")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("报告风格标签")).not.toBeInTheDocument();
    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent(
      "美国本科申请阶段报告",
    );
  });

  it("shows the company logo and editable department label in the report preview", () => {
    render(<MonthlyReportsPage />);

    expect(screen.getByAltText("新东方")).toHaveAttribute(
      "src",
      "/new-oriental-logo-2026.png",
    );
    expect(screen.getByLabelText("部门标签")).toHaveValue(
      "广州新东方前途出国美国本科部",
    );
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "广州新东方前途出国美国本科部",
    );

    fireEvent.change(screen.getByLabelText("部门标签"), {
      target: { value: "自定义升学服务团队" },
    });

    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "自定义升学服务团队",
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "选择加拿大本科模板",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "使用申请类型 + 报告模板 + 时间轴 + 配色",
      }),
    );

    expect(screen.getByLabelText("部门标签")).toHaveValue(
      "广州新东方前途出国加拿大部",
    );
  });

  it("allows timeline text, status, additions, and removals to be edited", () => {
    render(<MonthlyReportsPage />);

    expect(screen.getByRole("heading", { name: "申请时间轴编辑" })).toBeInTheDocument();
    expect(screen.getByLabelText("时间点 1")).toHaveValue("文书素材收集");
    expect(screen.getByLabelText("点亮状态 1")).toHaveValue("completed");

    fireEvent.change(screen.getByLabelText("时间点 1"), {
      target: { value: "首次家庭沟通" },
    });
    fireEvent.change(screen.getByLabelText("点亮状态 1"), {
      target: { value: "current" },
    });

    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "首次家庭沟通",
    );
    expect(screen.getByTestId("timeline-dot-0")).toHaveStyle({
      backgroundColor: "#3730a3",
    });

    fireEvent.click(screen.getByRole("button", { name: "新增时间点" }));
    fireEvent.change(screen.getByLabelText("时间点 14"), {
      target: { value: "签证材料衔接" },
    });

    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "签证材料衔接",
    );

    fireEvent.click(screen.getByRole("button", { name: "删除时间点 14" }));

    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent(
      "签证材料衔接",
    );
  });

  it("shows timeline notes as bubbles above each node", () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("时间点备注 1"), {
      target: { value: "本周已完成材料沟通" },
    });

    const firstTimelineNode = screen.getByTestId("timeline-node-0");
    expect(firstTimelineNode).toHaveTextContent("本周已完成材料沟通");
    expect(within(firstTimelineNode).getByText("本周已完成材料沟通")).toHaveClass(
      "rounded-full",
    );
  });

  it("keeps application cards focused on application type and theme colors", () => {
    render(<MonthlyReportsPage />);

    const templateLibrary = screen.getByTestId("application-template-library");

    expect(within(templateLibrary).getByText("美国本科新生")).toBeInTheDocument();
    expect(within(templateLibrary).queryByText("美国本科申请阶段报告")).not.toBeInTheDocument();
    expect(within(templateLibrary).queryByText("美国本科")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("展示报告模板名称")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("展示报告风格标签")).not.toBeInTheDocument();
  });

  it("allows the report theme colors to be manually picked", () => {
    render(<MonthlyReportsPage />);

    expect(screen.getByLabelText("主色")).toHaveValue("#2563eb");

    fireEvent.change(screen.getByLabelText("主色"), {
      target: { value: "#0f766e" },
    });
    fireEvent.change(screen.getByLabelText("页面背景"), {
      target: { value: "#f0fdfa" },
    });

    expect(screen.getByTestId("monthly-report-preview")).toHaveStyle({
      borderColor: "#0f766e",
    });
    expect(screen.getByRole("button", { name: "识别并生成反馈" })).toHaveStyle({
      backgroundColor: "#0f766e",
    });
  });

  it("lights the selected timeline stage and every prior stage automatically", () => {
    render(<MonthlyReportsPage />);

    fireEvent.click(screen.getByRole("button", { name: "设为当前阶段 5" }));

    expect(screen.getByLabelText("点亮状态 1")).toHaveValue("completed");
    expect(screen.getByLabelText("点亮状态 4")).toHaveValue("completed");
    expect(screen.getByLabelText("点亮状态 5")).toHaveValue("current");
    expect(screen.getByLabelText("点亮状态 6")).toHaveValue("pending");
    expect(screen.getByTestId("timeline-dot-0")).toHaveStyle({
      backgroundColor: "#047857",
    });
    expect(screen.getByTestId("timeline-dot-4")).toHaveStyle({
      backgroundColor: "#3730a3",
    });
  });

  it("switches timeline and preview theme when application type changes", () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("申请类型"), {
      target: { value: "加拿大本科" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "使用申请类型 + 报告模板 + 时间轴 + 配色",
      }),
    );

    expect(screen.getByText("申请系统准备")).toBeInTheDocument();
    expect(screen.getByTestId("monthly-report-preview")).toHaveStyle({
      borderColor: "#be123c",
    });
    expect(
      within(screen.getByTestId("monthly-report-preview")).getAllByText("加拿大本科")
        .length,
    ).toBeGreaterThan(0);
  });

  it("generates feedback fields from pasted communication content", () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("粘贴沟通内容"), {
      target: {
        value:
          "本月已完成主文书初稿和活动列表梳理。\n下月计划继续推进附加文书和申请系统填写。\n下一阶段重点关注推荐信确认。\n请学生补充奖项证明和护照信息。",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "识别并生成反馈" }));

    expect(screen.getByLabelText("阶段性反馈")).toHaveValue(
      "本月已完成主文书初稿和活动列表梳理。",
    );
    expect(screen.getByLabelText("下一阶段计划")).toHaveValue(
      "下月计划继续推进附加文书和申请系统填写。",
    );
    expect(screen.getByLabelText("需要学生/家庭配合")).toHaveValue(
      "请学生补充奖项证明和护照信息。",
    );
  });

  it("preserves multiple recognized lines and syncs text formatting to the preview", () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("粘贴沟通内容"), {
      target: {
        value:
          "已完成主文书第一轮修改。\n已确认推荐信提交方式。\n下一步继续推进申请系统。\n请学生补充护照。",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "识别并生成反馈" }));

    expect(screen.getByLabelText("阶段性反馈")).toHaveValue(
      "已完成主文书第一轮修改。\n已确认推荐信提交方式。",
    );

    fireEvent.change(screen.getByLabelText("阶段性反馈文字颜色"), {
      target: { value: "#b91c1c" },
    });
    fireEvent.click(screen.getByRole("button", { name: "阶段性反馈加粗" }));
    fireEvent.click(screen.getByRole("button", { name: "阶段性反馈下划线" }));

    const feedbackParagraph = screen
      .getByTestId("report-section-completedThisMonth")
      .querySelector("p");
    expect(feedbackParagraph).toHaveTextContent("已完成主文书第一轮修改");
    expect(feedbackParagraph).toHaveTextContent("已确认推荐信提交方式");
    expect(feedbackParagraph).toHaveStyle({
      color: "#b91c1c",
      fontWeight: "700",
      textDecoration: "underline",
    });
  });

  it("shows uploaded attachments in the attachment list and report preview", () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传附件"), {
      target: {
        files: [
          new File(["essay"], "主文书初稿.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
          new File(["score"], "成绩单.pdf", { type: "application/pdf" }),
        ],
      },
    });

    expect(screen.getByText("主文书初稿.docx")).toBeInTheDocument();
    expect(screen.getByText("成绩单.pdf")).toBeInTheDocument();
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "主文书初稿.docx",
    );
  });

  it("removes a single uploaded attachment from the list and report preview", () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传附件"), {
      target: {
        files: [
          new File(["essay"], "主文书初稿.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
          new File(["score"], "成绩单.pdf", { type: "application/pdf" }),
        ],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "删除附件 主文书初稿.docx" }));

    expect(screen.queryByText("主文书初稿.docx")).not.toBeInTheDocument();
    expect(screen.getByText("成绩单.pdf")).toBeInTheDocument();
    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent(
      "主文书初稿.docx",
    );
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent("成绩单.pdf");
  });

  it("recognizes material collection and school submission status from an uploaded application screenshot", async () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传申请截图"), {
      target: {
        files: [
          new File(
            [
              "材料收集情况：成绩单已收集；申请院校提交情况：UCLA已提交，UCSD待提交",
            ],
            "申请提交识别文本.txt",
            { type: "text/plain" },
          ),
        ],
      },
    });

    await waitFor(() =>
      expect(screen.getByLabelText("材料收集")).toHaveValue(
        "材料收集情况：成绩单已收集",
      ),
    );
    expect(screen.getByLabelText("阶段性反馈")).toHaveValue(
      "申请院校提交情况：UCLA已提交，UCSD待提交",
    );
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "材料收集情况：成绩单已收集",
    );
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "申请院校提交情况：UCLA已提交，UCSD待提交",
    );
  });

  it("generates student basic information and material collection modules from uploaded records and screenshots", async () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传沟通记录"), {
      target: {
        files: [
          new File(
            [
              "本月已完成材料表核对。\n下月计划继续推进申请提交。\n请学生补充信用卡信息。",
            ],
            "沟通记录.txt",
            { type: "text/plain" },
          ),
        ],
      },
    });
    fireEvent.change(screen.getByLabelText("上传申请截图"), {
      target: {
        files: [
          new File(
            [
              [
                "学生姓名：陈同学",
                "国籍：中国",
                "就读学校：广州外国语学校",
                "托福/雅思/Duolingo目前最高分：TOEFL 105",
                "SAT/ACT目前最高分：SAT 1480",
                "AP分数：AP Calculus 5",
                "目前GPA：3.92",
                "语言/标化成绩单：已收集",
                "G9-12成绩单：已收集",
                "护照及美签页：护照已收集",
                "信用卡：待补充",
                "I-20：",
              ].join("\n"),
            ],
            "学生信息与材料表识别文本.txt",
            { type: "text/plain" },
          ),
        ],
      },
    });

    await waitFor(() =>
      expect((screen.getByLabelText("材料收集") as HTMLTextAreaElement).value).toContain(
        "语言/标化成绩单：已收集",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "识别并生成反馈" }));

    expect(screen.getByLabelText("基础信息")).toHaveValue(
      [
        "国籍：中国",
        "就读学校：广州外国语学校",
        "语言成绩（托福/雅思/Duoligo目前最高分）：TOEFL 105",
        "标化考试（SAT/ACT目前最高分）：SAT 1480",
        "AP分数：AP Calculus 5",
        "目前GPA：3.92",
      ].join("\n"),
    );
    expect(screen.getByLabelText("材料收集")).toHaveValue(
      [
        "语言/标化成绩单：已收集",
        "G9-12成绩单：已收集",
        "护照：护照已收集",
        "信用卡：待补充",
      ].join("\n"),
    );
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "基础信息",
    );
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "材料收集",
    );
    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent("I-20");
    expect(screen.getByLabelText("阶段性反馈")).toHaveValue(
      "本月已完成材料表核对。",
    );
  });

  it("recognizes supported uploaded fields and ignores unsupported fields in the report", async () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传申请截图"), {
      target: {
        files: [
          new File(
            [
              [
                "学生姓名：陈同学",
                "就读学校：广州外国语学校",
                "备注字段：可以隐藏",
                "护照：已收集",
              ].join("\n"),
            ],
            "任意字段识别文本.txt",
            { type: "text/plain" },
          ),
        ],
      },
    });

    await waitFor(() =>
      expect(screen.getByLabelText("展示字段 就读学校")).toBeChecked(),
    );

    expect(screen.queryByLabelText("展示字段 备注字段")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "识别并生成反馈" }));

    expect(screen.getByLabelText("学生姓名")).toHaveValue("陈同学");
    expect(screen.getByLabelText("基础信息")).toHaveValue("就读学校：广州外国语学校");
    expect(screen.getByLabelText("材料收集")).toHaveValue("护照：已收集");
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "基础信息",
    );
    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent(
      "可以隐藏",
    );
    expect(screen.queryByText("其他识别字段")).not.toBeInTheDocument();
  });

  it("recognizes a student row from an uploaded Excel-style table and fills report modules", async () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传 Excel 表格"), {
      target: {
        files: [
          new File(
            [
              [
                "学生姓名,就读年级,就读学校,国籍,生日,语言成绩（托福/雅思/Duoligo目前最高分）,标化考试（SAT/ACT目前最高分）,AP分数,目前GPA,简历信息表,护照,美签页,申请进度,备注字段",
                "其他学生,11,其他学校,加拿大,2008-01-01,IELTS 7.0,SAT 1400,AP 4,3.40,待补充,待补充,未提供,待申请,不应匹配",
                "测试学生甲,12,广州外国语学校,中国,2007-02-02,TOEFL 105,SAT 1480,AP Calculus 5,3.92,已完成,已收集,已收集,UCLA 已提交，UCSD 待提交,可展示备注",
              ].join("\n"),
            ],
            "学生进度总表.csv",
            { type: "text/csv" },
          ),
        ],
      },
    });

    await waitFor(() =>
      expect(screen.getByLabelText("基础信息")).toHaveValue(
        [
          "就读年级：12",
          "就读学校：广州外国语学校",
          "国籍：中国",
          "生日：2007-02-02",
          "语言成绩（托福/雅思/Duoligo目前最高分）：TOEFL 105",
          "标化考试（SAT/ACT目前最高分）：SAT 1480",
          "AP分数：AP Calculus 5",
          "目前GPA：3.92",
        ].join("\n"),
      ),
    );

    expect(screen.getByLabelText("材料收集")).toHaveValue(
      ["简历信息表：已完成", "护照：已收集", "美签页：已收集"].join("\n"),
    );
    expect(screen.getByLabelText("阶段性反馈")).toHaveValue(
      "申请进度：UCLA 已提交，UCSD 待提交",
    );
    expect(screen.getByLabelText("学生姓名")).toHaveValue("测试学生甲");
    expect(screen.queryByLabelText("展示字段 备注字段")).not.toBeInTheDocument();
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent("基础信息");
    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent("其他识别字段");
    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent(
      "截图识别",
    );
    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent(
      "上传识别",
    );
  });

  it("recognizes a key-value uploaded Excel-style table", async () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传 Excel 表格"), {
      target: {
        files: [
          new File(
            [
              [
                "字段,内容",
                "学生姓名,陈同学",
                "目前GPA,3.88",
                "护照,已收集",
                "申请院校提交情况,多伦多大学已提交",
                "空字段,",
              ].join("\n"),
            ],
            "单个学生信息.csv",
            { type: "text/csv" },
          ),
        ],
      },
    });

    await waitFor(() =>
      expect(screen.getByLabelText("学生姓名")).toHaveValue("陈同学"),
    );

    expect(screen.getByLabelText("基础信息")).toHaveValue("目前GPA：3.88");
    expect(screen.getByLabelText("材料收集")).toHaveValue("护照：已收集");
    expect(screen.getByLabelText("阶段性反馈")).toHaveValue(
      "申请院校提交情况：多伦多大学已提交",
    );
    expect(screen.queryByText("其他识别字段")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("展示字段 空字段")).not.toBeInTheDocument();
  });

  it("fills editable report content from an uploaded previous feedback report", async () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传此前报告"), {
      target: {
        files: [
          new File(
            [
              [
                "基础信息",
                "目前GPA：3.90",
                "材料收集",
                "护照：已收集",
                "其他识别字段",
                "自定义字段：沿用",
                "本次阶段性进度",
                "已完成上一版沟通回填。",
                "下一阶段计划",
                "继续补充材料。",
                "需要学生/家庭配合",
                "请补充信用卡。",
              ].join("\n"),
            ],
            "此前反馈报告.txt",
            { type: "text/plain" },
          ),
        ],
      },
    });

    await waitFor(() =>
      expect(screen.getByLabelText("基础信息")).toHaveValue("目前GPA：3.90"),
    );

    expect(screen.getByLabelText("材料收集")).toHaveValue("护照：已收集");
    expect(screen.queryByText("其他识别字段")).not.toBeInTheDocument();
    expect(screen.getByLabelText("阶段性反馈")).toHaveValue(
      "已完成上一版沟通回填。",
    );
    expect(screen.getByLabelText("下一阶段计划")).toHaveValue("继续补充材料。");
    expect(screen.getByLabelText("需要学生/家庭配合")).toHaveValue(
      "请补充信用卡。",
    );
    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent(
      "自定义字段：沿用",
    );
  });

  it("fills editable report content from an uploaded exported html report", async () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传此前报告"), {
      target: {
        files: [
          new File(
            [
              [
                "<section><h2>基础信息</h2><table><tr><th>目前GPA</th><td>3.92</td></tr></table></section>",
                "<section><h2>材料收集</h2><table><tr><td>护照</td><td>已完成</td><td>已收集</td></tr></table></section>",
                "<section><h2>顾问阶段性反馈 / 本次阶段性进度</h2><p>已完成上一版导出报告回填。</p></section>",
                "<section><h2>本阶段后续动作 / 下一阶段计划</h2><ul><li>继续确认申请系统。</li></ul></section>",
                "<section><h2>学生/家庭待办 / 需要学生/家庭配合</h2><p>请补充银行卡信息。</p></section>",
              ].join(""),
            ],
            "此前导出报告.html",
            { type: "text/html" },
          ),
        ],
      },
    });

    await waitFor(() =>
      expect(screen.getByLabelText("阶段性反馈")).toHaveValue(
        "已完成上一版导出报告回填。",
      ),
    );

    expect(screen.getByLabelText("基础信息")).toHaveValue("目前GPA：3.92");
    expect(screen.getByLabelText("材料收集")).toHaveValue("护照：已完成：已收集");
    expect(screen.getByLabelText("下一阶段计划")).toHaveValue("继续确认申请系统。");
    expect(screen.getByLabelText("需要学生/家庭配合")).toHaveValue(
      "请补充银行卡信息。",
    );
  });

  it("shows a visible recognition status when uploaded screenshot text cannot be parsed", async () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传申请截图"), {
      target: {
        files: [
          new File(["binary image content"], "表格测试.png", {
            type: "image/png",
          }),
        ],
      },
    });

    await waitFor(() =>
      expect(screen.getByTestId("feedback-recognition-status")).toHaveTextContent(
        "已上传申请截图",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "识别并生成反馈" }));

    expect(screen.getByTestId("feedback-recognition-status")).toHaveTextContent(
      "未识别到可自动填充的结构化字段",
    );
  });

  it("does not parse raw image binary as recognized text when OCR returns empty", async () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("上传申请截图"), {
      target: {
        files: [
          new File(["�PNG\r\n�bad：garbage"], "真实截图.png", {
            type: "image/png",
          }),
        ],
      },
    });

    await waitFor(() =>
      expect(screen.getByTestId("feedback-recognition-status")).toHaveTextContent(
        "未识别到“字段：内容”形式的信息",
      ),
    );

    expect(screen.queryByLabelText("截图识别结果")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("展示字段 �bad")).not.toBeInTheDocument();
    expect(screen.queryByText("其他识别字段")).not.toBeInTheDocument();
  });

  it("uses module selection to control the report preview", () => {
    render(<MonthlyReportsPage />);

    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "申请时间轴",
    );
    fireEvent.click(screen.getByLabelText("展示申请时间轴"));

    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent(
      "申请时间轴",
    );
  });

  it("offers the requested report modules and only shows attachments after upload", () => {
    render(<MonthlyReportsPage />);

    [
      "展示学生姓名",
      "展示申请季度",
      "在最终报告中展示申请类型",
      "展示申请时间轴",
      "展示基础信息",
      "展示材料收集",
      "展示阶段性反馈",
      "展示下一阶段计划",
      "展示需要学生/家庭配合",
      "展示附件列表",
    ].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });

    expect(screen.getByLabelText("展示附件列表")).not.toBeChecked();
    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent(
      "本次报告附件",
    );

    fireEvent.change(screen.getByLabelText("上传附件"), {
      target: {
        files: [new File(["passport"], "护照.pdf", { type: "application/pdf" })],
      },
    });

    expect(screen.getByLabelText("展示附件列表")).toBeChecked();
    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "本次报告附件",
    );
  });

  it("offers export options and builds the expected feedback report filename", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:monthly-report");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<MonthlyReportsPage />);

    expect(screen.getByRole("heading", { name: "导出设置" })).toBeInTheDocument();
    expect(screen.getByLabelText("导出 PDF")).toBeChecked();
    expect(screen.getByLabelText("导出 PNG")).not.toBeChecked();
    expect(screen.getByText("测试学生甲_美国本科新生_2027秋_反馈报告_20260707.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("导出 PNG"));
    fireEvent.click(screen.getByRole("button", { name: "导出反馈报告" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "已开始下载 PDF、PNG",
      ),
    );
  });

  it("downloads selected feedback report files when exporting", async () => {
    const createObjectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:monthly-report");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<MonthlyReportsPage />);

    fireEvent.click(screen.getByRole("button", { name: "导出反馈报告" }));

    await waitFor(() => expect(anchorClick).toHaveBeenCalled());
    expect(createObjectUrl).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:monthly-report");
    expect(screen.getByRole("status")).toHaveTextContent("已开始下载 PDF");

    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
    anchorClick.mockRestore();
  });

  it("exports the report with the requested structure and without legacy recognition sections", async () => {
    const exportedBlobs: Blob[] = [];
    vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      exportedBlobs.push(blob as Blob);
      return "blob:monthly-report";
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("基础信息"), {
      target: { value: "就读学校：广州外国语学校" },
    });
    fireEvent.change(screen.getByLabelText("材料收集"), {
      target: { value: "护照：已收集" },
    });
    fireEvent.click(screen.getByRole("button", { name: "导出反馈报告" }));

    await waitFor(() => expect(exportedBlobs).toHaveLength(1));
    const exportedText = await exportedBlobs[0].text();

    expect(exportedText).toContain("学生姓名");
    expect(exportedText).toContain("申请季度");
    expect(exportedText).toContain("申请类型");
    expect(exportedText).toContain("申请时间轴");
    expect(exportedText).toContain("基础信息");
    expect(exportedText).toContain("材料收集");
    expect(exportedText).toContain("阶段性反馈");
    expect(exportedText).toContain("下一阶段计划");
    expect(exportedText).toContain("需要学生/家庭配合");
    expect(exportedText).toContain("Application Progress Report");
    expect(exportedText).toContain("关键摘要");
    expect(exportedText).toContain("材料项目");
    expect(exportedText).not.toContain("本阶段后续动作");
    expect(exportedText).not.toContain("顾问阶段性反馈");
    expect(exportedText).not.toContain("其他识别字段");
    expect(exportedText).not.toContain("截图识别");
    expect(exportedText).not.toContain("上传识别");
    expect(exportedText).not.toContain("本月完成情况");
    expect(exportedText).not.toContain("下月计划");
    expect(exportedText).not.toContain("免责声明");
    expect(exportedText).not.toContain("报告版本");
  });

  it("exports the same report section order, highlight, and hidden-state as preview", async () => {
    const exportedBlobs: Blob[] = [];
    vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      exportedBlobs.push(blob as Blob);
      return "blob:monthly-report";
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<MonthlyReportsPage />);

    fireEvent.click(screen.getByLabelText("展示申请时间轴"));
    fireEvent.click(screen.getByLabelText("展示基础信息"));
    fireEvent.click(screen.getByLabelText("重点展示关键摘要"));
    fireEvent.click(screen.getByRole("button", { name: "上移关键摘要" }));

    fireEvent.click(screen.getByRole("button", { name: "导出反馈报告" }));

    await waitFor(() => expect(exportedBlobs).toHaveLength(1));
    const exportedText = await exportedBlobs[0].text();

    expect(exportedText).toContain(
      '<section class="section-card highlighted" aria-label="关键摘要">',
    );
    expect(exportedText).not.toContain("<h2 class=\"section-title\">申请时间轴</h2>");
    expect(exportedText).not.toContain("<h2 class=\"section-title\">基础信息</h2>");
    expect(exportedText.indexOf("关键摘要")).toBeLessThan(
      exportedText.indexOf("当前阶段重点和下一步建议"),
    );
    expect(exportedText.indexOf("当前阶段重点和下一步建议")).toBeLessThan(
      exportedText.indexOf('<h2 class="section-title">材料收集</h2>'),
    );
  });

  it("keeps edited content and updates template metadata after choosing the full switch option", () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("阶段性反馈"), {
      target: { value: "已经填写的本月进展" },
    });
    fireEvent.change(screen.getByLabelText("申请类型"), {
      target: { value: "中外合办申请" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "使用申请类型 + 报告模板 + 时间轴 + 配色",
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("阶段性反馈")).toHaveValue("已经填写的本月进展");
    expect(screen.queryByLabelText("报告模板名称")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("报告风格标签")).not.toBeInTheDocument();
    expect(screen.getByLabelText("部门标签")).toHaveValue(
      "大湾区中外合办升学指导中心",
    );
    expect(screen.getByText("院校与专业方向确认")).toBeInTheDocument();
  });

  it("offers explicit application switch choices and can apply only the selected theme", () => {
    render(<MonthlyReportsPage />);

    const canadaConfig = getMonthlyReportApplicationConfig("加拿大本科");
    fireEvent.change(screen.getByLabelText("申请类型"), {
      target: { value: "加拿大本科" },
    });

    expect(screen.getByRole("dialog")).toHaveTextContent("切换为加拿大本科");
    expect(
      screen.getByRole("button", {
        name: "使用申请类型 + 报告模板 + 时间轴 + 配色",
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "仅使用该类型主题配色",
      }),
    );

    expect(screen.getByLabelText("申请类型")).toHaveValue("美国本科新生");
    expect(screen.queryByLabelText("报告模板名称")).not.toBeInTheDocument();
    expect(screen.getByLabelText("主色")).toHaveValue(canadaConfig.theme.primaryColor);
  });

  it("applies the selected application type, template, and timeline after choosing the full option", () => {
    render(<MonthlyReportsPage />);

    fireEvent.change(screen.getByLabelText("申请类型"), {
      target: { value: "加拿大本科" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "使用申请类型 + 报告模板 + 时间轴 + 配色",
      }),
    );

    expect(screen.getByLabelText("申请类型")).toHaveValue("加拿大本科");
    expect(screen.queryByLabelText("报告模板名称")).not.toBeInTheDocument();
    expect(screen.getByText("签证方案规划")).toBeInTheDocument();
  });

  it("can hide application type from the report preview", () => {
    render(<MonthlyReportsPage />);

    expect(screen.getByTestId("monthly-report-preview")).toHaveTextContent(
      "申请类型",
    );
    fireEvent.click(screen.getByLabelText("在最终报告中展示申请类型"));

    expect(screen.getByTestId("monthly-report-preview")).not.toHaveTextContent(
      "申请类型",
    );
  });
});

describe("monthly report application type config", () => {
  it("uses the requested default report names and style labels", () => {
    expect(
      APPLICATION_TYPE_OPTIONS.map((option) => {
        const config = getMonthlyReportApplicationConfig(option);
        return [option, config.templateName, config.theme.themeName];
      }),
    ).toEqual([
      ["美国本科新生", "美国本科申请阶段报告", "美国本科"],
      ["美国本科转学", "美国本科申请阶段报告", "转学申请"],
      ["美国中学", "美国留学申请阶段报告", "中学申请"],
      ["加拿大中学", "加拿大申请阶段反馈报告", "中学申请"],
      ["加拿大本科", "加拿大申请阶段反馈报告", "本科申请"],
      ["美国硕博", "美国硕博申请阶段报告", "美国硕博"],
      ["加拿大硕博", "加拿大申请阶段反馈报告", "加拿大硕博"],
      ["综合评价申请", "综合评价申请反馈报告", "广东省"],
      ["中外合办申请", "中外合办多元路径反馈报告", "大湾区"],
    ]);
  });

  it("keeps nine configurable application types with timelines and theme tokens", () => {
    expect(APPLICATION_TYPE_OPTIONS).toHaveLength(9);

    const transfer = getMonthlyReportApplicationConfig("美国本科转学");
    const usGraduate = getMonthlyReportApplicationConfig("美国硕博");
    const canadaGraduate = getMonthlyReportApplicationConfig("加拿大硕博");

    expect(transfer.timeline).toContain("文书写作沟通");
    expect(transfer.stageKeywords).toEqual(
      expect.arrayContaining(["转学", "成绩单", "课程信息"]),
    );
    expect(transfer.theme).toMatchObject({
      themeName: "转学申请",
      primaryColor: "#5046e5",
      secondaryColor: "#10b981",
    });
    expect(transfer.attachmentRules.enabled).toBe(true);
    expect(transfer.todoRules.enabled).toBe(true);
    expect(usGraduate.timeline).toEqual([
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
    ]);
    expect(canadaGraduate.timeline).toEqual([
      "文书素材收集",
      "文书写作",
      "院校提交",
      "结果跟踪",
      "确认入读",
      "行前准备",
      "签证准备",
    ]);
  });
});

describe("monthly report generation", () => {
  it("generates a report draft with school progress and editable fields", () => {
    const draft = generateMonthlyReportDraft({
      student,
      applications,
      month: "2026年7月",
      applicationType: "加拿大本科",
      completedThisMonth: "完成递交；账号: hidden",
      nextMonthPlan: "推进 Todo College",
      clientTasks: ["请补充材料；电话: 123"],
      internalNotes: "交接处理: 内部细节",
    });

    expect(draft.title).toBe("测试学生甲 2027 Fall 加拿大本科 2026年7月申请服务进度反馈");
    expect(draft.applicationType).toBe("加拿大本科");
    expect(draft.timeline).toContain("申请系统准备");
    expect(draft.moduleTitles).toMatchObject({
      completedThisMonth: "本月完成情况",
      nextMonthPlan: "下月计划",
      nextStageFocus: "下一阶段重点",
    });
    expect(draft.schoolProgress.map((item) => item.status)).toEqual([
      "已提交",
      "录取",
      "待申请",
    ]);
    expect(draft.nextStageFocus).toBe("重点推进 Todo College 的申请材料与递交准备。");
  });

  it("redacts external previews", () => {
    const draft = generateMonthlyReportDraft({
      student,
      applications,
      month: "2026年7月",
      completedThisMonth: "完成递交；账号: hidden",
      nextMonthPlan: "下月继续推进；密码: hidden",
      clientTasks: ["请补充材料；电话: 123"],
      internalNotes: "交接处理: 内部细节",
    });

    const preview = buildExternalMonthlyReportPreview(draft);

    expect(preview.internalNotes).toBeUndefined();
    expect(containsForbiddenMonthlyReportContent(preview)).toBe(false);
  });

  it("requires preview before PDF/PNG export", () => {
    const draft = generateMonthlyReportDraft({
      student,
      applications,
      month: "2026年7月",
      applicationType: "综合评价申请",
    });

    expect(buildMonthlyReportExportPlan(draft, ["PDF"])).toMatchObject({
      status: "blocked",
      reason: "preview_required",
    });

    expect(
      buildMonthlyReportExportPlan({ ...draft, previewedAt: new Date() }, [
        "PDF",
        "PNG",
      ], {
        generatedAt: new Date(Date.UTC(2026, 6, 7)),
      }),
    ).toMatchObject({
      status: "ready",
      operations: [
        expect.objectContaining({
          format: "PDF",
          fileName: "测试学生甲_综合评价申请_2027 Fall_反馈报告_20260707.pdf",
        }),
        expect.objectContaining({
          format: "PNG",
          fileName: "测试学生甲_综合评价申请_2027 Fall_反馈报告_20260707.png",
        }),
      ],
    });
  });
});
