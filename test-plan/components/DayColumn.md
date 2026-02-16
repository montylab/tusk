# DayColumn Component Test Plan

## Description

`DayColumn.vue` represents a single day's timeline. It renders a background grid of hour/quarter-hour slots and absolute-positioned `TaskItem`s via `TaskResizer` wrappers. It handles click-to-create, drag-to-move, and Ctrl+Click-to-duplicate interactions.

## Props

| Prop           | Type                                           | Description                             |
| :------------- | :--------------------------------------------- | :-------------------------------------- |
| `date`         | `string`                                       | Date string for this column             |
| `tasks`        | `Task[]`                                       | Tasks scheduled for this day            |
| `startHour`    | `number`                                       | Timeline start                          |
| `endHour`      | `number`                                       | Timeline end                            |
| `taskStatuses` | `Record<id, 'past'\|'future'\|'on-air'\|null>` | Status map per task                     |
| `scrollTop`    | `number`                                       | Parent scroll offset Y (default 0)      |
| `scrollLeft`   | `number`                                       | Parent scroll offset X (default 0)      |
| `currentTime`  | `Date`                                         | Current time for past-slot highlighting |

## Events

| Event           | Payload                 | Trigger                         |
| :-------------- | :---------------------- | :------------------------------ |
| `slot-click`    | `{ startTime: number }` | Clicking an empty quarter-slot  |
| `edit`          | `Task`                  | Bubbled from `TaskItem`         |
| `update:bounds` | `DOMRect`               | Emitted when grid bounds change |

## Unit Tests

### Grid Rendering

- [ ] **Hour Rows**: Verify `endHour - startHour` rows are rendered.
- [ ] **Quarter Slots**: Verify each hour row has exactly 4 quarter-slot divs.
- [ ] **Past Highlighting**: Verify `.is-past` class via `isTimePast(date, hour + q*0.25, currentTime)`.
- [ ] **Hover Effect**: Verify `.quarter-slot:hover` applies `--surface-hover` background.

### Task Positioning

- [ ] **Layout Integration**: Verify `useTaskLayout` produces correct `top`, `height`, `left`, `width` styles.
- [ ] **Overlap Shaking**: Verify `isOverlapping` is passed to `TaskItem` as `isShaking`.
- [ ] **Active Drag Visual**: Verify `.dragged-origin` class (opacity 0.25, pointer-events none) when task is being dragged.
- [ ] **Non-dragged Transitions**: Verify static tasks have smooth transition on transform/box-shadow/opacity.

### Drop Data Calculation (`calculateDropData`)

- [ ] **Y-to-Time Conversion**: Verify `relativeY / hourHeight` converts pixel offset to decimal hours.
- [ ] **15-Min Snap**: Verify time snaps to nearest 0.25 increments.
- [ ] **Drag Offset**: Verify `dragOffset.y` is subtracted to align task top (not cursor).
- [ ] **Clamping**: Verify time is clamped between `startHour` and `endHour - taskDuration`.
- [ ] **Snapped Rect**: Verify returned `snappedRect` has correct `top`, `left`, `width`, `height`.

### Interactions

- [ ] **Slot Click**: Verify clicking quarter `q` of `hour` emits `{ startTime: hour + q * 0.25 }`.
- [ ] **Mouse Drag**: Verify `mousedown` on task calls `startDrag(task, zoneName, event)`.
- [ ] **Ctrl+Click Duplicate**: Verify Ctrl/Meta+Click creates a duplicate task with `generateTempId()` and starts drag.
- [ ] **Touch Drag**: Verify `touchstart` on task calls `startDrag(task, zoneName, event)`.

### Zone Management

- [ ] **Register on Mount**: Verify `registerZone` called with zone name, bounds, gridConfig, and `calculateDropData`.
- [ ] **Grid Config**: Verify `snapHeight = hourHeight / 4`, `snapWidth = clientWidth / 7`.
- [ ] **Unregister on Unmount**: Verify `unregisterZone` removes the zone.
- [ ] **ResizeObserver**: Verify a ResizeObserver is attached and calls `updateBounds` on resize.
- [ ] **Window Resize**: Verify `updateBounds` also listens to `window.resize`.
- [ ] **Scroll Watch**: Verify bounds update when `scrollTop` or `scrollLeft` props change.
- [ ] **Cleanup**: Verify ResizeObserver is disconnected and window listener removed on unmount.

## Integration

- [ ] **TaskResizer Wrapping**: Verify each task is wrapped in `TaskResizer` with correct `layout-style` and `start-hour`.
- [ ] **TimeHoverTracker**: Verify each task is wrapped in `TimeHoverTracker` passing `start` and `duration`.
- [ ] **Edit Bubbling**: Verify `TaskItem` `@edit` events are re-emitted by the column.
