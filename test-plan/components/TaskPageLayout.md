# TaskPageLayout Component Test Plan

## Description

`TaskPageLayout.vue` is the page-level layout shell providing main content area (with named slots) and a right sidebar with resizable Shortcuts + To-Do piles.

## Props: `title?: string`

## Events: `edit(task)` (bubbled)

## Unit Tests

### Layout

- [ ] **Flex Layout**: Verify `.page-layout` is flex with main + sidebar.
- [ ] **Slots**: Verify `header`, `default`, and `popups` slots render content.
- [ ] **Sidebar**: Verify right sidebar contains `ResizablePanel` + `TaskPile` (Shortcuts above, To Do below).

### Sidebar Configuration

- [ ] **Outer Panel**: Verify `ResizablePanel` with `side="left"`, min=250, max=1600, default=300.
- [ ] **Inner Panel**: Verify shortcuts pile wrapped in `ResizablePanel` with `side="bottom"`, min=200, default=400.
- [ ] **Storage Keys**: Verify `right-sidebar-width` and `shortcuts-pile-height` storage keys.

### Data Binding

- [ ] **Shortcuts**: Verify `shortcutTasks` from store passed to shortcuts `TaskPile`.
- [ ] **To Do**: Verify `todoTasks` from store passed to todo `TaskPile`.
- [ ] **Edit Bubbling**: Verify `@edit` on both piles calls `handleEditTask` → emits `edit`.
