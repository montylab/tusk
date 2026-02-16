# DayViewPage Test Plan

## Description

Page component for single-day calendar view. Parses route date param, sets `currentDates`, integrates task editor, and handles day-change navigation.

## Unit Tests

- [ ] **Route Date Sync**: Verify `tasksStore.currentDates = [date]` from `route.params.date`.
- [ ] **Default Date**: Verify today used when no route param.
- [ ] **Scroll on Change**: Verify `scrollToCurrentTime()` called after date change.
- [ ] **Day Change Navigation**: Verify `router.push` to new day on `onDayChange`.
- [ ] **Add Day**: Verify `handleAddDay` adds next day via `tasksStore.addDate`.
- [ ] **Editor Integration**: Verify `TaskEditorPopup` receives `showEditorPopup`, `taskToEdit`, and event handlers.
- [ ] **Layout**: Verify renders `TaskPageLayout` with `DayView` and `TrashBasketRound`.
