---
name: Test Plan Verification & Sync
description: Verify existing test-plan documents against current source files, correct outdated or incomplete plans, and optionally use the browser to validate UI behavior.
---

# Test Plan Verification & Sync

Audit existing `test-plan/` documents against the live `src/` codebase. Update any plans that are outdated, incomplete, or missing test cases for new functionality. Optionally target a single file.

---

## Input Parameters

| Parameter     | Required | Description                                                                                                                                                  |
| :------------ | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target_file` | No       | Relative path to a single source file (e.g. `src/components/TrashBasketRound.vue`). If provided, only verify this file's plan. If omitted, verify ALL files. |

---

## Phase 1 — Scope Resolution

### If `target_file` is provided:

1. Resolve the corresponding test-plan path (e.g. `src/components/Foo.vue` → `test-plan/components/Foo.md`).
2. If the plan doesn't exist, create it from scratch using the **\_exhaustive-test-plan** skill template.
3. Proceed directly to Phase 2 for this single file.

### If no `target_file`:

1. Run the recursive inventory scan:
   ```powershell
   Get-ChildItem -Path src -File -Recurse -Include *.vue,*.ts,*.js | Resolve-Path -Relative
   ```
2. For each source file, find its matching test-plan document.
3. Flag any source files that have **no matching plan** — these need to be created first.
4. Build a work queue of all `(source_file, plan_file)` pairs.

---

## Phase 2 — Per-File Verification

For **each** `(source_file, plan_file)` pair, execute the following steps **in order**:

### Step 1: Read the source file

```
view_file(source_file)
```

Extract:

- All props, emits, slots (for `.vue`)
- All exported functions, return values (for `.ts`)
- All reactive state, actions, getters (for stores)
- Template structure, event handlers, watchers

### Step 2: Read the existing test plan

```
view_file(plan_file)
```

### Step 3: Diff & identify gaps

Compare source against plan. Look for:

| Gap Type                   | Example                                                |
| :------------------------- | :----------------------------------------------------- |
| **Missing prop coverage**  | Source has `isCompact` prop, plan doesn't test it      |
| **Missing event coverage** | Source emits `@dragstart`, plan has no drag test       |
| **Removed functionality**  | Plan tests `handleLegacyMode()` which no longer exists |
| **New methods/watchers**   | Source added a `watch()` block not covered in plan     |
| **Changed signatures**     | Prop renamed from `active` to `isActive`               |
| **Missing edge cases**     | Complex conditional logic with no boundary tests       |

### Step 4: Browser verification (for UI components)

> [!IMPORTANT]
> For any `.vue` component, you MUST open the running app in the browser and visually verify the component's behavior before updating its test plan.

1. Navigate to the page where the component is visible (e.g. `/day` for `DayColumn`, `/settings` for `CategoriesManager`).
2. Interact with the component: click buttons, hover elements, drag items, resize panels.
3. Observe:
   - Does it render correctly?
   - Do animations/transitions work?
   - Are there visual states (hover, active, disabled) not covered in the plan?
4. Take a screenshot if a visual state is noteworthy.

### Step 5: Update the test plan

Apply corrections using `replace_file_content` or `write_to_file`:

- **Add** missing test cases for new functionality
- **Remove** test cases for deleted functionality
- **Update** descriptions, prop names, or event signatures that changed
- **Add browser-observed** edge cases (e.g. "tooltip truncation at narrow widths")

> [!CAUTION]
> Never silently skip a file. If a file has no changes needed, explicitly log it as "✅ Up to date" in the progress tracker.

---

## Phase 3 — Progress Tracking

Maintain a checklist in `task.md` during execution:

```markdown
## Verification Progress

- [x] src/components/TaskItem.vue — Updated: added 3 new prop tests
- [x] src/components/AppHeader.vue — ✅ Up to date
- [ ] src/components/DayColumn.vue — Pending
```

---

## Phase 4 — Summary Report

After all files are processed, update `comparison-report.md` with:

- Last verification date
- Number of plans updated vs unchanged
- List of newly discovered gaps

---

## Checklist for each file (copy-paste for tracking)

```markdown
- [ ] Read source file
- [ ] Read existing test plan
- [ ] Identify gaps (new props, removed methods, changed signatures)
- [ ] Open in browser and interact (UI components only)
- [ ] Update test plan document
- [ ] Mark as verified in task.md
```

---

## Anti-Patterns

| ❌ Don't                                          | ✅ Do                                               |
| :------------------------------------------------ | :-------------------------------------------------- |
| Assume the plan is correct without reading source | Always read source first                            |
| Skip browser verification for UI components       | Open the app, click around, observe                 |
| Batch-update multiple plans from memory           | Process one file at a time                          |
| Leave "no changes needed" unmarked                | Explicitly mark as "✅ Up to date"                  |
| Overwrite plans wholesale                         | Use targeted edits to preserve existing valid cases |
