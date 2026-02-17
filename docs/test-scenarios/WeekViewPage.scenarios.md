# Test Scenarios: WeekViewPage

## Happy Path

1. [ ] Renders TaskPageLayout and DayView with week dates
   - Inputs: Mount with route param for a known week
   - Expected Output: DayView receives 7 dates starting from Monday.

2. [ ] Navigates to week on day boundary change
   - Inputs: Trigger `onDayChange` callback
   - Expected Output: `router.push` called with `{ name: 'week', params: { date: newDate } }`.

3. [ ] Uses current date when no route param
   - Inputs: Mount with no `:date` route param
   - Expected Output: `tasksStore.currentDates` is set to the current week.

4. [ ] Adds next day via handleAddDay
   - Inputs: Trigger `@add-day` event
   - Expected Output: `tasksStore.addDate` called with next day string.

## Edge Cases

1. [ ] Handles invalid route date gracefully
   - Inputs: Route param `date` is an invalid string
   - Expected Output: Falls back to current date / doesn't crash.
