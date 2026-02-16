# useNotificationSystem Composable Test Plan

## Description

Listens for nerve events (`SCHEDULED_TASK_BEGIN`, `SCHEDULED_TASK_END`) and shows browser notifications if enabled in settings.

## Unit Tests

- [ ] **Permission Request**: Verify `Notification.requestPermission()` called if permission is `'default'`.
- [ ] **Task Begin**: Verify notification shown when `notifications.enabled && notifications.taskStarted`.
- [ ] **Task End**: Verify notification shown when `notifications.enabled && notifications.taskEnded`.
- [ ] **Permission Granted**: Verify `new Notification(title, { body, icon })`.
- [ ] **Permission Denied**: Verify no notification shown.
- [ ] **Permission Prompt**: Verify `requestPermission()` called then notification on grant.
- [ ] **Disabled**: Verify no notification when `notifications.enabled` is false.
- [ ] **No Support**: Verify graceful fallback when `Notification` API unavailable.
