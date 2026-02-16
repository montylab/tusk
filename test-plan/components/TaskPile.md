# TaskPile Component Test Plan

## Description

`TaskPile.vue` is a generic sidebar pile (used for both To-Do and Shortcuts). It renders `TaskItem`s with chaotic rotation/offset, supports drag-and-drop with insertion indicators, and registers as a drop zone.

## Props: `title: string`, `tasks: Task[]`, `listType: 'todo' | 'shortcut'`

## Events: `edit(task)` (bubbled from TaskItem)

## Unit Tests

### Drop Zone Registration

- [ ] **Register on Mount**: Verify `registerZone(listType, bounds, { calculateDropData })`.
- [ ] **Unregister on Unmount**: Verify zone is unregistered and ResizeObserver disconnected.
- [ ] **Bounds Update**: Verify ResizeObserver + window resize listener.

### `calculateDropData`

- [ ] **Index Calculation**: Verify Y-position within content is mapped to correct insertion index.
- [ ] **Order Field**: Verify order is calculated as midpoint between adjacent tasks.

### Chaotic Layout (`getChaoticStyle`)

- [ ] **Rotation**: Verify deterministic rotation from -3 to 3 degrees based on task ID seed.
- [ ] **X Offset**: Verify translateX from -6 to 6px.
- [ ] **Category Shadow**: Verify `boxShadow` uses category color.

### Insertion Indicators

- [ ] **Visible During Drag**: Verify indicator appears at `insertionIndex` when zone is highlighted.
- [ ] **Bottom Indicator**: Verify bottom indicator appears when index equals `tasks.length`.
- [ ] **Hidden When Not Highlighted**: Verify indicators reset to null when zone loses highlight.

### Rendering

- [ ] **Title**: Verify pile title text.
- [ ] **Empty State**: Verify empty message when no tasks.
- [ ] **Compact TaskItem**: Verify `TaskItem` rendered with `isCompact`.
- [ ] **Active Drag Dim**: Verify `.is-active-drag` applies `opacity: 0.25`.
- [ ] **Highlighted**: Verify `.is-highlighted` class with visual feedback.

### Animations

- [ ] **TransitionGroup**: Verify enter/leave/move animations on task list.

### Interactions

- [ ] **Mouse Down → Drag**: Verify `mousedown` calls `startDrag`.
- [ ] **Touch Start → Drag**: Verify `touchstart` calls `startDrag`.
