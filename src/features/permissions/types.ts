import type { Role } from "@prisma/client";

export type PermissionRole = Role;

export type Actor = {
  id: string;
  name: string;
  role?: PermissionRole;
  teamName?: string | null;
  roles?: PermissionRole[];
  roleAssignments?: Array<{
    role: PermissionRole;
    scope?: string | null;
  }>;
};

export type StudentAccessRecord = {
  id: string;
  counselorUserId?: string | null;
  counselor?: string | null;
  teamName?: string | null;
};

export type SensitiveField =
  | "contractAmount"
  | "email"
  | "studentPhone"
  | "parentPhone"
  | "password"
  | "portalPassword"
  | "accountPassword";
