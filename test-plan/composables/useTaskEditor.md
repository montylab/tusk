# useTaskEditor Composable Test Plan

## Description

Manages the task editor popup lifecycle: opening for create/edit, dispatching creates/updates to the store, and closing.

## Unit Tests

### Create Flow

- [ ] **Open Create**: Verify `handleOpenCreatePopup` sets `taskToEdit = null`, defaults to snapped time and today's date.
- [ ] **Custom Start Time**: Verify `payload.startTime` overrides default.
- [ ] **Custom Date**: Verify `payload.date` overrides today.
- [ ] **Create Dispatch**: Verify `handleTaskCreate` calls `tasksStore.createScheduledTask` with full payload.
- [ ] **Date Fallback**: Verify `popupTargetDate || currentDates[0]` used when payload.date is missing.

### Edit Flow

- [ ] **Open Edit (Scheduled)**: Verify `popupTaskType = 'scheduled'` when task has `startTime`.
- [ ] **Open Edit (Shortcut)**: Verify `popupTaskType = 'shortcut'` when `isShortcut`.
- [ ] **Open Edit (Todo)**: Verify `popupTaskType = 'todo'` otherwise.
- [ ] **Update Scheduled**: Verify `updateScheduledTask(id, date, updates)`.
- [ ] **Update Shortcut**: Verify `updateShortcut(id, updates)`.
- [ ] **Update Todo**: Verify `updateTodo(id, updates)`.
- [ ] **Task Not Found**: Verify no-op when `getTaskById` returns null.

### Close

- [ ] **Reset State**: Verify popup hidden, `taskToEdit` nulled, `popupTargetDate` nulled.

### UI Store Integration

- [ ] **Create Trigger Watch**: Verify `uiStore.createTaskTrigger` change opens popup.
