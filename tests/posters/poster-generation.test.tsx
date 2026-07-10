import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PostersPage from "@/app/posters/page";
import { buildPosterExportPlan } from "@/features/posters/export-plan";
import { generatePosterDraft } from "@/features/posters/generate";
import {
  buildExternalPosterPreview,
  containsForbiddenPosterContent,
} from "@/features/posters/redact";
import type { AdmissionResultRecord } from "@/features/admissions/types";

const admission: AdmissionResultRecord = {
  id: "admission-1",
  applicationId: "application-1",
  studentId: "student-1",
  studentName: "测试学生甲",
  counselor: "顾问甲",
  counselorUserId: "counselor-1",
  schoolName: "Offer University",
  major: "Economics",
  result: "录取",
  rawResult: "accepted",
  backgroundSummary: "背景摘要；合同金额:100000",
  posterBackground: "喜报背景；账号: hidden；内部交接: hidden",
  canGeneratePoster: true,
  student: {
    id: "student-1",
    season: "2027 Fall",
    name: "测试学生甲",
    counselor: "顾问甲",
    counselorUserId: "counselor-1",
  },
};

describe("posters page", () => {
  it("renders the poster generation entry", () => {
    render(<PostersPage />);
    expect(
      screen.getByRole("heading", { name: "录取喜报/海报" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/导出 PNG\/PDF 前必须预览/)).toBeInTheDocument();
  });
});

describe("poster generation", () => {
  it("generates a poster draft from an admitted result", () => {
    const poster = generatePosterDraft(admission);

    expect(poster).toMatchObject({
      admissionResultId: "admission-1",
      studentName: "测试学生甲",
      schoolName: "Offer University",
      result: "录取",
      templateKey: "admission-poster-basic",
      watermark: "仅供申请服务反馈使用",
    });
  });

  it("blocks non-admitted results", () => {
    expect(() =>
      generatePosterDraft({ ...admission, result: "拒绝", canGeneratePoster: false }),
    ).toThrow("不可生成喜报");
  });

  it("redacts external poster previews", () => {
    const poster = generatePosterDraft(admission);
    const preview = buildExternalPosterPreview(poster);

    expect(containsForbiddenPosterContent(preview)).toBe(false);
    expect(preview.background).toContain("[已隐藏]");
  });

  it("requires preview before PNG/PDF export", () => {
    const poster = generatePosterDraft(admission);

    expect(buildPosterExportPlan(poster, ["PNG"])).toMatchObject({
      status: "blocked",
      reason: "preview_required",
    });

    expect(
      buildPosterExportPlan({ ...poster, previewedAt: new Date() }, ["PNG", "PDF"]),
    ).toMatchObject({
      status: "ready",
      operations: [
        expect.objectContaining({ format: "PNG" }),
        expect.objectContaining({ format: "PDF" }),
      ],
    });
  });
});
