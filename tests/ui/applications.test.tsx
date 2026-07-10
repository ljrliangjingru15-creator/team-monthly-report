import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ApplicationsPage from "@/app/applications/page";
import { filterApplicationsForActor } from "@/features/applications/filters";
import { buildApplicationDetailView } from "@/features/applications/view-model";
import type { ApplicationWithStudent } from "@/features/applications/types";
import type { Actor } from "@/features/permissions/types";

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

const applications: ApplicationWithStudent[] = [
  {
    id: "application-1",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    counselorUserId: "counselor-1",
    season: "2027 Fall",
    schoolName: "Test University",
    major: "Economics",
    round: "EA",
    deadline: new Date(Date.UTC(2027, 0, 1)),
    applicationStatus: "未提交",
    materialStatus: "准备中",
    result: null,
    finalRiskLevel: "HIGH",
    student: {
      id: "student-1",
      season: "2027 Fall",
      name: "测试学生甲",
      counselor: "顾问甲",
      counselorUserId: "counselor-1",
    },
  },
  {
    id: "application-2",
    studentId: "student-2",
    studentName: "测试学生乙",
    counselor: "顾问乙",
    counselorUserId: "counselor-2",
    season: "2027 Fall",
    schoolName: "Other College",
    major: "CS",
    round: "RD",
    deadline: new Date(Date.UTC(2027, 1, 1)),
    applicationStatus: "已提交",
    result: "录取",
    finalRiskLevel: "NORMAL",
    student: {
      id: "student-2",
      season: "2027 Fall",
      name: "测试学生乙",
      counselor: "顾问乙",
      counselorUserId: "counselor-2",
    },
  },
];

describe("applications page", () => {
  it("renders the application management entry", () => {
    render(<ApplicationsPage />);

    expect(
      screen.getByRole("heading", { name: "申请项列表" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/按学生、学校、顾问、DDL/)).toBeInTheDocument();
  });
});

describe("application filtering and view models", () => {
  it("limits counselors to their own applications", () => {
    expect(
      filterApplicationsForActor(counselor, applications).map((item) => item.id),
    ).toEqual(["application-1"]);
  });

  it("allows leaders to see all applications", () => {
    expect(filterApplicationsForActor(leader, applications)).toHaveLength(2);
  });

  it("supports school, status, result, risk and DDL filters", () => {
    expect(
      filterApplicationsForActor(leader, applications, {
        search: "Test",
        applicationStatus: "未提交",
        finalRiskLevel: "HIGH",
        deadlineFrom: new Date(Date.UTC(2026, 11, 1)),
        deadlineTo: new Date(Date.UTC(2027, 0, 31)),
      }).map((item) => item.id),
    ).toEqual(["application-1"]);

    expect(
      filterApplicationsForActor(leader, applications, {
        result: "录取",
      }).map((item) => item.id),
    ).toEqual(["application-2"]);
  });

  it("builds editable application detail views", () => {
    const view = buildApplicationDetailView(counselor, applications[0]);

    expect(view).toMatchObject({
      id: "application-1",
      studentName: "测试学生甲",
      schoolName: "Test University",
      major: "Economics",
      applicationStatus: "未提交",
      finalRiskLevel: "HIGH",
    });
    expect(view.editableFields).toEqual(
      expect.arrayContaining(["deadline", "applicationStatus", "result"]),
    );
  });

  it("blocks counselors from viewing other counselors' applications", () => {
    expect(() => buildApplicationDetailView(counselor, applications[1])).toThrow(
      "无权查看",
    );
  });
});
