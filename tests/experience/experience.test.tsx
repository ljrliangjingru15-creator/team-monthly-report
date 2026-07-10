import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExperiencePage from "@/app/experience/page";
import type { AdmissionResultRecord } from "@/features/admissions/types";
import type { HandoffIssueRecord } from "@/features/handoff/types";
import {
  createCaseFromAdmission,
  createExperienceFromHandoffIssue,
  createManualExperience,
} from "@/features/experience/generate";
import { filterExperienceCasesForActor, summarizeExperienceCases } from "@/features/experience/filters";
import type { Actor } from "@/features/permissions/types";

const counselor: Actor = { id: "counselor-1", name: "顾问甲", role: "COUNSELOR" };
const leader: Actor = {
  id: "leader",
  name: "组长",
  roleAssignments: [{ role: "LEADER" }, { role: "COUNSELOR" }],
};

const student = {
  id: "student-1",
  season: "2027 Fall",
  name: "测试学生甲",
  counselor: "顾问甲",
  counselorUserId: "counselor-1",
  backgroundSummary: "背景摘要",
};

const admission: AdmissionResultRecord = {
  id: "admission-1",
  applicationId: "application-1",
  studentId: "student-1",
  studentName: "测试学生甲",
  counselor: "顾问甲",
  counselorUserId: "counselor-1",
  schoolName: "Offer University",
  result: "录取",
  rawResult: "accepted",
  backgroundSummary: "背景摘要",
  canGeneratePoster: true,
  student,
};

const issue: HandoffIssueRecord = {
  id: "issue-1",
  studentId: "student-1",
  studentName: "测试学生甲",
  counselor: "顾问甲",
  counselorUserId: "counselor-1",
  issueType: "MISSING_DDL",
  description: "缺少 DDL",
  priority: "HIGH",
  status: "RESOLVED",
  resolution: "已补充 DDL",
  createdAt: new Date(),
  student,
};

describe("experience page", () => {
  it("renders the experience entry", () => {
    render(<ExperiencePage />);
    expect(
      screen.getByRole("heading", { name: "成功案例库与经验库" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/组长可查看团队经验库/)).toBeInTheDocument();
  });
});

describe("experience generation and filters", () => {
  it("creates success cases from admissions", () => {
    expect(createCaseFromAdmission(admission)).toMatchObject({
      type: "STUDENT_SUCCESS",
      title: "测试学生甲 - Offer University 录取案例",
      outcome: "录取",
      internalTags: ["录取", "录取", "Offer University"],
    });
  });

  it("creates handoff quality experience from issues", () => {
    expect(createExperienceFromHandoffIssue(issue)).toMatchObject({
      type: "HANDOFF_QUALITY",
      challenge: "缺少 DDL",
      handling: "已补充 DDL",
      outcome: "已解决",
    });
  });

  it("supports manual experience records", () => {
    expect(
      createManualExperience({
        type: "RISK_HANDLING",
        title: "DDL 风险处理经验",
        student,
        season: "2027 Fall",
        challenge: "DDL 临近",
      }),
    ).toMatchObject({
      type: "RISK_HANDLING",
      studentName: "测试学生甲",
      counselorName: "顾问甲",
    });
  });

  it("applies counselor and leader data scopes", () => {
    const ownCase = createCaseFromAdmission(admission);
    const otherCase = {
      ...ownCase,
      id: "case:other",
      studentId: "student-2",
      studentName: "测试学生乙",
      counselorName: "顾问乙",
      counselorUserId: "counselor-2",
      student: {
        ...student,
        id: "student-2",
        name: "测试学生乙",
        counselor: "顾问乙",
        counselorUserId: "counselor-2",
      },
    };

    expect(filterExperienceCasesForActor(counselor, [ownCase, otherCase])).toEqual([
      ownCase,
    ]);
    expect(filterExperienceCasesForActor(leader, [ownCase, otherCase])).toHaveLength(2);
  });

  it("filters and summarizes experience cases", () => {
    const cases = [
      createCaseFromAdmission(admission),
      createExperienceFromHandoffIssue(issue),
      createManualExperience({
        type: "RISK_HANDLING",
        title: "DDL 风险处理经验",
        student,
        season: "2027 Fall",
        isExternalUsable: true,
      }),
    ];

    expect(
      filterExperienceCasesForActor(leader, cases, {
        search: "DDL",
      }).map((item) => item.title),
    ).toEqual(["测试学生甲 - MISSING_DDL 交接经验", "DDL 风险处理经验"]);

    expect(summarizeExperienceCases(cases)).toMatchObject({
      total: 3,
      studentSuccess: 1,
      riskHandling: 1,
      handoffQuality: 1,
      externalUsable: 1,
    });
  });
});
