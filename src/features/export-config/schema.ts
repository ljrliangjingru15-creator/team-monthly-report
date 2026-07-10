import { z } from "zod";
import { exportKinds } from "./types";

export const exportConfigSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(exportKinds),
  description: z.string(),
  templateKey: z.string().min(1),
  fieldRules: z.object({
    include: z.array(z.string()).min(1),
    exclude: z.array(z.string()),
  }),
  templateRules: z
    .object({
      sections: z.array(z.string()).min(1),
      editableSections: z.array(z.string()).optional(),
    })
    .optional(),
  styleRules: z
    .object({
      outputFormats: z.array(z.enum(["PDF", "PNG", "XLSX"])).min(1),
      pageSize: z.enum(["A4", "POSTER"]).optional(),
      theme: z.string().optional(),
    })
    .optional(),
  watermarkRules: z
    .object({
      enabled: z.boolean(),
      text: z.string().optional(),
    })
    .optional(),
  redactionRules: z.object({
    audience: z.enum(["external", "internal"]),
    alwaysHide: z.array(z.string()),
    roleLimited: z.array(z.string()).optional(),
  }),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export function validateExportConfig(config: unknown) {
  return exportConfigSchema.parse(config);
}
