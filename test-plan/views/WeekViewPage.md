# WeekViewPage Test Plan

## Description

Page component for week calendar view. Parses route date to compute week (Mon–Sun), sets 7 dates in store, and scrolls to today.

## Unit Tests

- [ ] **Week Computation**: Verify `getMonday` + `getWeekDays` produces 7 consecutive dates.
- [ ] **Default Week**: Verify current week used when no route param.
- [ ] **Store Sync**: Verify `tasksStore.currentDates = weekDays`.
- [ ] **Scroll**: Verify `scrollToCurrentTime()` + `scrollToDate(today)` if today is in the week.
- [ ] **Week Change Navigation**: Verify `router.push` on `onDayChange`.
- [ ] **Add Day**: Verify `handleAddDay` adds date after last visible date.
- [ ] **Editor Integration**: Verify same `TaskEditorPopup` bindings as DayViewPage.
