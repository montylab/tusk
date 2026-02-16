# DayView Component Test Plan

## Description

`DayView.vue` is the core layout engine for the calendar grid (used in both Day and Week views). It orchestrates time labels, multi-column layout, task status tracking, daily statistics, boundary time labels, current time indicator, scroll management, and the AddDayZone.

## Props

| Prop          | Type                     | Default | Description                                 |
| :------------ | :----------------------- | :------ | :------------------------------------------ |
| `dates`       | `string[]`               | —       | Array of date strings to display as columns |
| `tasksByDate` | `Record<string, Task[]>` | —       | Tasks grouped by date                       |
| `startHour`   | `number`                 | `0`     | Timeline start hour                         |
| `endHour`     | `number`                 | `24`    | Timeline end hour                           |

## Events

| Event         | Payload               | Trigger                            |
| :------------ | :-------------------- | :--------------------------------- |
| `create-task` | `{ startTime, date }` | Empty slot click (if not dragging) |
| `edit`        | `Task`                | Bubbled from DayColumn/TaskItem    |
| `add-day`     | –                     | AddDayZone clicked                 |

## Exposed Methods

- [ ] **`scrollToTop()`**: Verify smooth scroll to top.
- [ ] **`scrollToDate(date)`**: Verify horizontal scroll to center the target column.
- [ ] **`scrollToCurrentTime(behavior?)`**: Verify scroll to current hour minus 1.

## Unit Tests

### Column Rendering

- [ ] **Column Count**: Verify one `DayColumn` per `dates` entry.
- [ ] **Column Header**: Verify day name + date string + daily stats in each header.
- [ ] **Today Label**: Verify "Today" is shown instead of weekday name for current date.
- [ ] **Sticky Header**: Verify `.column-header` is `position: sticky; top: 0`.

### Time Labels

- [ ] **Hourly Labels**: Verify `endHour - startHour` labels rendered (e.g. "08:00", "09:00").
- [ ] **Boundary Labels**: Verify extra labels at non-integer task start/end times.
- [ ] **Boundary Position**: Verify `top` style: `(time - startHour) * hourHeight + headerOffset`.
- [ ] **Highlighted Labels**: Verify `.is-highlighted` class when `hoveredTimeRange` includes the time.
- [ ] **Current Time Label**: Verify red floating label shows current HH:MM.
- [ ] **Current Time Hidden**: Verify label is hidden when time is outside `startHour`–`endHour`.

### Current Time Indicator

- [ ] **Line Position**: Verify `timeIndicatorTop = (currentHours - startHour) * hourHeight`.
- [ ] **Today Only**: Verify red line + dot shown ONLY on the "Today" column.
- [ ] **Glow Effect**: Verify box-shadow on `.current-time-line`.
- [ ] **Out of Range**: Verify indicator returns `-100` (hidden) if time is outside grid range.

### Daily Statistics (`getDayStats`)

- [ ] **Total Time**: Verify sum of all task durations for the date.
- [ ] **Completed Time**: Verify past tasks contribute full duration, on-air tasks contribute elapsed portion.
- [ ] **Deep Work Tracking**: Verify separate deep work total/completed counters.
- [ ] **Format**: Verify `formatStatsTime` outputs `H:MMh` format.
- [ ] **Deep Badge**: Verify deep work stats row is only shown if `hasDeep` is true.

### Task Status Mapping

- [ ] **Status Computation**: Verify `getTaskStatus(task, now)` is called for all tasks.
- [ ] **Reactivity**: Verify statuses update when `currentTime` changes (via watch).
- [ ] **Task Changes**: Verify statuses update when `tasksByDate` changes.

### Scroll Management

- [ ] **Initial Scroll**: Verify `scrollToCurrentTime()` is called after settings finish loading.
- [ ] **Scroll Tracking**: Verify `scrollTop` and `scrollLeft` are updated on `@scroll`.
- [ ] **UI Scale Watch**: Verify `headerOffset` is recalculated when `uiScale` changes.

### Interactions

- [ ] **Slot Click**: Verify click emits `create-task` with `{ startTime, date }`.
- [ ] **Slot Click Blocked During Drag**: Verify `isDragging` prevents slot click emission.
- [ ] **Add Day**: Verify `onAddDay` emits `add-day` and scrolls container right.
- [ ] **Next Date Label**: Verify `getNextDateLabel` computes correct "Day (Mon DD)" string.

### Lifecycle

- [ ] **Window Resize**: Verify `updateHeaderOffset` listener added on mount, removed on unmount.

## Integration

- [ ] **DayColumn Binding**: Verify all props (`taskStatuses`, `scrollTop`, `scrollLeft`, `currentTime`) are passed.
- [ ] **AddDayZone**: Verify `getNextDateLabel` is passed as `label` prop.
- [ ] **TimeStore**: Verify `currentTime` and `hoveredTimeRange` are consumed from `timeStore`.
- [ ] **AppearanceStore**: Verify `hourHeight` and `uiScale` are consumed from `appearanceStore`.
