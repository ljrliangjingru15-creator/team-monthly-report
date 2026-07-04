# 2027 Application Management MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first application-management web app that safely imports flexible Excel workbooks, tracks students and school applications, surfaces risks, and generates editable monthly reports.

**Architecture:** Use a Next.js App Router application with server actions/API routes around a Prisma repository layer. Excel parsing is a pure pipeline—detect, map, normalize, match, diff—whose output is persisted only after explicit confirmation in a database transaction. Risk and report generation are pure domain services triggered after imports and manual edits.

**Tech Stack:** Next.js, TypeScript, React, Prisma, SQLite, Zod, SheetJS `xlsx`, TanStack Table, Tailwind CSS, Vitest, Testing Library, Playwright, date-fns, docx, pdf-lib.

---

## File map

- `src/features/import/`: workbook detection, header aliases, parsers, normalization, matching, diffing and commit orchestration.
- `src/features/students/`: student queries, forms, list and detail UI.
- `src/features/applications/`: application queries, forms, filtering and export.
- `src/features/risk/`: deterministic risk rules and recalculation.
- `src/features/reports/`: monthly report generation, editing and export.
- `src/features/audit/`: change-log creation and display.
- `src/lib/db/`: Prisma client and repository transaction helpers.
- `src/app/`: routes and page composition only; business logic stays in feature modules.
- `tests/fixtures/`: synthetic, anonymized workbooks matching the two supplied real structures.

### Task 1: Bootstrap the application and test harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/components/app-shell.tsx`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `tests/smoke/home.test.tsx`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Initialize Git and install the pinned application dependencies**

Run:

```bash
git init
pnpm init
pnpm add next react react-dom @prisma/client zod xlsx @tanstack/react-table date-fns lucide-react clsx tailwind-merge docx pdf-lib
pnpm add -D typescript @types/node @types/react @types/react-dom prisma vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test eslint eslint-config-next tailwindcss
```

Expected: a Git repository exists and dependency installation exits with code 0.

- [ ] **Step 2: Write a failing shell smoke test**

