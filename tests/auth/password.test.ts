import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/features/auth/password";

describe("password hashing", () => {
  it("stores a non-plain-text hash and verifies the original password", async () => {
    const hash = await hashPassword("safe-password-123");

    expect(hash).not.toBe("safe-password-123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    await expect(verifyPassword("safe-password-123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
