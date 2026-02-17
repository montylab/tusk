# Test Scenarios: SettingsPage

## Happy Path

1. [ ] Renders all settings sections
   - Inputs: Mount component
   - Expected Output: Sections for "Calendar Settings", "Appearance & Interface", "Notifications & Sounds" are visible.

2. [ ] Updates Default Start Hour
   - Inputs: Change start hour input to "9"
   - Expected Output: `settingsStore.updateSettings` is called with `{ defaultStartHour: 9 }`.

3. [ ] Updates Application Theme
   - Inputs: Select "Light" from theme dropdown
   - Expected Output: `uiStore.startThemeTransition` is called with "light".

4. [ ] Updates Interface Scale
   - Inputs: Select "150%" from interface scale dropdown
   - Expected Output: `appearanceStore.interfaceScale` is updated to `150`.

5. [ ] Toggles Global Notifications
   - Inputs: Click "Global Notifications" checkbox (enable)
   - Expected Output: `settingsStore.updateSettings` is called with `{ notifications: { ...prev, enabled: true } }`. Granular options appear.

6. [ ] Toggles Granular Notification (Task Started)
   - Inputs: Global notifications enabled, Click "Task Started" checkbox
   - Expected Output: `settingsStore.updateSettings` is called with `{ notifications: { ...prev, taskStarted: true } }`.

7. [ ] Toggles Global Sounds
   - Inputs: Click "Global Sounds" checkbox (enable)
   - Expected Output: `settingsStore.updateSettings` is called with `{ sounds: { ...prev, enabled: true } }`. Granular options appear.

8. [ ] Toggles Granular Sound (Task Deleted)
   - Inputs: Global sounds enabled, Click "Task Deleted" checkbox
   - Expected Output: `settingsStore.updateSettings` is called with `{ sounds: { ...prev, taskDeleted: true } }`.

## Edge Cases

1. [ ] Invalid Start Hour (Negative)
   - Inputs: Change start hour input to "-1"
   - Expected Output: `settingsStore.updateSettings` is NOT called.

2. [ ] Invalid Start Hour (Over 23)
   - Inputs: Change start hour input to "24"
   - Expected Output: `settingsStore.updateSettings` is NOT called.

3. [ ] Granular Settings Hidden when Disabled
   - Inputs: Global notifications/sounds disabled
   - Expected Output: Granular checkboxes are not rendered.

## UI/Interaction

1. [ ] Categories Manager Rendered
   - Inputs: Mount component
   - Expected Output: `<CategoriesManager />` component is present.
