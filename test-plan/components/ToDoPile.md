# ToDoPile Component Test Plan

## Description

`ToDoPile.vue` is the To-Do sidebar pile that renders `todoTasks` from the tasks store with chaotic layout. It supports drag re-ordering with insertion indicators.

## Props: `isHighlighted?: boolean`, `activeTaskId?: number`

## Events: `drag-start`, `update:bounds`, `update:insertion-index`

## Unit Tests

### Rendering

- [ ] **Title**: Verify "To Do 1" title text.
- [ ] **Tasks from Store**: Verify renders `todoTasks` from `tasksStore`.
- [ ] **Compact TaskItem**: Verify `TaskItem` rendered with `isCompact`.
- [ ] **Empty State**: Verify "No tasks to do" when empty.
- [ ] **Category Shadow**: Verify shadow color from `getCategoryColor`.

### Chaotic Layout

- [ ] **Deterministic Seed**: Verify same ID always produces same rotation/offset.
- [ ] **Rotation Range**: Verify -3 to 3 degrees.
- [ ] **Offset Range**: Verify -6 to 6px translateX.

### Insertion Indicators

- [ ] **Mouse Move Tracking**: Verify `insertionIndex` computed from cursor Y relative to task midpoints.
- [ ] **Emit Index**: Verify `update:insertion-index` emits new index on change.
- [ ] **Reset on Leave**: Verify index resets to null when `isHighlighted` becomes false.
- [ ] **Bottom Indicator**: Verify indicator at `todoTasks.length` position.

### Interactions

- [ ] **Mouse Down**: Verify emits `drag-start` with `{ event, task }`.
- [ ] **Active Drag**: Verify `.is-active-drag` class dims the source task.
- [ ] **Highlighted State**: Verify `.is-highlighted` visual scaling.

### Lifecycle

- [ ] **Bounds Emit**: Verify `update:bounds` on `pileRef` mount.
- [ ] **Mouse Move Listener**: Verify added on mount, removed on unmount.
