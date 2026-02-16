# MonthTaskPopover Component Test Plan

## Description

`MonthTaskPopover.vue` is a floating card teleported to `<body>` that shows task details when a task is clicked in the month view. Supports edit and delete actions.

## Props: `task: Task | null`, `visible: boolean`, `anchorEl: HTMLElement | null`

## Events: `close`, `edit(task)`, `delete(task)`

## Unit Tests

### Positioning (`calculatePosition`)

- [ ] **Center Align**: Verify popover left = `anchor.center - popover.width / 2`.
- [ ] **Bottom Overflow**: Verify popover flips above anchor when it would overflow viewport.
- [ ] **Padding**: Verify 12px minimum distance from viewport edges.

### Content

- [ ] **Color Bar**: Verify `.color-bar` bg matches `categoryColor()` (same 3-tier fallback).
- [ ] **Title**: Verify title text with ellipsis overflow.
- [ ] **Time Row**: Verify time shown only when `task.startTime` is defined.
- [ ] **Duration**: Verify `formatDuration` outputs "Xm" or "Xh Ym" format.
- [ ] **Category**: Verify category name (or "Uncategorized") with category color.
- [ ] **Description**: Verify shown only if `task.description` is truthy.

### Interactions

- [ ] **Edit Click**: Verify emits `edit(task)`.
- [ ] **Delete Click**: Verify emits `delete(task)`.
- [ ] **Click Outside**: Verify clicking outside popover emits `close`.
- [ ] **Escape Key**: Verify pressing Escape emits `close`.

### Lifecycle

- [ ] **Listener Attach**: Verify `click` and `keydown` listeners added when `visible` becomes true.
- [ ] **Listener Cleanup**: Verify listeners removed when `visible` becomes false and on unmount.

### Visual

- [ ] **Teleport**: Verify teleported to `<body>`.
- [ ] **Transition**: Verify scale(0.25) + opacity entrance animation.
