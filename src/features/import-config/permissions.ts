import {
  canEditImportConfig,
  canViewImportConfig,
} from "@/features/permissions/rules";
import type { Actor } from "@/features/permissions/types";

export function assertCanViewImportConfig(actor: Actor) {
  if (!canViewImportConfig(actor)) {
    throw new Error("当前账号无权查看导入配置");
  }
}

export function assertCanEditImportConfig(actor: Actor) {
  if (!canEditImportConfig(actor)) {
    throw new Error("当前账号无权修改导入配置");
  }
}
