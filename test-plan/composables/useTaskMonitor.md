# useTaskMonitor Composable Test Plan

## Description

Edge-triggered orchestrator that listens for `MINUTE_TICK` nerve events and emits `SCHEDULED_TASK_BEGIN` / `SCHEDULED_TASK_END` notifications when a task's start or end time matches the current time.

## Unit Tests

- [ ] **Begin Notification**: Verify `SCHEDULED_TASK_BEGIN` emitted when `|startTime - currentDecimal| < 0.005`.
- [ ] **End Notification**: Verify `SCHEDULED_TASK_END` emitted when `|endTime - currentDecimal| < 0.005`.
- [ ] **Edge Trigger**: Verify each task only notified once (tracked by `notifiedEntryTasks`/`notifiedExitTasks` Sets).
- [ ] **Unique Task ID**: Verify key is `String(task.id) + task.startTime`.
- [ ] **No Start Time**: Verify tasks with `startTime !== number` are skipped.
- [ ] **No Duration**: Verify end notification skipped when `task.duration` is falsy.
- [ ] **Today Only**: Verify only scheduled tasks for today's date are checked.
