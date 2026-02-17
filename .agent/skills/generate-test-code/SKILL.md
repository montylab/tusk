---
name: Generate Test Code
description: Generate executable test code (Vitest/Playwright) from a verified scenario document.
---

# Generate Test Code

**Goal**: Translate natural language scenarios into executable test code.

## Parameters

| Parameter        | Required | Description                                                                                   |
| :--------------- | :------: | :-------------------------------------------------------------------------------------------- |
| **SourceFile**   |    ✅    | Absolute path to the source file.                                                             |
| **ScenarioFile** |    ✅    | Absolute path to the verified scenario file.                                                  |
| **TestFile**     |    ✅    | Absolute path to the target test file (e.g., `src/components/__tests__/MyComponent.spec.ts`). |

## Steps

1.  **Read Inputs**:

    ```
    view_file(SourceFile)
    view_file(ScenarioFile)
    ```

2.  **Determine Framework**:
    - **Unit/Component**: Use **Vitest** + **Vue Test Utils** (if .vue).
    - **E2E**: Use **Playwright** (if explicitly requested or full page testing).
    - _Default to Vitest for components/logic._

3.  **Generate Code**:
    - Import the component/module.
    - Write a `describe` block for the component.
    - Write `it` or `test` blocks for each scenario in the markdown file.
    - **Mocking**: Mock external dependencies (stores, router, API) using `vi.mock` or `createTestingPinia`.

4.  **Write and Run**:
    - Write the code to `<TestFile>`.
    - **Run Tests**:
      ```powershell
      npm run test:unit -- <TestFile>
      ```

5.  **Refine (Self-Correction)**:
    - If tests fail, analyze the error output.
    - Fix the _test code_ first.
    - If the _source code_ is buggy, fix it (but be careful not to break existing functionality).
    - Repeat until tests pass.

6.  **Finalize**:
    - Ensure all scenarios from the markdown are covered.
    - Mark the scenario file as implemented (optional).
