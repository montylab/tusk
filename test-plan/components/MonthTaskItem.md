# MonthTaskItem Component Test Plan

## Description

`MonthTaskItem.vue` is a compact task row inside a month cell. Shows a colored bullet, optional time, and truncated title.

## Props: `task: Task`, `isDragging?: boolean`

## Events: `click(task, event)`, `dblclick(task)`, `dragstart(task, event)`

## Unit Tests

### Rendering

- [ ] **Bullet Color**: Verify `.bullet` bg matches `categoryColor` (task.color → category → default fallback).
- [ ] **Time Display**: Verify time shown only when `task.startTime` is not null/undefined.
- [ ] **Time Format**: Verify `formatTime` outputs `H:MM` format.
- [ ] **Title Truncation**: Verify `.title` has `text-overflow: ellipsis`.

### Interactions

- [ ] **Click**: Verify `stopPropagation` + emits `click(task, event)`.
- [ ] **Double Click**: Verify `stopPropagation` + emits `dblclick(task)`.
- [ ] **Drag Start**: Verify `draggable="true"` attribute and emits `dragstart(task, event)`.
- [ ] **Dragging State**: Verify `.dragging` class applies `opacity: 0.5`.

### Visual

- [ ] **Hover**: Verify `var(--surface-hover)` background on hover.
