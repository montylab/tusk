# dateUtils Utility Test Plan

## Description

Shared date/time utility functions used throughout the application.

## Unit Tests

### `formatDate`

- [ ] **Standard**: Verify `Date(2024, 0, 15)` → `"2024-01-15"`.
- [ ] **Zero Padding**: Verify single-digit month/day padded.

### `isToday`

- [ ] **Match**: Verify true for today's formatted date.
- [ ] **Mismatch**: Verify false for yesterday.

### `getNextDay`

- [ ] **Standard**: Verify `"2024-01-15"` → `"2024-01-16"`.
- [ ] **Month Rollover**: Verify `"2024-01-31"` → `"2024-02-01"`.

### `getMonday`

- [ ] **Wednesday**: Verify returns previous Monday.
- [ ] **Sunday**: Verify returns previous Monday (not next).
- [ ] **Monday**: Verify returns same day.

### `getWeekDays`

- [ ] **7 Days**: Verify returns array of 7 consecutive date strings starting from Monday.

### `getMonthCalendarGrid`

- [ ] **Grid Size**: Verify 5 or 6 weeks × 7 days.
- [ ] **Monday Start**: Verify first column is always Monday.
- [ ] **Padding**: Verify includes prev/next month days.

### `getMonthFromDate` / `getYearMonth`

- [ ] **Parse**: Verify correct extraction from date string.

### `getShortDayName`

- [ ] **Mapping**: Verify 0→Mon, 1→Tue, ..., 6→Sun.

### `getMonthName`

- [ ] **Mapping**: Verify 0→January, ..., 11→December.

### `getTimeSnapped`

- [ ] **15-Min Snap**: Verify 9:07 → 9.0, 9:08 → 9.25.
- [ ] **Custom Interval**: Verify 30-min snap.

### `isTimePast`

- [ ] **Past Date**: Verify always true for dates before today.
- [ ] **Future Date**: Verify always false for dates after today.
- [ ] **Today**: Verify compares hour decimal.

### `formatTime`

- [ ] **Whole Hour**: Verify `9` → `"9:00"`.
- [ ] **Decimal**: Verify `9.5` → `"9:30"`.

### `formatDuration`

- [ ] **Minutes Only**: Verify `45` → `"45m"`.
- [ ] **Hours Only**: Verify `120` → `"2h"`.
- [ ] **Mixed**: Verify `90` → `"1h 30m"`.
- [ ] **Zero**: Verify `0` → `"0m"`.
- [ ] **NaN Fallback**: Verify `NaN` → `"1h"` (defaults to 60).
