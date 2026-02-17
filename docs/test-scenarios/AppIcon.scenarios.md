# Test Scenarios: AppIcon

## Happy Path

1. [ ] **Basic Rendering**
   - Inputs: `name: "trash"`
   - Expected Output: Renders `<i>` element with class `app-icon`.
   - Verification: `mask-image` style contains `url(/assets/icons/trash.svg)`.

2. [ ] **Custom Color**
   - Inputs: `name: "trash"`, `color: "red"`
   - Expected Output: `background-color` style is `red`.

3. [ ] **Custom Size**
   - Inputs: `name: "trash"`, `size: "24px"`
   - Expected Output: `width` and `height` styles are `24px`.

## Edge Cases

1. [ ] **Default Props**
   - Inputs: `name: "trash"` (no color/size)
   - Expected Output: `background-color` is `currentColor`, `width` and `height` are `1rem`.

## UI/Interaction

1. [ ] **Visual Check**
   - Verify icon is visible and centered within the element (handled by mask positioning CSS).
