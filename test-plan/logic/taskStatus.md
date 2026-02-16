# taskStatus Logic Test Plan

## Description

Determines task temporal status: `'past'`, `'on-air'`, `'future'`, or `null`.

## Unit Tests

- [ ] **No Start Time**: Verify returns `null` when `startTime` is null/undefined.
- [ ] **No Date**: Verify returns `null` when `date` is missing.
- [ ] **Past**: Verify `'past'` when task end time is in the past (uses `isTimePast`).
- [ ] **On-Air**: Verify `'on-air'` when task has started but not yet ended.
- [ ] **Future**: Verify `'future'` when task hasn't started yet.
- [ ] **Duration Fallback**: Verify `endTime = startTime + (duration || 60) / 60`.
- [ ] **Cross-Day Past**: Verify past date returns `'past'` regardless of time.
- [ ] **Cross-Day Future**: Verify future date returns `'future'` regardless of time.
