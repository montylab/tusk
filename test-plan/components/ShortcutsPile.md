# ShortcutsPile Component Test Plan

## Description

`ShortcutsPile.vue` is the Shortcuts sidebar pile that renders `shortcutTasks` from the tasks store. Nearly identical structure to `ToDoPile` but uses shortcut tasks.

## Props: `isHighlighted?: boolean`, `activeTaskId?: number`

## Events: `drag-start`, `update:bounds`, `update:insertion-index`

## Unit Tests

### Rendering

- [ ] **Title**: Verify "Shortcuts" title text.
- [ ] **Tasks from Store**: Verify renders `shortcutTasks` from `tasksStore`.
- [ ] **Compact TaskItem**: Verify `TaskItem` rendered with `isCompact`.
- [ ] **Empty State**: Verify "No shortcuts yet" when empty.

### Chaotic Layout

- [ ] **Same Seed Logic**: Verify rotation (-3 to 3 deg) and offset (-6 to 6px).
- [ ] **Category Shadow**: Verify `boxShadow` uses `getCategoryColor`.

### Insertion Indicators

- [ ] **Index Tracking**: Verify cursor Y maps to correct insertion index.
- [ ] **Emit**: Verify `update:insertion-index` emits on change.

### Interactions

- [ ] **Mouse Down**: Verify emits `drag-start`.
- [ ] **Active Drag**: Verify `.is-active-drag` dims source task.

### Animations

- [ ] **TransitionGroup**: Verify enter (scale 0.25→1), leave (→ scale 0.8), move transitions.
