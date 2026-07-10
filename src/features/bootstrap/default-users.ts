import type { Role } from "@prisma/client";
import { hashPassword } from "@/features/auth/password";

export type BootstrapRoleAssignment = {
  role: Role;
  scope?: string | null;
};

export type BootstrapUser = {
  username: string;
  name: string;
  passwordHash: string;
  teamName: string;
  isActive: true;
  roleAssignments: BootstrapRoleAssignment[];
};

type BuildDefaultBootstrapUsersInput = {
  defaultPassword: string;
  teamName: string;
};

const defaultUserDefinitions: Array<{
  username: string;
  name: string;
  roleAssignments: Array<{
    role: Role;
    scope: "all" | "team" | "self";
  }>;
}> = [
  {
    username: "admin",
    name: "管理员",
    roleAssignments: [{ role: "ADMIN", scope: "all" }],
  },
  {
    username: "leader",
    name: "组长",
    roleAssignments: [
      { role: "LEADER", scope: "team" },
      { role: "COUNSELOR", scope: "self" },
    ],
  },
  {
    username: "counselor",
    name: "顾问",
    roleAssignments: [{ role: "COUNSELOR", scope: "self" }],
  },
];

function resolveScope(scope: "all" | "team" | "self", teamName: string) {
  if (scope === "team") return teamName;
  return scope;
}

export async function buildDefaultBootstrapUsers({
  defaultPassword,
  teamName,
}: BuildDefaultBootstrapUsersInput): Promise<BootstrapUser[]> {
  return Promise.all(
    defaultUserDefinitions.map(async (user) => ({
      username: user.username,
      name: user.name,
      passwordHash: await hashPassword(defaultPassword),
      teamName,
      isActive: true,
      roleAssignments: user.roleAssignments.map((assignment) => ({
        role: assignment.role,
        scope: resolveScope(assignment.scope, teamName),
      })),
    })),
  );
}

export function summarizeBootstrapUsers(users: BootstrapUser[]) {
  return users.map((user) => {
    const roles = user.roleAssignments.map((assignment) => assignment.role);
    const label = roles
      .map((role) => {
        if (role === "ADMIN") return "管理员";
        if (role === "LEADER") return "组长";
        if (role === "COUNSELOR") return "顾问";
        return role;
      })
      .join(" + ");

    return `${user.username}：${label}`;
  });
}
