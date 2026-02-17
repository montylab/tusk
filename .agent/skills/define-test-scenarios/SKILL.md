---
name: Define Test Scenarios
description: Analyze a source file and generate a comprehensive natural-language test scenario document.
---

# Define Test Scenarios

**Goal**: Read a source file and create a `*.scenarios.md` file containing a prioritized list of test cases (Happy Path + Edge Cases).

## Parameters

| Parameter      | Required | Description                                                                |
| :------------- | :------: | :------------------------------------------------------------------------- |
| **SourceFile** |    ✅    | Absolute path to the source file (e.g., `src/components/MyComponent.vue`). |

## Steps

1.  **Read Source**: Read the content of `<SourceFile>`.

    ```
    view_file(SourceFile)
    ```

2.  **Analyze**:
    - Identify **Public API**: Props, emitted events, exposed methods (via `defineExpose`), or exported functions.
    - Identify **Logic**: Conditional rendering (`v-if`), computed properties, state transitions, validation rules.
    - Identify **Dependencies**: Stores, composables, or external services.

3.  **Generate Scenarios**:
    - Create a new file at `docs/test-scenarios/<ComponentName>.scenarios.md`.
    - **Structure**:

      ```markdown
      # Test Scenarios: <ComponentName>

      ## Happy Path

      1. [ ] <Scenario Description>
             - Inputs: ...
             - Expected Output: ...

      ## Edge Cases

      1. [ ] <Scenario Description> (e.g. empty arrays, null props, network error)

      ## UI/Interaction (if applicable)

      1. [ ] <Scenario Description> (e.g. hover states, responsive layout)
      ```

    - **Note**: Do NOT write code yet. Focus on _behavior_.

4.  **Save**: Write the file using `write_to_file`. Ensure parent directories exist.
