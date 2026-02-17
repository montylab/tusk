# Test Scenarios: SignInPage

## Happy Path

1. [ ] Renders sign-in form by default
   - Inputs: Mount component
   - Expected Output: Email/password inputs visible, "Sign In" button shown, "Welcome back" text.

2. [ ] Toggles to Sign Up mode
   - Inputs: Click "Sign Up" toggle link
   - Expected Output: Button text changes to "Create Account", subtitle changes to "Join the community".

3. [ ] Successful email sign-in redirects to home
   - Inputs: Fill email/password, submit form
   - Expected Output: `userStore.signInWithEmail` called, `router.push('/')` called.

4. [ ] Successful email sign-up redirects to home
   - Inputs: Toggle to sign-up, fill email/password, submit form
   - Expected Output: `userStore.signUpWithEmail` called, `router.push('/')` called.

5. [ ] Google login triggers and redirects
   - Inputs: Click "Continue with Google" button
   - Expected Output: `userStore.loginWithGoogle` called, `router.push('/')` called on success.

## Edge Cases

1. [ ] Shows error when fields are empty
   - Inputs: Submit form with empty email/password
   - Expected Output: Error message "Please fill in all fields" displayed.

2. [ ] Shows error on failed email auth
   - Inputs: Submit form, `signInWithEmail` throws error
   - Expected Output: Error message from exception displayed.

3. [ ] Shows error on failed Google login
   - Inputs: Click Google button, `loginWithGoogle` throws error
   - Expected Output: Error message from exception displayed.

4. [ ] Disables buttons during loading
   - Inputs: Submit form (while async in progress)
   - Expected Output: Submit and Google buttons are disabled, spinner shown.

5. [ ] Clears error message on mode toggle
   - Inputs: Trigger error, then toggle sign-in/sign-up
   - Expected Output: Error message cleared.

6. [ ] Redirects to home if already logged in (onMounted)
   - Inputs: Mount with `userStore.user` set
   - Expected Output: `router.push('/')` called immediately.
