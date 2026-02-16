# TaskEditorPopup Component Test Plan

## Description

`TaskEditorPopup.vue` is a modal form used to create or edit tasks. It supports different task types (scheduled, todo, shortcut), a compact view mode, and adjusts its visible fields accordingly. It is teleported to `<body>` and uses a transition animation.

## Props

| Prop               | Type                                  | Description                         |
| :----------------- | :------------------------------------ | :---------------------------------- |
| `show`             | `boolean`                             | Controls visibility                 |
| `initialStartTime` | `number \| null`                      | Pre-fill start time for new tasks   |
| `initialDate`      | `string \| null`                      | Pre-fill date for new tasks         |
| `taskType`         | `'todo' \| 'shortcut' \| 'scheduled'` | Determines which fields are visible |
| `task`             | `Task \| null`                        | If provided, switches to edit mode  |
| `startCompact`     | `boolean`                             | Start in compact layout             |

## Events

| Event    | Payload                                                                | Trigger                                     |
| :------- | :--------------------------------------------------------------------- | :------------------------------------------ |
| `close`  | –                                                                      | Escape key, overlay click, or Cancel button |
| `create` | `{text, description, category, isDeepWork, startTime, duration, date}` | Submit in create mode                       |
| `update` | `{id, updates: Partial<Task>}`                                         | Submit in edit mode                         |

## Unit Tests

### Computed Values

- [ ] **`isEditMode`**: Verify returns `true` when `task` prop is provided.
- [ ] **`isCompactView`**: Verify returns `true` only when `startCompact && !isExpanded && !isEditMode`.
- [ ] **`projectedEndTime`**: Verify `startTime + duration` calculation.
- [ ] **`displayDate`**: Verify formatted as "Mon DD" using `toLocaleDateString`.

### Form Initialization (`resetForm`)

- [ ] **Create Mode Defaults**: Verify empty text, empty description, default duration 1.0 (60 min).
- [ ] **Create Scheduled**: Verify `startTime` defaults to `initialStartTime` or 9 if scheduled type.
- [ ] **Create Todo/Shortcut**: Verify `startTime` defaults to `null`.
- [ ] **Edit Mode Pre-Population**: Verify all fields are populated from `task` prop.
- [ ] **Duration Conversion**: Verify `task.duration` (minutes) is converted to decimal hours for the form.
- [ ] **Date Default**: Verify `taskDate` defaults to today's date string (`YYYY-MM-DD`).

### Field Visibility

- [ ] **Compact View**: Verify only Task Name and Category are shown; duration/description hidden.
- [ ] **Compact Scheduled**: Verify compact meta rows show Deep Work toggle, duration, date, and start time.
- [ ] **Expand Button**: Verify "Show more options" button is shown in compact view and expands to full form.
- [ ] **Duration Hidden for Todo**: Verify duration field is hidden when `taskType='todo'` and NOT in edit mode.
- [ ] **Date & Time for Scheduled**: Verify Date & Time picker is shown when `taskType='scheduled'`.
- [ ] **Date & Time for Edit w/ Start Time**: Verify picker is shown in edit mode if task has `startTime`.

### Validation & Submission

- [ ] **Empty Name Rejected**: Verify `handleSubmit` returns early if `taskText` is empty.
- [ ] **Category Fallback**: Verify empty category defaults to `'Default'`.
- [ ] **Color Fallback**: Verify empty color defaults to `'#3b82f6'`.
- [ ] **Create Payload**: Verify `create` event has all fields, duration in minutes (`Math.round(duration * 60)`).
- [ ] **Update Payload**: Verify `update` event has `{id, updates}` with correct field mapping.
- [ ] **Category Persistence**: Verify `categoriesStore.ensureCategoryExists` is called before emit.
- [ ] **Auto-Close**: Verify `handleClose` is called after successful submit.

### Interactions

- [ ] **Escape Key**: Verify pressing Escape emits `close` when `show` is true.
- [ ] **Overlay Click**: Verify clicking `.popup-overlay` (not the form) emits `close`.
- [ ] **Close Button**: Verify X button in header emits `close`.
- [ ] **Auto-Focus**: Verify text input receives focus 100ms after popup opens.
- [ ] **End Time Preview**: Verify "Ends at HH:MM" preview is shown when `projectedEndTime` is not null.

### Lifecycle

- [ ] **Watch Reset**: Verify `resetForm` is called when `show` or `task` changes.
- [ ] **Keyboard Listener**: Verify `keydown` listener is added on mount and removed on unmount.

### Visual / Animation

- [ ] **Teleport**: Verify component is teleported to `<body>`.
- [ ] **Transition**: Verify `.popup-enter-active` / `.popup-leave-active` classes apply opacity transition.
- [ ] **Slide Up**: Verify `.popup-container` has `slideUp` animation on open.
- [ ] **Header Title**: Verify "Edit Task" in edit mode, "Create New Task" in create mode.
- [ ] **Submit Button Text**: Verify "Save Changes" in edit mode, "Create Task" in create mode.

## Integration

- [ ] **Category Sync**: Verify submitting a new category persists it to the store and Firebase.
- [ ] **Deep Work Toggle**: Verify `AppCheckbox` correctly binds to `isDeepWork`.
- [ ] **CategorySelector**: Verify it correctly binds `name`, `color`, and `isDeepWork` via v-model.
- [ ] **TaskDateTimePicker**: Verify date and time pickers correctly bind to `taskDate` and `startTime`.
