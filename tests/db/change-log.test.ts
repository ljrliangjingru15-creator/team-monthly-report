import { beforeEach, describe, expect, it } from "vitest";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("updateWithAudit", () => {
  beforeEach(async () => {
    const { prisma } = await import("@/lib/db/client");
    await prisma.changeLog.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();
  });

  it("updates the entity and writes one field-level log atomically", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { updateWithAudit } = await import("@/lib/db/transaction");
    const user = await prisma.user.create({
      data: { name: "本地管理员", role: "ADMIN" },
    });
    const student = await prisma.student.create({
      data: {
        season: "2027 Fall",
        name: "测试学生甲",
        currentStage: "文书",
      },
    });

    const result = await updateWithAudit({
      actorId: user.id,
      source: "MANUAL",
      entityType: "STUDENT",
      entityId: student.id,
      before: { currentStage: "文书" },
      after: { currentStage: "递交" },
      update: (tx) =>
        tx.student.update({
          where: { id: student.id },
          data: { currentStage: "递交" },
        }),
    });

    expect(result.logs).toEqual([
      expect.objectContaining({
        fieldName: "currentStage",
        oldValue: "文书",
        newValue: "递交",
      }),
    ]);
    expect(
      await prisma.student.findUniqueOrThrow({ where: { id: student.id } }),
    ).toMatchObject({ currentStage: "递交" });
  });
});
