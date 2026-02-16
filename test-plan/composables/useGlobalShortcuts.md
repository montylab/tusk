# useGlobalShortcuts Composable Test Plan

## Description

Registers global keyboard shortcuts for theme cycling, interface scale, and shortcut pile instantiation.

## Unit Tests

- [ ] **Input Guard**: Verify no shortcuts handled when `target` is INPUT or TEXTAREA.
- [ ] **Repeat Guard**: Verify `e.repeat` events ignored.
- [ ] **Alt+1/2/3**: Verify `appearanceStore.interfaceScale` set to 100/150/200.
- [ ] **Alt+Backtick**: Verify theme cycles through dark → light → pinky → vivid → dark.
- [ ] **Ctrl+1-9**: Verify `startDrag` called with copy of `shortcutTasks[index-1]`.
- [ ] **Task Copy**: Verify copied task gets `generateTempId()` and `isShortcut: false`.
- [ ] **Out of Range**: Verify Ctrl+9 is no-op when fewer than 9 shortcuts.
- [ ] **Lifecycle**: Verify `keydown` listener added on mount, removed on unmount.
