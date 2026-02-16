# InterfaceManager Component Test Plan

## Description

`InterfaceManager.vue` is a headless component that syncs appearance store values to the document root element via `data-*` attributes and CSS custom properties.

## Unit Tests

### Attribute Sync

- [ ] **Theme**: Verify `document.documentElement.setAttribute('data-theme', theme)`.
- [ ] **Color Scheme**: Verify `data-scheme` attribute set.
- [ ] **Interface Scale**: Verify `data-scale` attribute set.

### CSS Variable Sync

- [ ] **UI Scale**: Verify `--ui-scale` CSS property set.
- [ ] **Hour Height**: Verify `--hour-height` CSS property set with `px` suffix.
- [ ] **Header Height**: Verify `--header-height` CSS property set with `px` suffix.

### Reactivity

- [ ] **Immediate Watch**: Verify values applied on mount.
- [ ] **Property Change**: Verify attributes/properties update when store values change.

### Template

- [ ] **Headless**: Verify component renders no visible DOM.
