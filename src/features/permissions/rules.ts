import type { PermissionRole, Actor, SensitiveField, StudentAccessRecord } from "./types";

const leaderRoles = new Set<PermissionRole>([
  "LEADER",
  "PROCESS_LEAD",
  "ACADEMIC_LEAD",
  "CANADA_LEAD",
]);

const forbiddenFields = new Set<SensitiveField>([
  "studentPhone",
  "parentPhone",
  "password",
  "portalPassword",
  "accountPassword",
]);

export function getActorRoles(actor: Actor): PermissionRole[] {
  return Array.from(
    new Set([
      actor.role,
      ...(actor.roles ?? []),
      ...(actor.roleAssignments ?? []).map((assignment) => assignment.role),
    ].filter(Boolean) as PermissionRole[]),
  );
}

export function hasRole(actor: Actor, role: PermissionRole) {
  return getActorRoles(actor).includes(role);
}

export function isAdmin(actor: Actor) {
  return hasRole(actor, "ADMIN");
}

export function isLeader(actor: Actor) {
  return getActorRoles(actor).some((role) => leaderRoles.has(role));
}

export function isCounselor(actor: Actor) {
  return hasRole(actor, "COUNSELOR");
}

export function canManageUsers(actor: Actor) {
  return isAdmin(actor);
}

export function canEditImportConfig(actor: Actor) {
  return isAdmin(actor);
}

export function canViewImportConfig(actor: Actor) {
  return isAdmin(actor) || isLeader(actor);
}

export function canEditExportConfig(actor: Actor) {
  return isAdmin(actor);
}

export function canViewExportConfig(actor: Actor) {
  return isAdmin(actor) || isLeader(actor);
}

export function isOwnCounselorStudent(actor: Actor, student: StudentAccessRecord) {
  return (
    student.counselorUserId === actor.id ||
    (!!student.counselor && student.counselor === actor.name)
  );
}

export function canAccessStudent(actor: Actor, student: StudentAccessRecord) {
  if (isAdmin(actor)) return true;
  if (isLeader(actor)) return true;
  if (isCounselor(actor)) return isOwnCounselorStudent(actor, student);
  return false;
}

export function canViewStudentField(
  actor: Actor,
  student: StudentAccessRecord,
  field: SensitiveField | string,
) {
  if (forbiddenFields.has(field as SensitiveField)) return false;
  if (!canAccessStudent(actor, student)) return false;

  if (field === "contractAmount") {
    return isAdmin(actor) || isLeader(actor);
  }

  if (field === "email") {
    return isAdmin(actor) || isLeader(actor) || isOwnCounselorStudent(actor, student);
  }

  return true;
}

export function canViewTeamWideData(actor: Actor) {
  return isAdmin(actor) || isLeader(actor);
}

export function canUseOwnCounselorWorkspace(actor: Actor) {
  return isCounselor(actor) || isLeader(actor);
}
