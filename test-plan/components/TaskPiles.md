# Task Piles Test Plan

## Description

Covers `TaskPile.vue` (base component), `ToDoPile.vue`, and `ShortcutsPile.vue`. These components manage the list display, reordering logic, and drag initiation for tasks in the sidebars.

## Unit Tests

### TaskPile (Base)

- [ ] **Insertion Logic**: Verify `calculateDropData` returns the correct index based on coordinate math.
- [ ] **Zone Registration**: Verify it registers itself based on the `listType` prop ('todo' or 'shortcut').
- [ ] **Chaotic Effect**: Verify `getChaoticStyle` is applied to items for visual variety.

### ToDoPile & ShortcutsPile

- [ ] **Prop Passing**: Verify correct task arrays are passed to the base `TaskPile`.
- [ ] **Header Rendering**: Verify the title prop is correctly displayed.

## Integration

- [ ] **Drag Operator**: Verify that dropping a task onto the `TaskPile` area triggers the `calculateDropData` callback.
- [ ] **Reordering**: Verify that moving an item within the same pile updates the `order` property correctly.
