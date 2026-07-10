-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LEADER', 'COUNSELOR', 'READ_ONLY', 'PROCESS_LEAD', 'ACADEMIC_LEAD', 'CANADA_LEAD');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('NORMAL', 'WATCH', 'HIGH', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ChangeSource" AS ENUM ('EXCEL_IMPORT', 'MANUAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'STUDENT', 'APPLICATION', 'SCHOOL_FINALIZATION', 'HANDOFF_ISSUE', 'IMPORT_CONFIG', 'IMPORT_BATCH', 'IMPORT_ISSUE', 'ADMISSION_RESULT', 'MONTHLY_REPORT', 'POSTER', 'EXPERIENCE_CASE', 'EXPORT_CONFIG', 'EXPORT_LOG', 'FILE_ASSET');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PREVIEW', 'PENDING_CONFIRMATION', 'COMMITTED', 'PARTIAL_FAILURE', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HandoffIssueStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "HandoffIssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SchoolFinalizationStatus" AS ENUM ('UNCONFIRMED', 'CONFIRMED', 'QUESTIONED', 'NEEDS_INFO', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PREVIEWED', 'EXPORTED', 'CONFIRMED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PosterStatus" AS ENUM ('DRAFT', 'PREVIEWED', 'EXPORTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExperienceCaseType" AS ENUM ('STUDENT_SUCCESS', 'SCHOOL_EXPERIENCE', 'RISK_HANDLING', 'MATERIAL_ESSAY_INTERVIEW', 'HANDOFF_QUALITY');

