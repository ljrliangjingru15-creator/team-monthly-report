import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HandoffPage from "@/app/handoff/page";
import { detectFinalizationAnomalies, suggestFinalizationStatus } from "@/features/handoff/finalization";
import {
  createIssueDraftFromAnomaly,
  filterHandoffIssuesForActor,
  summarizeHandoffIssues,
  transitionHandoffIssue,
} from "@/features/handoff/issues";
import type { ApplicationWithStudent } from "@/features/applications/types";
import type { HandoffIssueRecord } from "@/features/handoff/types";
import type { StudentRecord } from "@/features/students/types";
import type { Actor } from "@/features/permissions/types";

const student: StudentRecord = {
  id: "student-1",
  season: "2027 Fall",
  name: "测试学生甲",
  counselor: "顾问甲",
  counselorUserId: "counselor-1",
  midTermCounselor: "中期甲",
};

const applications: ApplicationWithStudent[] = [
  {
    id: "application-1",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    counselorUserId: "counselor-1",
    season: "2027 Fall",
    schoolName: "A University",
    applicationStatus: "未提交",
    deadline: null,
    student,
  },
  {
    id: "application-2",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    counselorUserId: "counselor-1",
    season: "2027 Fall",
    schoolName: "Extra College",
    applicationStatus: null,
    deadline: new Date(Date.UTC(2027, 0, 1)),
    student,
  },
];

const leader: Actor = {
  id: "leader",
  name: "组长",
  roleAssignments: [{ role: "LEADER" }, { role: "COUNSELOR" }],
};
const counselor: Actor = {
  id: "counselor-1",
  name: "顾问甲",
  role: "COUNSELOR",
};
const otherCounselor: Actor = {
  id: "counselor-2",
  name: "顾问乙",
  role: "COUNSELOR",
};

describe("handoff page", () => {
  it("renders the handoff entry", () => {
    render(<HandoffPage />);

    expect(
      screen.getByRole("heading", { name: "后期定校与交接质量反馈" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/定校数量不一致/)).toBeInTheDocument();
  });
});

describe("school finalization anomaly detection", () => {
  it("detects count mismatch, missing/extra schools, missing DDL and unclear status", () => {
    const anomalies = detectFinalizationAnomalies({
      student,
      expectedSchoolCount: 3,
      contractSchoolCount: 3,
      confirmedSchoolNames: ["A University", "Missing College"],
      applications,
      isSpecialStructure: true,
    });

    expect(anomalies.map((issue) => issue.type)).toEqual(
      expect.arrayContaining([
        "SCHOOL_COUNT_MISMATCH",
        "MISSING_APPLICATION_SCHOOL",
        "EXTRA_APPLICATION_SCHOOL",
        "MISSING_DDL",
        "UNCLEAR_APPLICATION_STATUS",
        "MISSING_BACKGROUND",
        "SPECIAL_SHEET_REVIEW",
      ]),
    );
    expect(suggestFinalizationStatus(anomalies)).toBe("QUESTIONED");
  });

  it("can turn anomalies into handoff issue drafts", () => {
    const anomaly = detectFinalizationAnomalies({
      student,
      expectedSchoolCount: 1,
      applications,
    })[0];

    expect(
      createIssueDraftFromAnomaly(
        { student, ownerName: "组长" },
        anomaly,
      ),
    ).toMatchObject({
      student,
      issueType: anomaly.type,
      description: anomaly.message,
      priority: anomaly.priority,
      ownerName: "组长",
    });
  });
});

describe("handoff issue workflow", () => {
  const issue: HandoffIssueRecord = {
    id: "issue-1",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    counselorUserId: "counselor-1",
    midTermCounselor: "中期甲",
    issueType: "MISSING_DDL",
    description: "缺少 DDL",
    ownerName: "顾问甲",
    priority: "HIGH",
    status: "TODO",
    createdAt: new Date(Date.UTC(2026, 6, 7)),
    student,
  };

  it("transitions issues and returns audit changes", () => {
    const result = transitionHandoffIssue(issue, "IN_PROGRESS");

    expect(result.issue.status).toBe("IN_PROGRESS");
    expect(result.changes).toEqual([
      expect.objectContaining({
        fieldName: "status",
        oldValue: "TODO",
        newValue: "IN_PROGRESS",
      }),
    ]);
  });

  it("resolves issues with resolution and timestamp", () => {
    const now = new Date(Date.UTC(2026, 6, 8));
    const result = transitionHandoffIssue(
      { ...issue, status: "IN_PROGRESS" },
      "RESOLVED",
      { resolution: "已补充 DDL", now },
    );

    expect(result.issue).toMatchObject({
      status: "RESOLVED",
      resolution: "已补充 DDL",
      resolvedAt: now,
    });
  });

  it("blocks invalid transitions", () => {
    expect(() => transitionHandoffIssue(issue, "TODO")).toThrow("不能从 TODO");
  });

  it("filters issues by actor data scope and counselor dimensions", () => {
    const otherIssue: HandoffIssueRecord = {
      ...issue,
      id: "issue-2",
      studentId: "student-2",
      studentName: "测试学生乙",
      counselor: "顾问乙",
      counselorUserId: "counselor-2",
      midTermCounselor: "中期乙",
      student: {
        ...student,
        id: "student-2",
        name: "测试学生乙",
        counselor: "顾问乙",
        counselorUserId: "counselor-2",
        midTermCounselor: "中期乙",
      },
    };

    expect(filterHandoffIssuesForActor(counselor, [issue, otherIssue])).toEqual([
      issue,
    ]);
    expect(filterHandoffIssuesForActor(otherCounselor, [issue, otherIssue])).toEqual([
      otherIssue,
    ]);
    expect(
      filterHandoffIssuesForActor(leader, [issue, otherIssue], {
        midTermCounselor: "中期乙",
      }),
    ).toEqual([otherIssue]);
  });

  it("summarizes open issues by counselor and mid-term counselor", () => {
    expect(
      summarizeHandoffIssues([
        issue,
        { ...issue, id: "issue-2", status: "WAITING" },
        { ...issue, id: "issue-3", status: "RESOLVED" },
      ]),
    ).toMatchObject({
      total: 3,
      open: 2,
      resolved: 1,
      waiting: 1,
      byMidTermCounselor: [{ midTermCounselor: "中期甲", count: 3 }],
      byCounselor: [{ counselor: "顾问甲", count: 3 }],
    });
  });
});
