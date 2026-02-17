# Test Scenarios: DayViewPage

## Happy Path

1. [ ] **Renders DayView and layout**
   - Inputs: Mount with route params { date: '2023-01-01' }
   - Expected: TaskPageLayout, DayView, TrashBasketRound rendered

2. [ ] **Updates store currentDates on mount**
   - Inputs: route params { date: '2023-01-01' }
   - Expected: tasksStore.currentDates = ['2023-01-01']

3. [ ] **Updates store on route change**
   - Inputs: push route '2023-01-02'
   - Expected: tasksStore.currentDates updates to ['2023-01-02']

4. [ ] **Scrolls to current time on date change**
   - Inputs: date change
   - Expected: dayViewRef.scrollToCurrentTime called

5. [ ] **Navigates to next day on add-day event**
   - Inputs: DayView emits 'add-day'
   - Expected: tasksStore.addDate called with next day string

6. [ ] **Opens create popup on create-task event**
   - Inputs: DayView emits 'create-task'
   - Expected: TaskEditorPopup prop 'show' becomes true

## Edge Cases

1. [ ] **Defaults to today if no date param**
   - Inputs: route params {}
   - Expected: tasksStore.currentDates = [today]