-- CreateEnum
CREATE TYPE "ExportKind" AS ENUM ('MONTHLY_REPORT', 'ADMISSION_POSTER', 'INTERNAL_CASE', 'LIST_EXCEL', 'PDF', 'PNG');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "teamName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "contractNumber" TEXT,
    "contractType" TEXT,
    "contractAmount" DECIMAL(12,2),
    "contractAmountNotes" TEXT,
    "contractStatus" TEXT,
    "archiveStatus" TEXT,
    "archivedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "applicationTrack" TEXT,
    "applicationType" TEXT,
    "counselor" TEXT,
    "counselorUserId" TEXT,
    "midTermCounselor" TEXT,
    "salesCounselor" TEXT,
    "externalTeacher" TEXT,
    "currentSchool" TEXT,
    "highSchoolType" TEXT,
    "curriculum" TEXT,
    "applicationIdentity" TEXT,
    "visaStatus" TEXT,
    "gpa" TEXT,
    "languageScore" TEXT,
    "standardizedTest" TEXT,
    "apIbALevel" TEXT,
    "backgroundSummary" TEXT,
    "posterBackground" TEXT,
    "specialNotes" TEXT,
    "clientRiskTag" TEXT,
    "currentStage" TEXT,
    "handoffStatus" "SchoolFinalizationStatus" NOT NULL DEFAULT 'UNCONFIRMED',
    "systemRiskLevel" "RiskLevel",
    "manualRiskLevel" "RiskLevel",
    "finalRiskLevel" "RiskLevel",
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "countryOrRegion" TEXT,
    "schoolNameCn" TEXT,
    "schoolNameEn" TEXT,
    "schoolName" TEXT,
    "applicationSystem" TEXT,
    "college" TEXT,
    "program" TEXT,
    "major" TEXT,
    "secondMajor" TEXT,
    "applicationMethod" TEXT,
    "round" TEXT,
    "deadline" TIMESTAMP(3),
    "requirementNotes" TEXT,
    "needLanguageScore" TEXT,
    "needStandardizedTest" TEXT,
    "needTranscriptEvaluation" TEXT,
    "needPortfolio" TEXT,
    "needInterview" TEXT,
    "needMailing" TEXT,
    "applicationStatus" TEXT,
    "essayStatus" TEXT,
    "materialStatus" TEXT,
    "recommendationStatus" TEXT,
    "scoreSendingStatus" TEXT,
    "interviewStatus" TEXT,
    "submittedAt" TIMESTAMP(3),
    "portalStatus" TEXT,
    "checklistNotes" TEXT,
    "result" TEXT,
    "resultDate" TIMESTAMP(3),
    "scholarship" TEXT,
    "enrollmentStatus" TEXT,
    "depositStatus" TEXT,
    "visaStatus" TEXT,
    "housingStatus" TEXT,
    "finalTranscriptStatus" TEXT,
    "systemRiskLevel" "RiskLevel",
    "manualRiskLevel" "RiskLevel",
    "finalRiskLevel" "RiskLevel",
    "riskNotes" TEXT,
    "nextFollowUpDate" TIMESTAMP(3),
    "monthlyFeedbackNotes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolFinalization" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "source" TEXT,
    "versionLabel" TEXT,
    "expectedSchoolCount" INTEGER,
    "confirmedSchoolCount" INTEGER,
    "systemSchoolCount" INTEGER,
    "contractSchoolCount" INTEGER,
    "remainingSchoolCount" INTEGER,
    "confirmedSchools" JSONB,
    "status" "SchoolFinalizationStatus" NOT NULL DEFAULT 'UNCONFIRMED',
    "conflictSummary" TEXT,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolFinalization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoffIssue" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "applicationId" TEXT,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "ownerName" TEXT,
    "priority" "HandoffIssuePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "HandoffIssueStatus" NOT NULL DEFAULT 'TODO',
    "resolution" TEXT,
    "internalNotes" TEXT,
    "createdById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoffIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "importType" TEXT NOT NULL,
    "description" TEXT,
    "sheetRules" JSONB NOT NULL,
    "headerRules" JSONB NOT NULL,
    "fieldMappings" JSONB NOT NULL,
    "skippedFields" JSONB,
    "sensitiveRules" JSONB NOT NULL,
    "studentMatchRules" JSONB NOT NULL,
    "applicationMatchRules" JSONB,
    "conflictRules" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT,
    "uploadedBy" TEXT,
    "uploadedById" TEXT,
    "season" TEXT NOT NULL,
    "importType" TEXT NOT NULL,
    "importConfigId" TEXT,
    "selectedSheets" JSONB,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "createdStudents" INTEGER NOT NULL DEFAULT 0,
    "updatedStudents" INTEGER NOT NULL DEFAULT 0,
    "createdApplications" INTEGER NOT NULL DEFAULT 0,
    "updatedApplications" INTEGER NOT NULL DEFAULT 0,
    "createdAdmissionResults" INTEGER NOT NULL DEFAULT 0,
    "updatedAdmissionResults" INTEGER NOT NULL DEFAULT 0,
    "conflictCount" INTEGER NOT NULL DEFAULT 0,
    "skippedFieldCount" INTEGER NOT NULL DEFAULT 0,
    "sensitiveFieldCount" INTEGER NOT NULL DEFAULT 0,
    "suspectedDeletedApplications" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'PREVIEW',
    "previewSummary" JSONB,
    "committedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportIssue" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "sheetName" TEXT,
    "rowNumber" INTEGER,
    "columnName" TEXT,
    "issueType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "message" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "applicationId" TEXT,
    "schoolName" TEXT NOT NULL,
    "program" TEXT,
    "major" TEXT,
    "result" TEXT NOT NULL,
    "resultDate" TIMESTAMP(3),
    "enrollmentStatus" TEXT,
    "scholarship" TEXT,
    "backgroundSummary" TEXT,
    "posterBackground" TEXT,
    "canGeneratePoster" BOOLEAN NOT NULL DEFAULT false,
    "posterGeneratedAt" TIMESTAMP(3),
    "caseGeneratedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "title" TEXT,
    "includeSchoolDetail" BOOLEAN NOT NULL DEFAULT true,
    "includeRisks" BOOLEAN NOT NULL DEFAULT true,
    "includeClientTasks" BOOLEAN NOT NULL DEFAULT true,
    "completedThisMonth" TEXT,
    "nextMonthPlan" TEXT,
    "nextStageFocus" TEXT,
    "schoolProgress" JSONB,
    "content" TEXT NOT NULL DEFAULT '',
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "confirmedById" TEXT,
    "exportedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poster" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "admissionResultId" TEXT,
    "title" TEXT,
    "templateKey" TEXT,
    "schoolName" TEXT,
    "result" TEXT,
    "content" JSONB,
    "watermark" TEXT,
    "status" "PosterStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceCase" (
    "id" TEXT NOT NULL,
    "type" "ExperienceCaseType" NOT NULL,
    "title" TEXT NOT NULL,
    "studentId" TEXT,
    "admissionResultId" TEXT,
    "schoolName" TEXT,
    "season" TEXT NOT NULL,
    "counselorName" TEXT,
    "createdById" TEXT,
    "backgroundSummary" TEXT,
    "challenge" TEXT,
    "handling" TEXT,
    "outcome" TEXT,
    "reusableInsight" TEXT,
    "internalTags" JSONB,
    "isExternalUsable" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ExportKind" NOT NULL,
    "templateKey" TEXT,
    "fieldRules" JSONB NOT NULL,
    "templateRules" JSONB,
    "styleRules" JSONB,
    "watermarkRules" JSONB,
    "redactionRules" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportLog" (
    "id" TEXT NOT NULL,
    "exportConfigId" TEXT,
    "kind" "ExportKind" NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileName" TEXT,
    "fileAssetId" TEXT,
    "exportedById" TEXT,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    "monthlyReportId" TEXT,
    "posterId" TEXT,

    CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "entityType" "EntityType",
    "entityId" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT NOT NULL,
    "changeSource" "ChangeSource" NOT NULL,
    "importBatchId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_teamName_idx" ON "User"("teamName");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "UserRole_role_scope_idx" ON "UserRole"("role", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_scope_key" ON "UserRole"("userId", "role", "scope");

-- CreateIndex
CREATE INDEX "Student_season_counselor_idx" ON "Student"("season", "counselor");

-- CreateIndex
CREATE INDEX "Student_season_name_idx" ON "Student"("season", "name");

-- CreateIndex
CREATE INDEX "Student_contractNumber_idx" ON "Student"("contractNumber");

-- CreateIndex
CREATE INDEX "Student_counselorUserId_idx" ON "Student"("counselorUserId");

-- CreateIndex
CREATE INDEX "Student_finalRiskLevel_idx" ON "Student"("finalRiskLevel");

-- CreateIndex
CREATE INDEX "Student_handoffStatus_idx" ON "Student"("handoffStatus");

-- CreateIndex
CREATE INDEX "Application_studentId_idx" ON "Application"("studentId");

-- CreateIndex
CREATE INDEX "Application_schoolName_idx" ON "Application"("schoolName");

-- CreateIndex
CREATE INDEX "Application_schoolNameCn_idx" ON "Application"("schoolNameCn");

-- CreateIndex
CREATE INDEX "Application_schoolNameEn_idx" ON "Application"("schoolNameEn");

-- CreateIndex
CREATE INDEX "Application_deadline_idx" ON "Application"("deadline");

-- CreateIndex
CREATE INDEX "Application_applicationStatus_idx" ON "Application"("applicationStatus");

-- CreateIndex
CREATE INDEX "Application_result_idx" ON "Application"("result");

-- CreateIndex
CREATE INDEX "Application_finalRiskLevel_idx" ON "Application"("finalRiskLevel");

-- CreateIndex
CREATE INDEX "Application_round_idx" ON "Application"("round");

-- CreateIndex
CREATE INDEX "SchoolFinalization_studentId_status_idx" ON "SchoolFinalization"("studentId", "status");

-- CreateIndex
CREATE INDEX "SchoolFinalization_confirmedAt_idx" ON "SchoolFinalization"("confirmedAt");

-- CreateIndex
CREATE INDEX "HandoffIssue_studentId_idx" ON "HandoffIssue"("studentId");

-- CreateIndex
CREATE INDEX "HandoffIssue_ownerUserId_idx" ON "HandoffIssue"("ownerUserId");

-- CreateIndex
CREATE INDEX "HandoffIssue_ownerName_idx" ON "HandoffIssue"("ownerName");

-- CreateIndex
CREATE INDEX "HandoffIssue_status_priority_idx" ON "HandoffIssue"("status", "priority");

-- CreateIndex
CREATE INDEX "HandoffIssue_issueType_idx" ON "HandoffIssue"("issueType");

-- CreateIndex
CREATE INDEX "ImportConfig_importType_isDefault_idx" ON "ImportConfig"("importType", "isDefault");

-- CreateIndex
CREATE INDEX "ImportConfig_isActive_idx" ON "ImportConfig"("isActive");

-- CreateIndex
CREATE INDEX "ImportBatch_season_importType_idx" ON "ImportBatch"("season", "importType");

-- CreateIndex
CREATE INDEX "ImportBatch_status_idx" ON "ImportBatch"("status");

-- CreateIndex
CREATE INDEX "ImportBatch_uploadedById_idx" ON "ImportBatch"("uploadedById");

-- CreateIndex
CREATE INDEX "ImportBatch_importConfigId_idx" ON "ImportBatch"("importConfigId");

-- CreateIndex
CREATE INDEX "ImportIssue_importBatchId_issueType_idx" ON "ImportIssue"("importBatchId", "issueType");

-- CreateIndex
CREATE INDEX "ImportIssue_severity_idx" ON "ImportIssue"("severity");

-- CreateIndex
CREATE INDEX "AdmissionResult_studentId_idx" ON "AdmissionResult"("studentId");

-- CreateIndex
CREATE INDEX "AdmissionResult_applicationId_idx" ON "AdmissionResult"("applicationId");

-- CreateIndex
CREATE INDEX "AdmissionResult_result_idx" ON "AdmissionResult"("result");

-- CreateIndex
CREATE INDEX "AdmissionResult_schoolName_idx" ON "AdmissionResult"("schoolName");

-- CreateIndex
CREATE INDEX "MonthlyReport_status_idx" ON "MonthlyReport"("status");

-- CreateIndex
CREATE INDEX "MonthlyReport_createdById_idx" ON "MonthlyReport"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_studentId_month_key" ON "MonthlyReport"("studentId", "month");

-- CreateIndex
CREATE INDEX "Poster_studentId_idx" ON "Poster"("studentId");

-- CreateIndex
CREATE INDEX "Poster_admissionResultId_idx" ON "Poster"("admissionResultId");

-- CreateIndex
CREATE INDEX "Poster_status_idx" ON "Poster"("status");

-- CreateIndex
CREATE INDEX "ExperienceCase_type_idx" ON "ExperienceCase"("type");

-- CreateIndex
CREATE INDEX "ExperienceCase_season_idx" ON "ExperienceCase"("season");

-- CreateIndex
CREATE INDEX "ExperienceCase_schoolName_idx" ON "ExperienceCase"("schoolName");

-- CreateIndex
CREATE INDEX "ExperienceCase_studentId_idx" ON "ExperienceCase"("studentId");

-- CreateIndex
CREATE INDEX "ExportConfig_kind_isDefault_idx" ON "ExportConfig"("kind", "isDefault");

-- CreateIndex
CREATE INDEX "ExportConfig_isActive_idx" ON "ExportConfig"("isActive");

-- CreateIndex
CREATE INDEX "ExportLog_kind_status_idx" ON "ExportLog"("kind", "status");

-- CreateIndex
CREATE INDEX "ExportLog_entityType_entityId_idx" ON "ExportLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ExportLog_exportedById_idx" ON "ExportLog"("exportedById");

-- CreateIndex
CREATE INDEX "FileAsset_studentId_idx" ON "FileAsset"("studentId");

-- CreateIndex
CREATE INDEX "FileAsset_entityType_entityId_idx" ON "FileAsset"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ChangeLog_entityType_entityId_idx" ON "ChangeLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ChangeLog_changedById_idx" ON "ChangeLog"("changedById");

-- CreateIndex
CREATE INDEX "ChangeLog_importBatchId_idx" ON "ChangeLog"("importBatchId");

-- CreateIndex
CREATE INDEX "ChangeLog_changedAt_idx" ON "ChangeLog"("changedAt");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_counselorUserId_fkey" FOREIGN KEY ("counselorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolFinalization" ADD CONSTRAINT "SchoolFinalization_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoffIssue" ADD CONSTRAINT "HandoffIssue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_importConfigId_fkey" FOREIGN KEY ("importConfigId") REFERENCES "ImportConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportIssue" ADD CONSTRAINT "ImportIssue_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionResult" ADD CONSTRAINT "AdmissionResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionResult" ADD CONSTRAINT "AdmissionResult_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poster" ADD CONSTRAINT "Poster_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poster" ADD CONSTRAINT "Poster_admissionResultId_fkey" FOREIGN KEY ("admissionResultId") REFERENCES "AdmissionResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poster" ADD CONSTRAINT "Poster_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceCase" ADD CONSTRAINT "ExperienceCase_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceCase" ADD CONSTRAINT "ExperienceCase_admissionResultId_fkey" FOREIGN KEY ("admissionResultId") REFERENCES "AdmissionResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceCase" ADD CONSTRAINT "ExperienceCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_exportConfigId_fkey" FOREIGN KEY ("exportConfigId") REFERENCES "ExportConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_exportedById_fkey" FOREIGN KEY ("exportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_monthlyReportId_fkey" FOREIGN KEY ("monthlyReportId") REFERENCES "MonthlyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "Poster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
