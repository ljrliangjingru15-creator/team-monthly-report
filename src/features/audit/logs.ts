import type { ChangeSource, EntityType } from "@prisma/client";

export type AuditLogRecord = {
  id: string;
  entityType: EntityType;
  entityId: string;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedByName?: string | null;
  changeSource: ChangeSource;
  changedAt: Date;
};

export type AuditLogFilters = {
  entityType?: EntityType;
  entityId?: string;
  changedByName?: string;
  changeSource?: ChangeSource;
  fieldName?: string;
  from?: Date;
  to?: Date;
};

export function filterAuditLogs(logs: AuditLogRecord[], filters: AuditLogFilters = {}) {
  return logs
    .filter((log) => (filters.entityType ? log.entityType === filters.entityType : true))
    .filter((log) => (filters.entityId ? log.entityId === filters.entityId : true))
    .filter((log) =>
      filters.changedByName ? log.changedByName === filters.changedByName : true,
    )
    .filter((log) =>
      filters.changeSource ? log.changeSource === filters.changeSource : true,
    )
    .filter((log) => (filters.fieldName ? log.fieldName === filters.fieldName : true))
    .filter((log) => (filters.from ? log.changedAt >= filters.from : true))
    .filter((log) => (filters.to ? log.changedAt <= filters.to : true));
}

export function summarizeAuditLogs(logs: AuditLogRecord[]) {
  return {
    total: logs.length,
    manual: logs.filter((log) => log.changeSource === "MANUAL").length,
    import: logs.filter((log) => log.changeSource === "EXCEL_IMPORT").length,
    system: logs.filter((log) => log.changeSource === "SYSTEM").length,
  };
}
