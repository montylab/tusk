# firebaseService Test Plan

## Description

Firebase Realtime Database abstraction layer. Provides typed CRUD operations and real-time subscriptions for tasks, categories, and settings under `users/{uid}/`.

## Unit Tests

### Auth Guard

- [ ] **`getUserRoot`**: Verify throws `'User must be logged in'` when `auth.currentUser` is null.
- [ ] **Path Format**: Verify returns `users/${uid}`.

### Subscriptions

- [ ] **`subscribeToDate`**: Verify `onValue` listener on `calendar/{date}`, callback receives `Task[]` with `id` and `date`.
- [ ] **`subscribeToList`**: Verify works for both `'todo'` and `'shortcuts'` list names.
- [ ] **Empty Snapshot**: Verify callback receives `[]` when snapshot is null.
- [ ] **Unsubscribe**: Verify returned function detaches listener.

### CRUD

- [ ] **`createTaskInPath`**: Verify `push + set`, returns task with generated `id`.
- [ ] **`updateTaskInPath`**: Verify `update` at `path/taskId`.
- [ ] **`deleteTaskFromPath`**: Verify `remove` at `path/taskId`.

### Complex Operations

- [ ] **`moveTask`**: Verify atomic multi-path update: `fromPath/id = null`, `toPath/id = data`.
- [ ] **Move with Updates**: Verify `updatesWithMove` merged into task data.
- [ ] **ID Stripped**: Verify `id` excluded from saved data.

### Categories

- [ ] **`subscribeToCategories`**: Verify real-time listener on `categories/`.
- [ ] **`createCategory`**: Verify `push + set`, returns category with `id`.
- [ ] **`updateCategory`**: Verify `update` at `categories/{id}`.
- [ ] **`deleteCategory`**: Verify `remove` at `categories/{id}`.

### Settings

- [ ] **`subscribeToSettings`**: Verify real-time listener on `settings/`, returns `{}` for null.
- [ ] **`updateSettings`**: Verify `update` at `settings/`.
