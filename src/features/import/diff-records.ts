import type { ImportConflict, ImportEntityType } from "./types";

type DiffOptions = {
  entityType: ImportEntityType;
  entityId: string;
  source: {
    sheetName: string;
    rowNumber: number;
  };
  protectedFields?: string[];
};

function isBlank(value: unknown) {
  return value == null || value === "";
}

function comparable(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value ?? "").trim();
}

export function diffRecords(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  options: DiffOptions,
) {
  const protectedFields = new Set(options.protectedFields ?? []);
  const changes: Array<{
    fieldName: string;
    oldValue: unknown;
    newValue: unknown;
  }> = [];
  const conflicts: ImportConflict[] = [];

  for (const [fieldName, incomingValue] of Object.entries(incoming)) {
    if (fieldName === "systemId") continue;
    if (isBlank(incomingValue)) continue;

    const existingValue = existing[fieldName];
    if (comparable(existingValue) === comparable(incomingValue)) continue;

    changes.push({
      fieldName,
      oldValue: existingValue,
      newValue: incomingValue,
    });

    if (!isBlank(existingValue) || protectedFields.has(fieldName)) {
      conflicts.push({
        id: `${options.entityType}:${options.entityId}:${fieldName}`,
        entityType: options.entityType,
        entityId: options.entityId,
        fieldName,
        existingValue,
        incomingValue,
        source: options.source,
      });
    }
  }

  return { changes, conflicts };
}
