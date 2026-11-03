import { describe, expect, it } from "vitest";
import {
  extractLegacyOcrSection,
  inferLegacyPdfIdentity,
  recoverLegacyOcrFieldLines,
} from "@/features/monthly-reports/legacy-pdf-report";

describe("legacy monthly report PDF recovery", () => {
  const ocrText = `
    申请时 间 轴 就 读 学 校 。。 Oaks Christian school
    语言 成 绩 。 托福 110
    AP 分 数 2025: Macro 5、Micro 5、STAT 3
    目前 GPA Standard 3.90 / Weighted 4.33
    UC 申请 准备 阶 段 性 反 馈
    UC 申请 提交 待 推进 本月确定了申请院校。
    下 一 阶段 计划
    下月重点关注递交并完成材料确认。需要 学生 / 家庭 配合
    需要尽快完成主文书写作。
    录取专业和
    申请大学英文名称 申请学院 申请轮次
  `;

  it("recovers identity from the filename when the image title omits the name", () => {
    expect(
      inferLegacyPdfIdentity(
        "虞源浩_美国本科新生_2027秋_反馈报告_20260926.pdf",
        "",
        "广州新东方前途出国美国本科部",
        `申请季阶段性反馈报告\n${ocrText}`,
      ),
    ).toMatchObject({
      applicationType: "美国本科新生",
      reportDate: "2026-09-26",
      reportTitle: "虞源浩申请季阶段性反馈报告",
      season: "2027秋",
      studentName: "虞源浩",
    });
  });

  it("accepts OCR labels containing internal spaces", () => {
    const fields = recoverLegacyOcrFieldLines(ocrText);
    expect(fields).toContain("就读学校：Oaks Christian school");
    expect(fields).toContain("语言成绩：托福 110");
    expect(fields).toContain("目前GPA：Standard 3.90 / Weighted 4.33");
  });

  it("keeps sections separate from following headings and school tables", () => {
    expect(extractLegacyOcrSection(ocrText, ["阶段性反馈"])).toBe(
      "本月确定了申请院校。",
    );
    expect(extractLegacyOcrSection(ocrText, ["下一阶段计划"])).toBe(
      "下月重点关注递交并完成材料确认。",
    );
    expect(extractLegacyOcrSection(ocrText, ["需要学生/家庭配合"])).toBe(
      "需要尽快完成主文书写作。",
    );
  });
});
