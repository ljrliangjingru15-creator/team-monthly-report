import type {
  ChangeSource,
  EntityType,
  Prisma,
} from "@prisma/client";

export type AuditedUpdateInput<T> = {
  actorId: string;
  source: ChangeSource;
  entityType: EntityType;
  entityId: string;
  importBatchId?: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  update: (tx: Prisma.TransactionClient) => Promise<T>;
};
