import type { ImportConflict, ImportPreview } from "./types";

export type ConflictResolution =
  | {
      conflictId: string;
      action: "use_existing" | "use_incoming" | "skip";
    }
  | {
      conflictId: "*";
      action: "use_existing" | "use_incoming" | "skip";
      fieldName?: string;
    };

export type CommitOperation =
  | {
      type: "create_student";
      data: ImportPreview["createdStudents"][number]["incoming"];
    }
  | {
      type: "update_student";
      entityId: string;
      changes: Record<string, unknown>;
    }
  | {
      type: "create_application";
      data: ImportPreview["createdApplications"][number]["incoming"];
    }
  | {
      type: "update_application";
      entityId: string;
      changes: Record<string, unknown>;
    }
  | {
      type: "write_conflict_log";
      conflict: ImportConflict;
      action: "use_existing" | "use_incoming" | "skip";
    };

function findResolution(
  conflict: ImportConflict,
  resolutions: ConflictResolution[],
) {
  return (
    resolutions.find((resolution) => resolution.conflictId === conflict.id) ??
    resolutions.find(
      (resolution) =>
        resolution.conflictId === "*" &&
        (!("fieldName" in resolution) || !resolution.fieldName || resolution.fieldName === conflict.fieldName),
    )
  );
}

function existingId(existing: unknown) {
  if (existing && typeof existing === "object" && "id" in existing) {
    return String((existing as { id: unknown }).id);
  }

  return "";
}

export function buildCommitPlan(
  preview: ImportPreview,
  resolutions: ConflictResolution[],
) {
  const unresolvedConflicts = preview.conflicts.filter(
    (conflict) => !findResolution(conflict, resolutions),
  );

  if (unresolvedConflicts.length > 0) {
    return {
      status: "blocked" as const,
      reason: "unresolved_conflicts" as const,
      unresolvedConflicts,
      operations: [] as CommitOperation[],
    };
  }

  const operations: CommitOperation[] = [
    ...preview.createdStudents.map(
      (item): CommitOperation => ({ type: "create_student", data: item.incoming }),
    ),
    ...preview.createdApplications.map(
      (item): CommitOperation => ({
        type: "create_application",
        data: item.incoming,
      }),
    ),
  ];

  for (const item of preview.updatedStudents) {
    const changes: Record<string, unknown> = {};

    for (const change of item.changes) {
      const conflict = item.conflicts.find(
        (candidate) => candidate.fieldName === change.fieldName,
      );
      if (conflict) {
        const resolution = findResolution(conflict, resolutions);
        operations.push({
          type: "write_conflict_log",
          conflict,
          action: resolution?.action ?? "skip",
        });
        if (resolution?.action !== "use_incoming") continue;
      }

      changes[change.fieldName] = change.newValue;
    }

    if (Object.keys(changes).length > 0) {
      operations.push({
        type: "update_student",
        entityId: existingId(item.existing),
        changes,
      });
    }
  }

  for (const item of preview.updatedApplications) {
    const changes: Record<string, unknown> = {};

    for (const change of item.changes) {
      const conflict = item.conflicts.find(
        (candidate) => candidate.fieldName === change.fieldName,
      );
      if (conflict) {
        const resolution = findResolution(conflict, resolutions);
        operations.push({
          type: "write_conflict_log",
          conflict,
          action: resolution?.action ?? "skip",
        });
        if (resolution?.action !== "use_incoming") continue;
      }

      changes[change.fieldName] = change.newValue;
    }

    if (Object.keys(changes).length > 0) {
      operations.push({
        type: "update_application",
        entityId: existingId(item.existing),
        changes,
      });
    }
  }

  return {
    status: "ready" as const,
    operations,
  };
}

export async function commitImportPreview<T>(
  preview: ImportPreview,
  resolutions: ConflictResolution[],
  transaction: (operations: CommitOperation[]) => Promise<T>,
) {
  const plan = buildCommitPlan(preview, resolutions);
  if (plan.status === "blocked") return plan;

  const result = await transaction(plan.operations);
  return {
    status: "committed" as const,
    operations: plan.operations,
    result,
  };
}
