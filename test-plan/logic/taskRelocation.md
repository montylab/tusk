# taskRelocation Logic Test Plan

## Description

Business logic router for cross-zone task movement. Dispatches moves/copies/deletes to the correct store action based on source and destination zone names.

## Unit Tests

### Trash Destination

- [ ] **Calendar → Trash**: Verify `deleteScheduledTask(id, date)` where date parsed from zone name.
- [ ] **Todo → Trash**: Verify `deleteTodo(id)`.
- [ ] **Shortcut → Trash**: Verify `deleteShortcut(id)`.

### Calendar Destination

- [ ] **Calendar → Same Day**: Verify `updateScheduledTask(id, date, { startTime, duration })`.
- [ ] **Calendar → Different Day**: Verify `moveScheduledTask(id, oldDate, newDate, updates)`.
- [ ] **Todo → Calendar**: Verify `moveTodoToCalendar(id, date, time, duration)`.
- [ ] **Shortcut → Calendar**: Verify `copyShortcutToCalendar(id, date, time, duration)`.
- [ ] **Temp ID (Ctrl+Click copy)**: Verify `createScheduledTask` when `id` starts with `'temp-'`.

### Todo Destination

- [ ] **Calendar → Todo**: Verify `moveCalendarToTodo(id, date, order)`.
- [ ] **Todo → Todo (Reorder)**: Verify `reorderTodo(id, index)`.
- [ ] **Shortcut → Todo**: Verify `copyShortcutToTodo(id, order)`.
- [ ] **Temp ID → Todo**: Verify `createTodo` with sanitized data.

### Shortcut Destination

- [ ] **Calendar → Shortcut**: Verify `moveCalendarToShortcut(id, date, order)`.
- [ ] **Todo → Shortcut**: Verify `moveTodoToShortcut(id, order)`.
- [ ] **Shortcut → Shortcut (Reorder)**: Verify `reorderShortcut(id, index)`.

### Guards

- [ ] **Null Destination**: Verify no-op when `dest` is falsy.
