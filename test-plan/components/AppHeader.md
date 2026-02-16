# AppHeader Component Test Plan

## Description

`AppHeader.vue` is the top navigation bar containing the logo, view switcher (Day/Week/Month), user profile, and global action buttons (Create Task, Theme, Settings, Logout).

## Unit Tests

### View Switcher

- [ ] **Active Highlight**: Verify `.active` class on the correct button based on `currentView` computed.
- [ ] **Route Mapping**: Verify `viewMap` maps `'home'` → `'day'`, `'day'` → `'day'`, `'week'` → `'week'`, `'month'` → `'month'`.
- [ ] **Navigation Links**: Verify Day → `{ name: 'day' }`, Week → `{ name: 'week' }`, Month → `{ name: 'month' }`.

### Logo

- [ ] **Link**: Verify logo links to `/` (home).
- [ ] **Brand Name**: Verify "Tusk" text with gradient clip styling.
- [ ] **Hover**: Verify opacity: 0.8 on hover.

### User Profile

- [ ] **Avatar Image**: Verify `<img>` shown when `user.photoURL` exists.
- [ ] **Avatar Placeholder**: Verify initial letter fallback (`displayName` → `email` → `'U'`).
- [ ] **User Guard**: Verify entire `.header-right` is hidden when `user` is null (not logged in).

### Action Buttons

- [ ] **Create Task**: Verify click calls `uiStore.triggerCreateTask()`.
- [ ] **Theme Toggle**: Verify click calls `uiStore.toggleThemePanel`.
- [ ] **Theme Active**: Verify `.active` class when `uiStore.isThemePanelOpen` is true.
- [ ] **Settings Link**: Verify `router-link` to `{ name: 'settings' }`.
- [ ] **Logout Link**: Verify `router-link` to `{ name: 'signout' }`.
- [ ] **Logout Hover**: Verify red background and color on hover.

### Layout

- [ ] **Three Sections**: Verify `.header-left`, `.header-center`, `.header-right` each have `flex: 1`.
- [ ] **Backdrop Blur**: Verify `backdrop-filter: blur(10px)` on header.

## Integration

- [ ] **Auth State**: Verify right section visibility tied to `userStore.user`.
- [ ] **UI Store**: Verify theme panel and create task triggers interact correctly.
