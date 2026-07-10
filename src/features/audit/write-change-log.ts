import type { Prisma } from "@prisma/client";

const sensitiveNames =
  /password|密码|账号|账密|portalPassword|accountPassword|contractAmount|phone|mobile|tel|电话|手机号/i;

function serialize(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function buildChangeLogData(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  return Object.keys(after)
    .filter((fieldName) => !sensitiveNames.test(fieldName))
    .map((fieldName) => ({
      fieldName,
      oldValue: serialize(before[fieldName]),
      newValue: serialize(after[fieldName]),
    }))
    .filter(({ oldValue, newValue }) => oldValue !== newValue);
}

export async function writeChangeLogs(
  tx: Prisma.TransactionClient,
  data: Array<Prisma.ChangeLogCreateManyInput>,
) {
  if (data.length === 0) return [];
  await tx.changeLog.createMany({ data });
  return tx.changeLog.findMany({
    where: {
      OR: data.map(({ entityType, entityId, fieldName, changedById }) => ({
        entityType,
        entityId,
        fieldName,
        changedById,
      })),
    },
    orderBy: { changedAt: "asc" },
  });
}
