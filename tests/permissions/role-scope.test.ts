import { describe, expect, it } from "vitest";
import {
  canAccessStudent,
  canEditExportConfig,
  canEditImportConfig,
  canManageUsers,
  canUseOwnCounselorWorkspace,
  canViewStudentField,
  canViewTeamWideData,
  getActorRoles,
} from "@/features/permissions/rules";
import type { Actor, StudentAccessRecord } from "@/features/permissions/types";

const ownStudent: StudentAccessRecord = {
  id: "student-own",
  counselorUserId: "counselor-1",
  counselor: "顾问甲",
};

const otherStudent: StudentAccessRecord = {
  id: "student-other",
  counselorUserId: "counselor-2",
  counselor: "顾问乙",
};

const admin: Actor = { id: "admin-1", name: "管理员", role: "ADMIN" };
const leaderCounselor: Actor = {
  id: "leader-1",
  name: "组长甲",
  roleAssignments: [{ role: "LEADER" }, { role: "COUNSELOR" }],
};
const counselor: Actor = {
  id: "counselor-1",
  name: "顾问甲",
  role: "COUNSELOR",
};

describe("role and data scope permissions", () => {
  it("supports additive leader and counselor roles", () => {
    expect(getActorRoles(leaderCounselor)).toEqual(
      expect.arrayContaining(["LEADER", "COUNSELOR"]),
    );
    expect(canViewTeamWideData(leaderCounselor)).toBe(true);
    expect(canUseOwnCounselorWorkspace(leaderCounselor)).toBe(true);
  });

  it("allows admins and leaders to see team-wide students", () => {
    expect(canAccessStudent(admin, otherStudent)).toBe(true);
    expect(canAccessStudent(leaderCounselor, otherStudent)).toBe(true);
  });

  it("limits counselors to their own students", () => {
    expect(canAccessStudent(counselor, ownStudent)).toBe(true);
    expect(canAccessStudent(counselor, otherStudent)).toBe(false);
  });

  it("shows contract amount only to admins and leaders", () => {
    expect(canViewStudentField(admin, ownStudent, "contractAmount")).toBe(true);
    expect(canViewStudentField(leaderCounselor, ownStudent, "contractAmount")).toBe(
      true,
    );
    expect(canViewStudentField(counselor, ownStudent, "contractAmount")).toBe(
      false,
    );
  });

  it("shows email to admins, leaders and own counselors only", () => {
    expect(canViewStudentField(admin, otherStudent, "email")).toBe(true);
    expect(canViewStudentField(leaderCounselor, otherStudent, "email")).toBe(true);
    expect(canViewStudentField(counselor, ownStudent, "email")).toBe(true);
    expect(canViewStudentField(counselor, otherStudent, "email")).toBe(false);
  });

  it("never exposes phone or external password fields", () => {
    expect(canViewStudentField(admin, ownStudent, "studentPhone")).toBe(false);
    expect(canViewStudentField(admin, ownStudent, "parentPhone")).toBe(false);
    expect(canViewStudentField(admin, ownStudent, "portalPassword")).toBe(false);
  });

  it("allows only admins to manage users and edit import/export configs", () => {
    expect(canManageUsers(admin)).toBe(true);
    expect(canEditImportConfig(admin)).toBe(true);
    expect(canEditExportConfig(admin)).toBe(true);
    expect(canManageUsers(leaderCounselor)).toBe(false);
    expect(canEditImportConfig(leaderCounselor)).toBe(false);
    expect(canEditExportConfig(leaderCounselor)).toBe(false);
  });
});
