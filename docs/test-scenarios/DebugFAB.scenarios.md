# Test Scenarios: DebugFAB

## Happy Path

1. [ ] **Component Rendering (Dev Mode)**
   - **Inputs**:
     - Mount component in a development environment (mock `import.meta.env.DEV = true`).
   - **Expected Output**:
     - FAB button is visible.
     - Popover is initially hidden (`isOpen` is false).

2. [ ] **Toggle Menu**
   - **Inputs**:
     - Click FAB button.
   - **Expected Output**:
     - Popover becomes visible (`isOpen` is true).
     - Click again -> Popover becomes hidden.

3. [ ] **Navigation Links**
   - **Inputs**:
     - Open menu.
     - Verify links present (e.g., "Color Scheme Debug").
     - Click a link.
   - **Expected Output**:
     - Navigation occurs (mock router push or link click).
     - Menu closes (`isOpen` becomes false).

4. [ ] **Click Outside to Close**
   - **Inputs**:
     - Open menu.
     - Click anywhere outside the component (e.g., document body).
   - **Expected Output**:
     - Menu closes (`isOpen` becomes false).

## Edge Cases

1. [ ] **Production Mode (Hidden)**
   - **Inputs**:
     - Mount component with `import.meta.env.DEV = false`.
   - **Expected Output**:
     - Component renders nothing (DOM is empty or comment node).

2. [ ] **Unmount Cleanup**
   - **Inputs**:
     - Mount component.
     - Unmount component.
   - **Expected Output**:
     - Window/Document event listeners (mousedown) are removed.
