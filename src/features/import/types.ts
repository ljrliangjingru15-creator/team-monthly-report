export type WorkbookLayout = "STUDENT_MASTER" | "COUNSELOR_PROGRESS" | "UNKNOWN";

export type HeaderInput = string | number | boolean | null | undefined;

export type SensitiveCategory =
  | "password"
  | "accountCredential"
  | "phone"
  | "identityDocument";

export type SensitiveHeaderMatch = {
  index: number;
  header: string;
  normalizedHeader: string;
  category: SensitiveCategory;
};

export type HeaderMappingResult = {
  fields: Record<string, number>;
  duplicates: Record<string, number[]>;
  unknown: Array<{
    index: number;
    header: string;
  }>;
  ignoredSensitive: number[];
  sensitiveMatches: SensitiveHeaderMatch[];
} & Record<string, number | unknown>;

export type LayoutDetectionResult = {
  layout: WorkbookLayout;
  confidence: number;
  sheetName?: string;
  reasons: string[];
};

export type ParsedStudentCandidate = {
  source: {
    sheetName: string;
    rowNumber: number;
  };
  data: {
    systemId?: string;
    season: string;
    name: string;
    counselor?: string;
    midTermCounselor?: string;
    salesCounselor?: string;
    contractNumber?: string;
    contractType?: string;
    contractAmount?: number;
    contractAmountNotes?: string;
    applicationType?: string;
    currentSchool?: string;
    highSchoolType?: string;
    curriculum?: string;
    applicationIdentity?: string;
    visaStatus?: string;
    gpa?: string;
    languageScore?: string;
    standardizedTest?: string;
    apIbALevel?: string;
    backgroundSummary?: string;
    posterBackground?: string;
    specialNotes?: string;
    email?: string;
  };
};

export type ParsedApplicationCandidate = {
  source: {
    sheetName: string;
    rowNumber: number;
  };
  needsReview?: boolean;
  reviewReason?: string;
  data: {
    studentName: string;
    studentEmail?: string;
    schoolName: string;
    applicationMethod?: string;
    college?: string;
    program?: string;
    major?: string;
    round?: string;
    deadline?: Date;
    interviewStatus?: string;
    materialStatus?: string;
    submittedAt?: Date;
    applicationStatus?: string;
    result?: string;
    enrollmentStatus?: string;
  };
};

export type ParsedAdmissionResultCandidate = {
  source: {
    sheetName: string;
    rowNumber: number;
  };
  data: {
    studentName: string;
    schoolName: string;
    program?: string;
    major?: string;
    result: string;
    enrollmentStatus?: string;
  };
};

export type ParseIssue = {
  sheetName: string;
  rowNumber?: number;
  issueType: string;
  message: string;
  severity: "info" | "warning" | "error";
};

export type ImportEntityType = "student" | "application";

export type ImportConflict = {
  id: string;
  entityType: ImportEntityType;
  entityId: string;
  fieldName: string;
  existingValue: unknown;
  incomingValue: unknown;
  source: {
    sheetName: string;
    rowNumber: number;
  };
};

export type ImportPreviewItem<TIncoming, TExisting = unknown> = {
  entityType: ImportEntityType;
  incoming: TIncoming;
  existing?: TExisting;
  changes: Array<{
    fieldName: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
  conflicts: ImportConflict[];
};

export type ImportPreview = {
  createdStudents: Array<ImportPreviewItem<ParsedStudentCandidate["data"]>>;
  updatedStudents: Array<ImportPreviewItem<ParsedStudentCandidate["data"]>>;
  createdApplications: Array<ImportPreviewItem<ParsedApplicationCandidate["data"]>>;
  updatedApplications: Array<ImportPreviewItem<ParsedApplicationCandidate["data"]>>;
  conflicts: ImportConflict[];
  skippedFields: string[];
  sensitiveFields: Array<{
    fieldName: string;
    category: SensitiveCategory;
  }>;
  manualReview: ParseIssue[];
  summary: {
    createdStudents: number;
    updatedStudents: number;
    createdApplications: number;
    updatedApplications: number;
    conflicts: number;
    manualReview: number;
    skippedFields: number;
    sensitiveFields: number;
  };
};
