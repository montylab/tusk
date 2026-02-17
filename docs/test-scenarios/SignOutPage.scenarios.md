# Test Scenarios: SignOutPage

## Happy Path

1. [ ] Renders "Signing out..." message with loader
   - Inputs: Mount component
   - Expected Output: Text "Signing out..." visible, loader element present.

2. [ ] Calls logout and redirects to signin on mount
   - Inputs: Mount component
   - Expected Output: `userStore.logout()` called, then `router.push({ name: 'signin' })`.

## Edge Cases

1. [ ] Handles logout failure gracefully
   - Inputs: `userStore.logout()` throws
   - Expected Output: Component doesn't crash (logout has internal catch).
