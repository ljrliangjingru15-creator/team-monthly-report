import { prisma } from "@/lib/db/client";
import type { AuditedUpdateInput } from "@/features/audit/types";
import {
  buildChangeLogData,
  writeChangeLogs,
} from "@/features/audit/write-change-log";

export async function updateWithAudit<T>(input: AuditedUpdateInput<T>) {
  return prisma.$transaction(async (tx) => {
    const value = await input.update(tx);
    const changes = buildChangeLogData(input.before, input.after);
    const logs = await writeChangeLogs(
      tx,
      changes.map((change) => ({
        ...change,
        entityType: input.entityType,
        entityId: input.entityId,
        changedById: input.actorId,
        changeSource: input.source,
        importBatchId: input.importBatchId,
      })),
    );
    return { value, logs };
  });
}
