import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入登录账号"),
  password: z.string().min(1, "请输入密码"),
});

export const createUserSchema = z.object({
  username: z.string().trim().min(2, "登录账号至少 2 个字符"),
  name: z.string().trim().min(1, "请输入姓名"),
  password: z.string().min(8, "初始密码至少 8 位"),
  roles: z.array(z.enum(["ADMIN", "LEADER", "COUNSELOR", "READ_ONLY"])).min(1),
  teamName: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
