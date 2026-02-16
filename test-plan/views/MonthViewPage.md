# MonthViewPage Test Plan

## Description

Page component for month calendar view. Parses `year/month` route params, manages `viewYear`/`viewMonth`, and subscribes to all dates in the calendar grid.

## Unit Tests

- [ ] **Route Parse**: Verify `parseRouteDate` sets `viewYear`/`viewMonth` from params.
- [ ] **Default Month**: Verify current month used without params.
- [ ] **Grid Dates**: Verify `updateCurrentDates` sets `tasksStore.currentDates` to flattened grid.
- [ ] **Prev Month**: Verify `goToPrevMonth` decrements month (wraps year at 0→11).
- [ ] **Next Month**: Verify `goToNextMonth` increments month (wraps year at 11→0).
- [ ] **Route Update**: Verify `updateRoute` pushes `month-ymd` with zero-padded month.
- [ ] **Create Task**: Verify `handleCreateTask` opens popup with `startTime: 9` and clicked date.
- [ ] **Route Watch**: Verify `parseRouteDate` + `updateCurrentDates` on param change.
