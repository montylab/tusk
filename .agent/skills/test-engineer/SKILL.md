---
name: Test Engineer
description: Orchestrates the test engineering process: Discovery -> Scenario Definition -> Verification -> Code Generation -> running tests.
---

# Test Engineer (Orchestrator)

**Goal**: Manage the lifecycle of test generation for all source files in the project.

## Workflow

1.  **Initialize**:
    - **Check OS** for choosing appropriate terminal commands later.
    - **Check for `todo.md`**:
      - If `todo.md` does not exist in `.agent/temp/`, generate it using `_list-files`.
      - Format: `[ ] <FilePath> | Status: Pending`
    - **Read `todo.md`**: Parse the file to find the next pending item.
    - **name conversation** -- add line from which you start doing tasks from todo.

2.  **Iterate (File Loop)**:
    - **Select Next File**: Find the first uncompleted item.
    - **Determine Stage**:
      - **Status: Pending** -> Call `define-test-scenarios`.
      - **Status: Scenarios Defined** -> Call `verify-test-scenarios`.
      - **Status: Verified** -> Call `generate-test-code`.
    - **Execute Sub-skill**: Call the appropriate sub-skill with the file path.
    - **Update Status**:
      - Modify `todo.md` to reflect the new status (e.g. change "Pending" to "Scenarios Defined").
      - If the final step (Code Generation) is successful, mark the checklist item as `[x]`.

3.  **Repeat**: Continue until all files are processed or a manual stop is requested. Do not stop after one iteration.

## Usage

```
# Start the process
run_skill("test-engineer")
```

## Dependencies

- `.agent/skills/_list-files/SKILL.md`
- `.agent/skills/define-test-scenarios/SKILL.md`
- `.agent/skills/verify-test-scenarios/SKILL.md`
- `.agent/skills/generate-test-code/SKILL.md`
