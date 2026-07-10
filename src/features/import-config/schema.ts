import { z } from "zod";
import { importTypes } from "./types";

export const importConfigSchema = z.object({
  name: z.string().min(1),
  importType: z.enum(importTypes),
  description: z.string(),
  sheetRules: z.discriminatedUnion("mode", [
    z.object({
      mode: z.literal("fixed"),
      sheetName: z.string().min(1),
    }),
    z.object({
      mode: z.literal("multi_sheet"),
      includeHiddenSheets: z.boolean(),
      studentSheetNamePattern: z.string().min(1),
      specialSheetStrategy: z.literal("parse_when_possible_otherwise_review"),
    }),
  ]),
  headerRules: z.object({
    headerRow: z.number().int().positive(),
    groupHeaderRow: z.number().int().positive().optional(),
    allowHeaderAliases: z.boolean(),
    normalizeWhitespace: z.boolean(),
  }),
  fieldMappings: z.array(
    z.object({
      target: z.string().min(1),
      entity: z.enum([
        "student",
        "application",
        "schoolFinalization",
        "admissionResult",
        "handoffIssue",
      ]),
      aliases: z.array(z.string().min(1)).min(1),
      required: z.boolean().optional(),
      notes: z.string().optional(),
    }),
  ).min(1),
  skippedFields: z.array(z.string()),
  sensitiveRules: z.array(
    z.object({
      category: z.enum([
        "password",
        "accountCredential",
        "phone",
        "identityDocument",
      ]),
      patterns: z.array(z.string().min(1)).min(1),
      action: z.literal("drop_without_value_logging"),
    }),
  ),
  studentMatchRules: z.array(
    z.object({
      strategy: z.string().min(1),
      fields: z.array(z.string().min(1)).min(1),
      onAmbiguous: z.literal("manual_review"),
    }),
  ).min(1),
  applicationMatchRules: z.array(
    z.object({
      strategy: z.string().min(1),
      fields: z.array(z.string().min(1)).min(1),
      onAmbiguous: z.literal("manual_review"),
    }),
  ).optional(),
  conflictRules: z.object({
    defaultAction: z.literal("manual_confirm"),
    allowBulkConfirm: z.boolean(),
    emptyCellPolicy: z.literal("do_not_overwrite"),
    logConfirmedOverwrite: z.boolean(),
  }),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export function validateImportConfig(config: unknown) {
  return importConfigSchema.parse(config);
}
