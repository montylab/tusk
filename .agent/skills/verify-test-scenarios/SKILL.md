---
name: Verify Test Scenarios
description: Verify existing test-scenarios documents against current source files, correct outdated or incomplete plans, and optionally use the browser to validate UI behavior.
---

# Verify Test Scenarios

**Goal**: Validate the generated scenarios file (`*.scenarios.md`) against the actual application behavior and fix any discrepancies.

## Parameters

| Parameter        | Required | Description                                                                                |
| :--------------- | :------: | :----------------------------------------------------------------------------------------- |
| **SourceFile**   |    ✅    | Absolute path to the source file (e.g., `src/components/MyComponent.vue`).                 |
| **ScenarioFile** |    ✅    | Absolute path to the scenario file (e.g., `docs/test-scenarios/MyComponent.scenarios.md`). |

## Steps

1.  **Read Files**:

    ```
    view_file(SourceFile)
    view_file(ScenarioFile)
    ```

2.  **Browser Verification (For UI Components)**:
    - If the file is a `.vue` component or interacts with UI:
      - **Open Page**: Use `open_browser_url` to navigate to the relevant page where this component is used.
      - **Interact**: Use `click_element`, `type_text`, etc. to trigger the scenarios described.
      - **Verify**: Check if the behavior matches the scenario description.

3.  **Update Scenarios**:
    - **Fix**: Correct any inaccuracies found during verification.
    - **Expand**: Add missing scenarios (e.g. edge cases discovered during manual testing).
    - **Mark**: (Optional) Add a checkmark `[x]` next to verified scenarios in the file.

4.  **Save**: Write the updated content back to `<ScenarioFile>`.

5.  **Report**: If any major issues or bugs are found in the _source code_ itself (not just the test plan), note them in a `BUGS.md` file or notify the user.
