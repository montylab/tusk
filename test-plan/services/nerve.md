# nerve Service Test Plan

## Description

Application-wide event bus built on `mitt`. Defines typed `NERVE_EVENTS` constants and exports a typed emitter instance.

## Unit Tests

### Event Constants

- [ ] **Task Lifecycle**: Verify `TASK_CREATED`, `TASK_DELETED`, `TASK_MOVED`, `TASK_COMPLETED`, `TASK_UNCOMPLETED`.
- [ ] **Scheduled Notifications**: Verify `SCHEDULED_TASK_BEGIN`, `SCHEDULED_TASK_END`, `MINUTE_TICK`.
- [ ] **App State**: Verify `APP_ERROR`.

### Event Types

- [ ] **TASK_CREATED**: Verify payload `{ taskId: string }`.
- [ ] **TASK_DELETED**: Verify payload `void`.
- [ ] **SCHEDULED_TASK_BEGIN/END**: Verify payload `{ title: string; body?: string }`.
- [ ] **MINUTE_TICK**: Verify payload `{ date: Date }`.
- [ ] **APP_ERROR**: Verify payload `{ message: string }`.

### Emitter

- [ ] **`nerve.on/emit`**: Verify `mitt<ApplicationEvents>()` usage (emit, on, off).
