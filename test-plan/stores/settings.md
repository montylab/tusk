# Settings Store Test Plan

## Description

Pinia store for user-scoped settings (snap minutes, default start hour, category colors, notification/sound toggles). Syncs to Firebase.

## Unit Tests

### Defaults

- [ ] **DEFAULT_SETTINGS**: Verify snapMinutes=15, defaultStartHour=9, categoryColors=tailwindColors, notifications/sounds all enabled.

### Computed

- [ ] **`settings`**: Verify merges `DEFAULT_SETTINGS` with `settingsData` (user overrides win).

### Sync

- [ ] **User Login**: Verify `setupSync` subscribes to Firebase settings.
- [ ] **User Logout**: Verify settings reset to defaults and unsubscribed.
- [ ] **Snapshot Merge**: Verify `settingsData` merged with defaults.

### Actions

- [ ] **`updateSettings`**: Verify `firebaseService.updateSettings(updates)`.
- [ ] **`getRandomCategoryColor`**: Verify returns random item from `settings.categoryColors`.

### Color Palettes

- [ ] **`defaultColors`**: Verify 9 hex colors.
- [ ] **`tailwindColors`**: Verify 12 hex colors.
- [ ] **`radixColors`**: Verify 12 hex colors.
- [ ] **`ibmCarbonColors`**: Verify 12 hex colors.
