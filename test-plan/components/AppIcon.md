# AppIcon Component Test Plan

## Description

Renders an SVG icon via CSS mask-image technique using icon files from `/assets/icons/`.

## Props: `name: string`, `color?: string`, `size?: string`

## Unit Tests

- [ ] **Icon URL**: Verify `maskImage` points to `/assets/icons/${name}.svg`.
- [ ] **Color**: Verify `backgroundColor` uses `color` prop or `currentColor` fallback.
- [ ] **Size**: Verify `width/height` use `size` prop or `1rem` default.
- [ ] **Mask Properties**: Verify `no-repeat`, `center`, `contain` mask settings.
