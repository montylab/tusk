# AppLogo Component Test Plan

## Description

Pure SVG logo component with arc path and accent-colored circles.

## Unit Tests

- [ ] **SVG Render**: Verify `<svg>` with viewBox `0 0 32 32`.
- [ ] **Path Stroke**: Verify arc path with `stroke="currentColor"`, width=3, round linecap.
- [ ] **Accent Circles**: Verify two circles using `--logo-accent` fallback chain.
- [ ] **Color Inheritance**: Verify `.app-logo` color from `--text-header`.
