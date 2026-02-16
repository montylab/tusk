# SettingsPage Test Plan

## Description

Full settings page with sections for Calendar, Appearance, Notifications, Sounds, and Categories.

## Unit Tests

### Calendar Settings

- [ ] **Default Start Hour**: Verify input bound to `settings.defaultStartHour`, updates via `updateStartHour`.

### Appearance Settings

- [ ] **Theme Select**: Verify `updateTheme` sets `appearanceStore.theme`.
- [ ] **Scale Select**: Verify `updateInterfaceScale` sets `appearanceStore.interfaceScale`.

### Notification Settings

- [ ] **Global Toggle**: Verify `updateNotificationSetting('enabled', val)` deep-merges.
- [ ] **Task Started**: Verify individual toggle persisted.
- [ ] **Task Ended**: Verify individual toggle persisted.

### Sound Settings

- [ ] **Global Toggle**: Verify `updateSoundSetting('enabled', val)` deep-merges.
- [ ] **Task Started/Ended/Deleted**: Verify individual toggles.

### Categories

- [ ] **Render**: Verify `CategoriesManager` component rendered.
