---
name: Generate Test Plans
description: Comprehensive Standard Operating Procedure (SOP) for generating 1:1 test plan coverage for every source file.
---

# Exhaustive Test Plan Generation

Generate a dedicated test-plan document for **every functional source file** in a project. No file may be skipped or silently grouped with another.

## Prerequisites

- The **List Files** skill must be available (`.agent/skills/_list-files/SKILL.md`).

## Phase 1 — Inventory (MANDATORY FIRST STEP)

1. **Generate the Manifest**: Use the **List Files** skill to produce an exhaustive list of source files.
   - **Folder**: The source directory (e.g. `src`).
   - **Extension**: `vue,ts,js,tsx,jsx`
   - **OutputFile**: `.agent/temp/source-files.txt`

   _Note: Ensure the output file is saved to a known location for the next steps._

2. **Create Verification Checklist**: Convert the `source-files.txt` into a checklist in `task.md`. **Every file becomes a checkbox item.**

3. **Establish Target Count**: Count the files in the manifest. This number is the **target** — you are done only when the test-plan directory contains at least this many mappings.

> [!CAUTION]
> Do NOT proceed to Phase 2 until the full file list is captured. Skipping this step is the #1 cause of missed files.

---

## Phase 2 — Directory Setup

Create a `test-plan/` directory that mirrors the source structure:

```
test-plan/
├── components/
├── composables/
├── stores/
├── services/
├── views/
├── logic/
├── utils/
├── core/        # App.vue, main.ts, router, firebase config
└── debug/       # Dev-only tools
```

---

## Phase 3 — File-by-File Plan Generation

### Rules

1. **One file → one plan.** Every source file gets its own `.md` document. Never combine two components into one document just because they are similar.
2. **Read before writing.** Always `view_file` the source before generating the plan. Do not guess props, events, or logic.
3. **Mark the checklist.** After creating each plan, mark the corresponding item in `task.md` as `[x]`.

### Template

Each test-plan document must follow this structure:

```markdown
# <ComponentName> Test Plan

## Description

One-paragraph summary of the file's purpose and role.

## Unit Tests

- [ ] Test case 1: description
- [ ] Test case 2: description
  - [ ] Sub-case if needed

## Integration

- [ ] How it connects to stores / composables / other components
```

### Minimum content per file type

| File Type                                       | Required Sections                                   |
| :---------------------------------------------- | :-------------------------------------------------- |
| `.vue` component                                | Description, Props/Emits, Unit Tests, Integration   |
| `.ts` composable                                | Description, Return values, Unit Tests, Integration |
| `.ts` store                                     | Description, State/Actions/Getters, Unit Tests      |
| `.ts` service                                   | Description, Exported functions, Unit Tests         |
| `.ts` utility                                   | Description, Function signatures, Unit Tests        |
| Config / Entry (`main.ts`, `App.vue`, `router`) | Description, Initialization checks, Integration     |

---

## Phase 4 — Verification

1. **Generate `comparison-report.md`**: A table mapping every source file to its test-plan document with clickable links.
2. **Count check**: Verify the number of mappings matches the Phase 1 count.
3. **Missed files section**: If any files are intentionally excluded (e.g., `vite-env.d.ts`, `types.ts`), list them explicitly with a justification.

> [!IMPORTANT]
> The comparison report is the proof of work. If a file appears in `src` but not in the report, the task is **incomplete**.

---

## Phase 5 — Walkthrough

Create a walkthrough summarizing:

- Total files covered
- Key architectural areas documented
- How to use the plans (Vitest for unit, Playwright for E2E)

---

## Anti-Patterns to Avoid

| ❌ Don't                                      | ✅ Do                       |
| :-------------------------------------------- | :-------------------------- |
| Group 3+ components into one doc              | One doc per component       |
| Write plans from memory                       | Read the file first         |
| Mark "complete" before verification           | Verify against the manifest |
| Skip "simple" files (icons, logos)            | Every file gets a plan      |
| Forget about `common/` or `debug/` subfolders | Scan recursively            |
