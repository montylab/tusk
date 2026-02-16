# useSoundSystem Composable Test Plan (FeedbackSystems)

## Description

Listens for nerve events and plays sound effects (task deleted, task starts, task ends) via Howler.js when sounds are enabled in settings.

## Unit Tests

- [ ] **Task Deleted Sound**: Verify `soundAssets.taskDeleted.play()` on `TASK_DELETED` when `sounds.enabled && sounds.taskDeleted`.
- [ ] **Task Starts Sound**: Verify `soundAssets.taskStarts.play()` on `SCHEDULED_TASK_BEGIN` when `sounds.enabled && sounds.taskStarted`.
- [ ] **Task Ends Sound**: Verify `soundAssets.taskEnds.play()` on `SCHEDULED_TASK_END` when `sounds.enabled && sounds.taskEnded`.
- [ ] **Sounds Disabled**: Verify no play when `sounds.enabled` is false.
- [ ] **Individual Toggle**: Verify individual sound flags respected independently.
- [ ] **Sound Assets**: Verify correct file paths: `task-deleted.mp3`, `schedulled-task-starts.mp3`, `schedulled-task-ends.mp3`.