Create `tests/smoke/home.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("shows the application dashboard heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "管理看板" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the test and verify the missing application fails**

Run: `pnpm vitest run tests/smoke/home.test.tsx`  
Expected: FAIL because `@/app/page` does not exist.

- [ ] **Step 4: Add configuration, app shell and minimal dashboard**

Configure `tsconfig.json` with strict mode and `@/* -> ./src/*`. Configure Vitest for `jsdom` and Testing Library setup. Implement `AppShell` with navigation entries 管理看板、学生列表、申请单元、数据导入、导入记录、月度反馈、修改日志. Implement `HomePage` with the `管理看板` heading and empty-state cards.

- [ ] **Step 5: Run checks**

Run:

```bash
pnpm vitest run tests/smoke/home.test.tsx
pnpm next build
```

Expected: one passing test and a successful production build.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: bootstrap application management app"
```

### Task 2: Create the database schema and audit transaction boundary

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db/client.ts`
- Create: `src/lib/db/transaction.ts`
- Create: `src/features/audit/types.ts`
- Create: `src/features/audit/write-change-log.ts`
- Create: `tests/db/change-log.test.ts`

- [ ] **Step 1: Write a failing audit test**

Create a test database in `tests/db/change-log.test.ts` and assert:

```ts
const result = await updateWithAudit({
  actorId: user.id,
  source: "MANUAL",
  entityType: "STUDENT",
  entityId: student.id,
  before: { currentStage: "文书" },
  after: { currentStage: "递交" },
  update: (tx) => tx.student.update({
    where: { id: student.id },
    data: { currentStage: "递交" },
  }),
});

expect(result.logs).toEqual([
  expect.objectContaining({
    fieldName: "currentStage",
    oldValue: "文书",
    newValue: "递交",
  }),
]);
```

- [ ] **Step 2: Run the database test and verify failure**

Run: `pnpm vitest run tests/db/change-log.test.ts`  
Expected: FAIL because the Prisma schema and `updateWithAudit` do not exist.

- [ ] **Step 3: Define the schema**

Create enums for role, import status/source, entity type, risk level and archive state. Create `User`, `Student`, `Application`, `ImportBatch`, `ImportIssue`, `ChangeLog`, and `MonthlyReportDraft` models with indexes on season, counselor, student name, deadline, status, result and risk. Use nullable string/date fields for optional imported values and `deletedAt` for soft deletion.

The schema must include:

```prisma
model ChangeLog {
  id            String   @id @default(cuid())
  entityType    EntityType
  entityId      String
  fieldName     String
  oldValue      String?
  newValue      String?
  changedById   String
  changeSource  ChangeSource
  importBatchId String?
  changedAt     DateTime @default(now())
  changedBy     User     @relation(fields: [changedById], references: [id])
}
```

- [ ] **Step 4: Generate and migrate**

Run:

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
```

Expected: migration succeeds and Prisma Client is generated.

- [ ] **Step 5: Implement atomic updates with field-level logs**

Implement `updateWithAudit` so it filters unchanged fields, serializes dates consistently, omits sensitive fields, performs the entity update and inserts logs inside one Prisma transaction.

- [ ] **Step 6: Verify and commit**

Run: `pnpm vitest run tests/db/change-log.test.ts`  
Expected: PASS.

```bash
git add prisma src/lib/db src/features/audit tests/db
git commit -m "feat: add structured data and audit log"
```

### Task 3: Detect workbook layouts and map headers safely

**Files:**
- Create: `src/features/import/types.ts`
- Create: `src/features/import/aliases.ts`
- Create: `src/features/import/normalize-header.ts`
- Create: `src/features/import/detect-layout.ts`
- Create: `src/features/import/map-headers.ts`
- Create: `tests/import/header-mapping.test.ts`
- Create: `tests/fixtures/build-workbooks.ts`

- [ ] **Step 1: Build anonymized workbook fixtures**

Create fixtures in memory with:

```ts
export const masterHeaders = [
  "序号", "条线", "学生姓名", "后期顾问", "中期顾问", "前期顾问",
  "交接备注", "特殊情况备注", "申请类别", "合同号", "在读院校",
  "课程体系", "GPA", "语言", "标化", "AP", "背景", "6月跟进情况",
];

export const handoffGroups = [
  ["学生基本信息", 2, 38],
  ["定校", 39, 54],
  ["申请递交进度", 55, 78],
  ["确认入读", 79, 92],
];
```

Populate synthetic names such as `测试学生甲`; never copy real names, accounts, passwords, contract amounts or narrative notes.

- [ ] **Step 2: Write failing layout and alias tests**

Assert that:

```ts
expect(detectLayout(masterWorkbook)).toBe("STUDENT_MASTER");
expect(detectLayout(handoffWorkbook)).toBe("STUDENT_HANDOFF");
expect(mapHeaders(["姓名", "负责顾问", "DDL"])).toMatchObject({
  studentName: 0,
  counselor: 1,
  deadline: 2,
});
expect(mapHeaders(["密码"]).ignoredSensitive).toEqual([0]);
```

- [ ] **Step 3: Run and verify failure**

Run: `pnpm vitest run tests/import/header-mapping.test.ts`  
Expected: FAIL because mapping functions do not exist.

- [ ] **Step 4: Implement normalization and layout detection**

`normalizeHeader` trims whitespace/newlines, applies Unicode NFKC, removes decorative punctuation and lowercases Latin text. `mapHeaders` considers group plus child header to distinguish duplicate names. `detectLayout` scores known landmark headers and returns `UNKNOWN` below a fixed confidence threshold.

Sensitive detection must match `密码|登录账密|账号和密码|用户名和密码` before normal alias mapping.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run tests/import/header-mapping.test.ts`  
Expected: PASS for reordered, missing, aliased and sensitive headers.

```bash
git add src/features/import tests/import tests/fixtures
git commit -m "feat: detect workbook layouts and map flexible headers"
```

### Task 4: Parse and normalize master and per-student sheets

**Files:**
- Create: `src/features/import/normalize-value.ts`
- Create: `src/features/import/parse-master-sheet.ts`
- Create: `src/features/import/parse-handoff-sheet.ts`
- Create: `src/features/import/parse-workbook.ts`
- Create: `tests/import/parsers.test.ts`

- [ ] **Step 1: Write failing parser tests**

Cover reordered columns, omitted optional columns, Excel serial dates, text dates, extra note columns and downward student identity inheritance:

```ts
const parsed = parseHandoffSheet(handoffSheet);
expect(parsed.student.name).toBe("测试学生甲");
expect(parsed.applications).toHaveLength(2);
expect(parsed.applications[1].studentName).toBe("测试学生甲");
expect(parsed.applications[0].deadline).toEqual(new Date("2026-11-01T00:00:00.000Z"));
expect(JSON.stringify(parsed)).not.toContain("Secret123");
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run tests/import/parsers.test.ts`  
Expected: FAIL because parsers do not exist.

- [ ] **Step 3: Implement date and status normalization**

Implement `normalizeDate`, `normalizeSchoolName`, `normalizeRound`, `normalizeApplicationStatus`, and `normalizeResult`. Return `{ value, rawValue, warning? }` for invalid values so previews can display the source without overwriting a valid database value.

- [ ] **Step 4: Implement both parsers**

Master parser emits one student candidate per valid row. Handoff parser reads group/child headers, uses the first valid student identity for following application rows in that sheet, ignores instruction/example rows, and emits structured warnings for missing identity, school or deadline.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run tests/import/parsers.test.ts`  
Expected: PASS with no sensitive values in parsed output.

```bash
git add src/features/import tests/import
git commit -m "feat: parse master and student application workbooks"
```

### Task 5: Match entities and produce an import preview

**Files:**
- Create: `src/features/import/match-student.ts`
- Create: `src/features/import/match-application.ts`
- Create: `src/features/import/build-diff.ts`
- Create: `src/features/import/preview-import.ts`
- Create: `tests/import/diff.test.ts`

- [ ] **Step 1: Write failing matching and diff tests**

Assert priority matching by ID, contract number, then composite key. Test ambiguous students, new applications, non-empty updates, blank-value preservation and scoped suspected deletions:

```ts
expect(diff.updates).toEqual([
  expect.objectContaining({
    entity: "APPLICATION",
    changes: { applicationStatus: { from: "填写中", to: "已递交" } },
  }),
]);
expect(diff.unchangedFields).toContain("essayStatus");
expect(partialMasterDiff.suspectedDeletes).toHaveLength(0);
expect(completeStudentSheetDiff.suspectedDeletes).toHaveLength(1);
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run tests/import/diff.test.ts`  
Expected: FAIL because matching and diff services do not exist.

- [ ] **Step 3: Implement deterministic matching**

Return a discriminated result:

```ts
type MatchResult<T> =
  | { kind: "matched"; record: T; reason: "ID" | "CONTRACT" | "COMPOSITE" }
  | { kind: "new" }
  | { kind: "ambiguous"; candidates: T[]; reason: string };
```

Never pick the first ambiguous candidate.

- [ ] **Step 4: Implement diff generation**

Only non-empty imported fields create updates. Suspected deletion runs only when `scope.kind === "COMPLETE_SINGLE_STUDENT"` and identity/application-region confidence thresholds pass. Redact sensitive values from every preview object.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run tests/import/diff.test.ts`  
Expected: PASS.

```bash
git add src/features/import tests/import
git commit -m "feat: preview safe import differences"
```

### Task 6: Build import API, confirmation transaction and three-step UI

**Files:**
- Create: `src/app/api/imports/preview/route.ts`
- Create: `src/app/api/imports/[id]/commit/route.ts`
- Create: `src/features/import/commit-import.ts`
- Create: `src/features/import/components/import-wizard.tsx`
- Create: `src/features/import/components/field-match-table.tsx`
- Create: `src/features/import/components/diff-review.tsx`
- Create: `src/app/import/page.tsx`
- Create: `src/app/imports/page.tsx`
- Create: `tests/import/commit-import.test.ts`
- Create: `tests/e2e/import.spec.ts`

- [ ] **Step 1: Write a failing transaction test**

Create an import with one student update and one application insert. Force the second operation to throw and assert neither change nor log persists. Then run a successful case and assert all entities and logs share the batch ID.

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run tests/import/commit-import.test.ts`  
Expected: FAIL because commit orchestration does not exist.

- [ ] **Step 3: Implement preview and commit routes**

Use Zod request schemas. Preview accepts the workbook, season, import type and selected sheets; stores an expiring preview batch and returns mappings/diffs/issues. Commit accepts explicit resolutions for ambiguous and suspected-delete items and applies all changes in one Prisma transaction.

- [ ] **Step 4: Implement the three-step wizard**

Step 1 selects file, season, type and sheets. Step 2 groups changes into 新增、更新、疑似删除、缺失字段、待确认、忽略敏感列. Step 3 submits and links to the immutable import summary. Disable submit until blocking issues are resolved.

- [ ] **Step 5: Add and run browser acceptance**

Test upload of the synthetic workbook, verify the preview counters, confirm, then verify the import record page.

Run:

```bash
pnpm vitest run tests/import/commit-import.test.ts
pnpm playwright test tests/e2e/import.spec.ts
```

Expected: transaction tests and import browser flow pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/imports src/app/import src/app/imports src/features/import tests
git commit -m "feat: add reviewed transactional Excel imports"
```

### Task 7: Add student/application lists, filters and audited editing

**Files:**
- Create: `src/features/students/queries.ts`
- Create: `src/features/students/actions.ts`
- Create: `src/features/students/components/student-table.tsx`
- Create: `src/features/students/components/student-form.tsx`
- Create: `src/features/students/components/student-detail.tsx`
- Create: `src/features/applications/queries.ts`
- Create: `src/features/applications/actions.ts`
- Create: `src/features/applications/components/application-table.tsx`
- Create: `src/features/applications/components/application-form.tsx`
- Create: `src/app/students/page.tsx`
- Create: `src/app/students/[id]/page.tsx`
- Create: `src/app/applications/page.tsx`
- Create: `src/app/api/applications/export/route.ts`
- Create: `tests/e2e/edit-and-filter.spec.ts`

- [ ] **Step 1: Write failing edit/filter browser tests**

Seed two counselors, multiple deadlines, statuses and risks. Assert combined filters narrow results, editing a status changes the row, a log entry appears, and archiving removes the student from the active list.

- [ ] **Step 2: Run and verify failure**

Run: `pnpm playwright test tests/e2e/edit-and-filter.spec.ts`  
Expected: FAIL because pages and actions do not exist.

- [ ] **Step 3: Implement query objects and URL-backed filters**

Validate filters with Zod and translate them to Prisma `where` clauses. Support counselor, student, school, date range, track, status, result and risk. Keep filters in URL search parameters so views are shareable and export uses the same query.

- [ ] **Step 4: Implement audited CRUD**

Use `updateWithAudit` for every edit. Student deletion means archive; application deletion means soft delete. Include explicit cancel actions. Never accept `password`, account or contract amount fields in action schemas.

- [ ] **Step 5: Implement list/detail UI and export**

Lists contain common fields only. Student detail groups 基础信息、背景与顾问、申请学校、风险记录、修改记录、月度反馈. Export writes the current filtered application rows with safe fields only.

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm playwright test tests/e2e/edit-and-filter.spec.ts
pnpm next build
```

Expected: browser tests and build pass.

```bash
git add src/features/students src/features/applications src/app/students src/app/applications src/app/api/applications tests/e2e
git commit -m "feat: manage and filter students and applications"
```

### Task 8: Implement risk rules and dashboard aggregation

**Files:**
- Create: `src/features/risk/types.ts`
- Create: `src/features/risk/evaluate-risk.ts`
- Create: `src/features/risk/recalculate.ts`
- Create: `src/features/dashboard/queries.ts`
- Create: `src/features/dashboard/components/overview-cards.tsx`
- Create: `src/features/dashboard/components/counselor-summary.tsx`
- Create: `src/features/dashboard/components/deadline-risk-table.tsx`
- Modify: `src/app/page.tsx`
- Create: `tests/risk/evaluate-risk.test.ts`

- [ ] **Step 1: Write table-driven failing risk tests**

Cover every red/yellow rule, boundary days 7/14, past deadlines, cancelled/submitted exclusions, missing data, manual override and green default:

```ts
expect(evaluateRisk({
  today: new Date("2026-10-25"),
  deadline: new Date("2026-11-01"),
  applicationStatus: "填写中",
})).toMatchObject({ systemLevel: "RED", finalLevel: "RED" });

expect(evaluateRisk({
  systemLevel: "RED",
  manualLevel: "GREEN",
})).toMatchObject({ finalLevel: "GREEN" });
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run tests/risk/evaluate-risk.test.ts`  
Expected: FAIL because the risk evaluator does not exist.

- [ ] **Step 3: Implement pure risk evaluation and recalculation**

Return level plus structured reasons and missing-rule-data warnings. Trigger recalculation after relevant imported or manually edited fields. Default thresholds: essay stale 10 days, follow-up stale 14 days.

- [ ] **Step 4: Implement dashboard queries and widgets**

Aggregate total students/applications, submitted/unsubmitted, admits, red risk, 7/14 day deadlines and counselor summary. List actionable deadline/risk rows with links to the student.

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm vitest run tests/risk/evaluate-risk.test.ts
pnpm next build
```

Expected: risk tests and build pass.

```bash
git add src/features/risk src/features/dashboard src/app/page.tsx tests/risk
git commit -m "feat: calculate risks and show management dashboard"
```

### Task 9: Generate, edit and export monthly report drafts

**Files:**
- Create: `src/features/reports/generate-monthly-report.ts`
- Create: `src/features/reports/export-markdown.ts`
- Create: `src/features/reports/export-docx.ts`
- Create: `src/features/reports/export-pdf.ts`
- Create: `src/features/reports/components/report-editor.tsx`
- Create: `src/app/reports/page.tsx`
- Create: `src/app/reports/[id]/page.tsx`
- Create: `src/app/api/reports/[id]/export/[format]/route.ts`
- Create: `tests/reports/monthly-report.test.ts`
- Create: `tests/e2e/monthly-report.spec.ts`

- [ ] **Step 1: Write failing report-generation tests**

Seed monthly change logs, an upcoming deadline, incomplete material, a red risk and counselor notes. Assert all seven report sections exist, completed actions come only from the selected month, counselor notes take priority and sensitive fields never appear.

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run tests/reports/monthly-report.test.ts`  
Expected: FAIL because report generation does not exist.

- [ ] **Step 3: Implement deterministic Markdown generation**

Generate:

```md
# 测试学生甲 7月申请服务进度反馈
## 一、当前申请阶段
## 二、本月已完成事项
## 三、当前进行中事项
## 四、下月计划
## 五、需要学生/家长配合事项
## 六、当前风险提醒
## 七、顾问建议
```

Use change logs for completed work, current application state for ongoing work, future deadlines for plans and `monthlyFeedbackNotes` for counselor advice.

- [ ] **Step 4: Implement editor and safe exports**

Save editable drafts before export. Markdown returns UTF-8 text; DOCX and PDF render headings/lists and Chinese text. Apply a final sensitive-term filter to all formats.

- [ ] **Step 5: Add browser acceptance and verify**

Run:

```bash
pnpm vitest run tests/reports/monthly-report.test.ts
pnpm playwright test tests/e2e/monthly-report.spec.ts
```

Expected: report unit and browser tests pass; all three exports download.

- [ ] **Step 6: Commit**

```bash
git add src/features/reports src/app/reports src/app/api/reports tests
git commit -m "feat: generate editable monthly feedback reports"
```

### Task 10: Complete security, regression and local handoff

**Files:**
- Create: `src/lib/security/sensitive-fields.ts`
- Create: `tests/security/no-sensitive-persistence.test.ts`
- Create: `tests/e2e/mvp-acceptance.spec.ts`
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Write a failing cross-layer sensitive-data test**

Import a workbook containing password/account columns, commit it, query every persisted text field and serialize API responses/exports. Assert the fixture secret and sensitive column values occur zero times.

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run tests/security/no-sensitive-persistence.test.ts`  
Expected: FAIL until every persistence and export boundary uses the shared sensitive-field policy.

- [ ] **Step 3: Centralize and apply the sensitive-field policy**

Export `isSensitiveHeader`, `redactObject`, `assertSafeExportFields`, and `SENSITIVE_FIELD_NAMES`. Use them in parsing, preview serialization, audit logging, CRUD schemas, application export and report export.

- [ ] **Step 4: Add the 12-requirement acceptance flow**

The Playwright test must verify: flexible import, column reorder, missing columns, suspected deletion, new school, status update plus log, manual CRUD/archive, combined filters, 7/14/30-day deadline views, monthly draft editing/export, and absence of password content.

- [ ] **Step 5: Write local operation instructions**

Document:

```bash
pnpm install
cp .env.example .env
pnpm prisma migrate deploy
pnpm dev
```

Include backup instructions for the SQLite file, sample-data loading, production build/start, and a PostgreSQL migration note that changes `provider`, `DATABASE_URL`, runs migration tests and deploys to a fresh database.

- [ ] **Step 6: Run the full verification suite**

Run:

```bash
pnpm prisma migrate reset --force
pnpm lint
pnpm vitest run
pnpm playwright test
pnpm next build
```

Expected: all commands exit 0; no skipped acceptance tests; production build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/lib/security tests README.md .env.example
git commit -m "test: verify MVP security and acceptance criteria"
```

