# App Orchestration Test Plan

## Description

`App.vue` is the root component. It initializes global systems (`useGlobalShortcuts`, `useNotificationSystem`, `useSoundSystem`, `useTaskMonitor`), starts the time store ticking, and renders the router view with header and interface manager.

## Unit Tests

- [ ] **Router View**: Verify `<RouterView>` rendered.
- [ ] **AppHeader**: Verify `AppHeader` component rendered.
- [ ] **InterfaceManager**: Verify headless `InterfaceManager` initialized.
- [ ] **ThemePanel**: Verify `ThemePanel` component rendered.
- [ ] **ThemeTransitionOverlay**: Verify overlay initialized.
- [ ] **Time Ticking**: Verify `timeStore.startTicking()` called on mount.
- [ ] **Global Shortcuts**: Verify `useGlobalShortcuts()` initialized.
- [ ] **Notification System**: Verify `useNotificationSystem()` initialized.
- [ ] **Sound System**: Verify `useSoundSystem()` initialized.
- [ ] **Task Monitor**: Verify `useTaskMonitor()` initialized.
- [ ] **Auth Guard**: Verify loading state while `userStore.loading` is true.
