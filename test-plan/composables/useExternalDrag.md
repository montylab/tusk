# useExternalDrag Composable Test Plan

## Description

Manages drag operations originating from sidebar piles (Shortcuts/ToDo) into the calendar view. Routes drops to the correct store action.

## Unit Tests

- [ ] **Start External Drag**: Verify `handleExternalDragStart` calls `dayViewRef.startExternalDrag` with callback.
- [ ] **Track Active Task**: Verify `activeExternalTask` stores source type and task.
- [ ] **Drop Todo → Calendar**: Verify `tasksStore.moveTodoToCalendar(id, date, startTime, duration)`.
- [ ] **Drop Shortcut → Calendar**: Verify `tasksStore.copyShortcutToCalendar(id, date, startTime, duration)`.
- [ ] **Duration Fallback**: Verify `duration` defaults to `task.duration || 60`.
- [ ] **Delete Todo**: Verify `handleExternalTaskDeleted` calls `tasksStore.deleteTodo(id)`.
- [ ] **Delete Shortcut**: Verify calls `tasksStore.deleteShortcut(id)`.
- [ ] **Cleanup**: Verify `activeExternalTask` reset to null after drop/delete.
- [ ] **No-Op Guard**: Verify functions exit early when `activeExternalTask` is null.
