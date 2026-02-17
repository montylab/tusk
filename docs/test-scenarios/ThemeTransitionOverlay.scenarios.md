# Test Scenarios: ThemeTransitionOverlay

## Happy Path

1. [ ] **Initially hidden**
   - Inputs: Mount component
   - Expected: .theme-transition-overlay not rendered (v-if=false)

2. [ ] **Shows overlay when transition starts**
   - Inputs: store.themeTransitionState.isActive = true, targetTheme='dark'
   - Expected: .theme-transition-overlay rendered

3. [ ] **Expands circle after nextTick**
   - Inputs: Wait for watch callback
   - Expected: .transition-circle has class 'is-active'

4. [ ] **Updates theme in store**
   - Inputs: Wait for expansion timeout (100ms)
   - Expected: appearanceStore.theme updated to targetTheme

## Edge Cases

1. [ ] **Ignores if no targetTheme**
   - Inputs: isActive=true, targetTheme=null
   - Expected: Overlay remains hidden

2. [ ] **Cleans up state after animation**
   - Inputs: Wait full sequence (100+100+600 ms)
   - Expected: isExpanded=false, overlayVisible=false, store.isActive=false
