import { canEditExportConfig, canViewExportConfig } from "@/features/permissions/rules";
import type { Actor } from "@/features/permissions/types";

export function assertCanViewExportConfig(actor: Actor) {
  if (!canViewExportConfig(actor)) {
    throw new Error("当前账号无权查看导出配置");
  }
}

export function assertCanEditExportConfig(actor: Actor) {
  if (!canEditExportConfig(actor)) {
    throw new Error("当前账号无权修改导出配置");
  }
}
