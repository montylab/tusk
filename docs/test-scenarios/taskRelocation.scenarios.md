# Test Scenarios: manageTaskRelocation

## Happy Path

### Destination: Trash

1. [ ] **Delete Scheduled Task**
   - **Inputs**: Source='calendar-day-2024-01-01', Dest='trash', Task={id: 1}
   - **Expected**: `store.deleteScheduledTask(1, '2024-01-01')` called.

2. [ ] **Delete Todo**
   - **Inputs**: Source='todo', Dest='trash', Task={id: 1}
   - **Expected**: `store.deleteTodo(1)` called.

3. [ ] **Delete Shortcut**
   - **Inputs**: Source='shortcut', Dest='trash', Task={id: 1}
   - **Expected**: `store.deleteShortcut(1)` called.

### Destination: Calendar (e.g. 2024-01-02)

4. [ ] **Create from Temp Task**
   - **Inputs**: Source='...', Dest='calendar-day-2024-01-02', Task={id: 'temp-123', ...}, DropData={time: 10, duration: 60}
   - **Expected**: `store.createScheduledTask` called with date='2024-01-02' and time=10.

5. [ ] **Move within same day**
   - **Inputs**: Source='calendar-day-2024-01-02', Dest='calendar-day-2024-01-02', Task={id: 1}, DropData={time: 12}
   - **Expected**: `store.updateScheduledTask` called.

6. [ ] **Move to different day**
   - **Inputs**: Source='calendar-day-2024-01-01', Dest='calendar-day-2024-01-02', Task={id: 1}
   - **Expected**: `store.moveScheduledTask` called (SourceDate='2024-01-01', DestDate='2024-01-02').

7. [ ] **Todo to Calendar**
   - **Inputs**: Source='todo', Dest='calendar-day-2024-01-02', Task={id: 1}
   - **Expected**: `store.moveTodoToCalendar` called.

8. [ ] **Shortcut to Calendar (Copy)**
   - **Inputs**: Source='shortcut', Dest='calendar-day-2024-01-02', Task={id: 1}
   - **Expected**: `store.copyShortcutToCalendar` called.

### Destination: Todo

9. [ ] **Create from Temp Task (if applicable)**
   - **Inputs**: Dest='todo', Task={id: 'temp-123'}
   - **Expected**: `store.createTodo` called.

10. [ ] **Calendar to Todo (Unschedule)** - **Inputs**: Source='calendar-day-2024-01-01', Dest='todo', Task={id: 1} - **Expected**: `store.moveCalendarToTodo` called.

11. [ ] **Reorder Todo** - **Inputs**: Source='todo', Dest='todo', DropData={index: 5} - **Expected**: `store.reorderTodo(id, 5)` called.

12. [ ] **Shortcut to Todo (Copy)** - **Inputs**: Source='shortcut', Dest='todo' - **Expected**: `store.copyShortcutToTodo` called.

### Destination: Shortcut

13. [ ] **Calendar to Shortcut** - **Inputs**: Source='calendar-day-2024-01-01', Dest='shortcut' - **Expected**: `store.moveCalendarToShortcut` called.

14. [ ] **Todo to Shortcut** - **Inputs**: Source='todo', Dest='shortcut' - **Expected**: `store.moveTodoToShortcut` called.

15. [ ] **Reorder Shortcut** - **Inputs**: Source='shortcut', Dest='shortcut', DropData={index: 2} - **Expected**: `store.reorderShortcut(id, 2)` called.

## Edge Cases

1. [ ] **Invalid Destination**
   - **Inputs**: Dest=null or ""
   - **Expected**: No store actions called.
