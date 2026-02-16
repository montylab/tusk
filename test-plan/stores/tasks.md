# Tasks Store Test Plan

## Description

Core Pinia store managing all task types (scheduled, todo, shortcut) with per-date Firebase subscriptions and cross-type relocation actions.

## Unit Tests

### State

- [ ] **`tasks`**: Verify merged read-only array of all task types.
- [ ] **`currentDates`**: Verify reactive array of currently visible dates.
- [ ] **`scheduledTasks`**: Verify `Record<string, Task[]>` keyed by date.
- [ ] **`todoTasks` / `shortcutTasks`**: Verify separate arrays sorted by order.

### Sync Logic

- [ ] **User Login**: Verify `setupSync` subscribes to todos and shortcuts.
- [ ] **User Logout**: Verify `clearState` resets all state and unsubscribes.
- [ ] **Date Subscription**: Verify `subscribeToCalendarDate(date)` creates Firebase listener.
- [ ] **Date Unsubscription**: Verify old dates unsubscribed when `currentDates` changes.
- [ ] **`updateMergedState`**: Verify `tasks` ref rebuilt from all sources.

### Create Actions

- [ ] **`createTodo`**: Verify creates with `isShortcut: false`, `startTime: null`, nerve event emitted.
- [ ] **`createShortcut`**: Verify creates with `isShortcut: true`, `startTime: null`.
- [ ] **`createScheduledTask`**: Verify creates with date, startTime, duration and nerve event.

### Update Actions

- [ ] **`updateTodo`**: Verify `firebaseService.updateTodo`.
- [ ] **`updateShortcut`**: Verify `firebaseService.updateShortcut`.
- [ ] **`updateScheduledTask`**: Verify cross-date move uses `moveScheduledTask`, same-date uses `firebaseService.updateCalendarTask`.

### Move Actions

- [ ] **`moveTodoToCalendar`**: Verify todo deleted, scheduled task created.
- [ ] **`moveCalendarToTodo`**: Verify scheduled task deleted, todo created.
- [ ] **`moveTodoToShortcut`**: Verify todo deleted, shortcut created.
- [ ] **`moveCalendarToShortcut`**: Verify scheduled task deleted, shortcut created.
- [ ] **`moveScheduledTask`**: Verify task transferred between dates atomically.

### Copy Actions

- [ ] **`copyShortcutToTodo`**: Verify new todo created without deleting shortcut.
- [ ] **`copyShortcutToCalendar`**: Verify new scheduled task created without deleting shortcut.

### Delete Actions

- [ ] **`deleteTodo`**: Verify `firebaseService.deleteTodo` + nerve event.
- [ ] **`deleteShortcut`**: Verify `firebaseService.deleteShortcut`.
- [ ] **`deleteScheduledTask`**: Verify `firebaseService.deleteCalendarTask` + nerve event.

### Reorder

- [ ] **`calculateNewOrder`**: Verify midpoint logic for todo/shortcut ordering.
- [ ] **`reorderTodo`**: Verify updates todo with new order.
- [ ] **`reorderShortcut`**: Verify updates shortcut with new order.

### Date Management

- [ ] **`addDate`**: Verify date added to `currentDates` if not present.
- [ ] **`removeDate`**: Verify date removed with unsubscribe.
