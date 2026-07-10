import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import { buildDashboardMetrics } from "@/features/dashboard/metrics";
import type { ApplicationWithStudent } from "@/features/applications/types";
import type { StudentRecord } from "@/features/students/types";
import type { Actor } from "@/features/permissions/types";

const today = new Date(Date.UTC(2026, 6, 7));
const counselor: Actor = {
  id: "counselor-1",
  name: "顾问甲",
  role: "COUNSELOR",
};
const leader: Actor = {
  id: "leader",
  name: "组长",
  roleAssignments: [{ role: "LEADER" }, { role: "COUNSELOR" }],
};

const students: StudentRecord[] = [
  {
    id: "student-1",
    season: "2027 Fall",
    name: "测试学生甲",
    counselor: "顾问甲",
    counselorUserId: "counselor-1",
  },
  {
    id: "student-2",
    season: "2027 Fall",
    name: "测试学生乙",
    counselor: "顾问乙",
    counselorUserId: "counselor-2",
  },
];

const applications: ApplicationWithStudent[] = [
  {
    id: "high",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    counselorUserId: "counselor-1",
    season: "2027 Fall",
    schoolName: "High University",
    applicationStatus: "未提交",
    deadline: new Date(Date.UTC(2026, 6, 10)),
    student: students[0],
  },
  {
    id: "overdue",
    studentId: "student-2",
    studentName: "测试学生乙",
    counselor: "顾问乙",
    counselorUserId: "counselor-2",
    season: "2027 Fall",
    schoolName: "Late College",
    applicationStatus: "未提交",
    deadline: new Date(Date.UTC(2026, 6, 1)),
    student: students[1],
  },
];

describe("dashboard page", () => {
  it("renders dashboard risk cards", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "首页看板" }),
    ).toBeInTheDocument();
    expect(screen.getByText("高风险")).toBeInTheDocument();
    expect(screen.getByText("已逾期")).toBeInTheDocument();
    expect(screen.getByText("未来 7 天 DDL")).toBeInTheDocument();
  });
});

describe("dashboard metrics", () => {
  it("uses counselor data scope", () => {
    expect(
      buildDashboardMetrics(
        counselor,
        {
          students,
          applications,
          handoffOpenCount: 2,
          monthlyReportsDueCount: 1,
          posterReadyCount: 1,
          caseReadyCount: 0,
        },
        today,
      ),
    ).toMatchObject({
      studentCount: 1,
      applicationCount: 1,
      highRiskCount: 1,
      overdueCount: 0,
      nextSevenDaysDdlCount: 1,
      handoffOpenCount: 2,
      monthlyReportsDueCount: 1,
    });
  });

  it("uses leader team-wide data scope and groups risk by counselor", () => {
    const metrics = buildDashboardMetrics(
      leader,
      { students, applications },
      today,
    );

    expect(metrics).toMatchObject({
      studentCount: 2,
      applicationCount: 2,
      highRiskCount: 1,
      overdueCount: 1,
    });
    expect(metrics.riskByCounselor).toEqual(
      expect.arrayContaining([
        { counselor: "顾问甲", highRiskCount: 1, overdueCount: 0 },
        { counselor: "顾问乙", highRiskCount: 0, overdueCount: 1 },
      ]),
    );
  });
});
