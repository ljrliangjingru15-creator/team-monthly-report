export const importTypes = ["STUDENT_MASTER", "COUNSELOR_PROGRESS"] as const;

export type ImportType = (typeof importTypes)[number];

export type SheetRules =
  | {
      mode: "fixed";
      sheetName: string;
    }
  | {
      mode: "multi_sheet";
      includeHiddenSheets: boolean;
      studentSheetNamePattern: string;
      specialSheetStrategy: "parse_when_possible_otherwise_review";
    };

export type HeaderRules = {
  headerRow: number;
  groupHeaderRow?: number;
  allowHeaderAliases: boolean;
  normalizeWhitespace: boolean;
};

export type FieldMapping = {
  target: string;
  entity:
    | "student"
    | "application"
    | "schoolFinalization"
    | "admissionResult"
    | "handoffIssue";
  aliases: string[];
  required?: boolean;
  notes?: string;
};

export type SensitiveRule = {
  category: "password" | "accountCredential" | "phone" | "identityDocument";
  patterns: string[];
  action: "drop_without_value_logging";
};

export type MatchRule = {
  strategy: string;
  fields: string[];
  onAmbiguous: "manual_review";
};

export type ConflictRules = {
  defaultAction: "manual_confirm";
  allowBulkConfirm: boolean;
  emptyCellPolicy: "do_not_overwrite";
  logConfirmedOverwrite: boolean;
};

export type ImportConfigDefinition = {
  name: string;
  importType: ImportType;
  description: string;
  sheetRules: SheetRules;
  headerRules: HeaderRules;
  fieldMappings: FieldMapping[];
  skippedFields: string[];
  sensitiveRules: SensitiveRule[];
  studentMatchRules: MatchRule[];
  applicationMatchRules?: MatchRule[];
  conflictRules: ConflictRules;
  isDefault: boolean;
  isActive: boolean;
};
