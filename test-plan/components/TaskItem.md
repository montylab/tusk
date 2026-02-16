# TaskItem Component Test Plan

## Description

`TaskItem.vue` is the primary visual representation of a task. It displays the title, time range, duration, category, and "Deep Work" status. It uses CSS Container Queries to adapt its layout to available width and changes appearance based on its temporal status (past, future, on-air) and size (compact vs. standard).

## Props

| Prop         | Type                                     | Description                                   |
| :----------- | :--------------------------------------- | :-------------------------------------------- |
| `task`       | `Task`                                   | The task data object (required)               |
| `isDragging` | `boolean`                                | Dragging visual state                         |
| `isShaking`  | `boolean`                                | Collision/overlap visual state                |
| `isCompact`  | `boolean`                                | Forced compact layout (used in sidebar piles) |
| `status`     | `'past' \| 'future' \| 'on-air' \| null` | Temporal status for coloring                  |
| `badgeText`  | `string`                                 | Optional shortcut badge (e.g. "Ctrl + 1")     |

## Events

| Event  | Payload | Trigger                                           |
| :----- | :------ | :------------------------------------------------ |
| `edit` | `Task`  | Edit button click OR double-click on root element |

## Unit Tests

### Rendering

- [ ] **Title**: Verify the task title is rendered inside `.title` with text-overflow ellipsis.
- [ ] **Title Tooltip**: Verify `title` attribute on `.title` matches `task.text` for truncation hover.
- [ ] **Time Range**: Verify `formatTime(startTime) - formatTime(endTime)` is shown when `startTime` is not null.
- [ ] **Time Hidden**: Verify `time-badge` is NOT rendered when `task.startTime` is null/undefined.
- [ ] **Duration**: Verify `formatDuration(task.duration)` is always shown.
- [ ] **Category Badge**: Verify `.category-badge` text shows `task.category` or "Uncategorized".
- [ ] **Deep Work Badge**: Verify brain icon + "DEEP" is shown only if `task.isDeepWork` is true.
- [ ] **Description**: Verify description is shown only when NOT compact AND NOT autoCompact.

### Computed Values

- [ ] **`endTime`**: Verify `startTime + duration / 60` calculation. E.g. start=9, duration=90 → endTime=10.5.
- [ ] **`isAutoCompact`**: Verify it returns true when `task.duration <= 30`.
- [ ] **`itemStyle` Color Fallback**: Verify the color resolution chain:
  1. `task.color` (explicit override)
  2. Category store lookup color
  3. `var(--color-default)` fallback

### Layout States

- [ ] **Standard Layout**: Default flex column layout at >= 280px.
- [ ] **Compact Mode** (`isCompact=true`): Verify smaller fonts and reduced padding.
- [ ] **Auto-Compact** (duration <= 30): Verify `is-auto-compact` class applied, row-gap removed.
- [ ] **Ultra-Short** (duration = 15): Verify `time-size-15` class switches `.main-info` to horizontal row layout.
- [ ] **Status `.in-past`**: Verify class applied when `status='past'`.
- [ ] **Status `.in-future`**: Verify class applied when `status='future'`.
- [ ] **Status `.on-air`**: Verify class applied and "ON AIR" tag visible.
- [ ] **Dragging**: Verify `.dragging` class applies blur and elevated shadow.
- [ ] **Shaking**: Verify `.shaking` class triggers scaleX animation.

### Container Queries (Responsive Width)

- [ ] **>= 350px**: Verify category badge `max-width` expands to 150px.
- [ ] **>= 450px**: Verify category badge `max-width` is removed.
- [ ] **>= 600px**: Verify "DEEP" text label becomes visible next to brain icon.

### User Interactions

- [ ] **Edit Button Click**: Verify `emit('edit', task)` is called with `stopPropagation`.
- [ ] **Edit Button Prevent Drag**: Verify `mousedown.stop` and `touchstart.stop` on edit button prevent drag initiation.
- [ ] **Double Click**: Verify double-clicking the root element emits `edit`.
- [ ] **Hover → Edit Visible**: Verify `.header-actions` opacity changes from 0.25 to 1 on hover.
- [ ] **Touch Device**: Verify `.header-actions` has 0.8 opacity on `@media (hover: none)`.

### Shortcut Badge

- [ ] **Rendering**: Verify `.shortcut-badge` shows `badgeText` when prop is provided.
- [ ] **Hidden by Default**: Verify badge has `opacity: 0; visibility: hidden` initially.
- [ ] **Visible on Hover**: Verify badge appears when parent task item is hovered.

### Color Stripe

- [ ] **Rendering**: Verify `.color-stripe` has `background: var(--category-color)`.
- [ ] **Width**: Verify stripe is 0.35rem wide.

### Edit Button Touch Target

- [ ] **Expanded Hit Area**: Verify `::before` pseudo-element expands the clickable area by 10px in all directions.

## E2E / Integration

- [ ] **Drag Start**: Verify the item receives `.dragging` class when drag begins (via parent DayColumn/TaskPile).
- [ ] **Truncation**: Verify long titles are truncated with ellipsis.
- [ ] **Category Color Sync**: Verify changing a category color in settings immediately updates all tasks with that category.
- [ ] **Duration Resize**: Verify resizing a task via `TaskResizer` updates the layout class (e.g. from standard to `time-size-30`).

## Browser Verification

> ⚠️ Browser verification was not possible during this session due to environment issue (`$HOME` not set). Manual browser check recommended for:
>
> - Container query breakpoints at different sidebar widths
> - On-air tag animation
> - Shortcut badge hover reveal in the sidebar
