export const exportKinds = [
  "MONTHLY_REPORT",
  "ADMISSION_POSTER",
  "INTERNAL_CASE",
  "LIST_EXCEL",
] as const;

export type ExportKind = (typeof exportKinds)[number];

export type ExportConfigDefinition = {
  name: string;
  kind: ExportKind;
  description: string;
  templateKey: string;
  fieldRules: {
    include: string[];
    exclude: string[];
  };
  templateRules?: {
    sections: string[];
    editableSections?: string[];
  };
  styleRules?: {
    outputFormats: Array<"PDF" | "PNG" | "XLSX">;
    pageSize?: "A4" | "POSTER";
    theme?: string;
  };
  watermarkRules?: {
    enabled: boolean;
    text?: string;
  };
  redactionRules: {
    audience: "external" | "internal";
    alwaysHide: string[];
    roleLimited?: string[];
  };
  isDefault: boolean;
  isActive: boolean;
};
