import { describe, expect, it } from "vitest";
import {
  buildDefaultBootstrapUsers,
  summarizeBootstrapUsers,
} from "@/features/bootstrap/default-users";
import { verifyPassword } from "@/features/auth/password";

describe("default bootstrap users", () => {
  it("creates admin, leader-counselor and counselor accounts without storing plain passwords", async () => {
    const users = await buildDefaultBootstrapUsers({
      defaultPassword: "ChangeMe-2027!",
      teamName: "后期团队",
    });

    expect(users).toHaveLength(3);

    const leader = users.find((user) => user.username === "leader");
    expect(leader?.roleAssignments.map((assignment) => assignment.role)).toEqual([
      "LEADER",
      "COUNSELOR",
    ]);
    expect(leader?.roleAssignments.map((assignment) => assignment.scope)).toEqual([
      "后期团队",
      "self",
    ]);

    for (const user of users) {
      expect(user.passwordHash).not.toContain("ChangeMe-2027!");
      await expect(verifyPassword("ChangeMe-2027!", user.passwordHash)).resolves.toBe(
        true,
      );
    }
  });

  it("summarizes bootstrap users for a safe handoff message without exposing password hashes", async () => {
    const users = await buildDefaultBootstrapUsers({
      defaultPassword: "ChangeMe-2027!",
      teamName: "后期团队",
    });

    expect(summarizeBootstrapUsers(users)).toEqual([
      "admin：管理员",
      "leader：组长 + 顾问",
      "counselor：顾问",
    ]);
  });
});
