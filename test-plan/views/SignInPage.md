# Auth Views Test Plan (SignInPage / SignOutPage)

## Description

`SignInPage.vue` provides sign-in/sign-up forms with email and Google authentication. `SignOutPage.vue` triggers logout on mount.

## Unit Tests

### SignInPage

- [ ] **Mode Toggle**: Verify `isSignUp` toggles between sign-in and sign-up labels.
- [ ] **Email Validation**: Verify error when email or password empty.
- [ ] **Email Sign In**: Verify `userStore.signInWithEmail(email, password)`.
- [ ] **Email Sign Up**: Verify `userStore.signUpWithEmail(email, password)`.
- [ ] **Google Login**: Verify `userStore.loginWithGoogle()`.
- [ ] **Redirect on Success**: Verify `router.push('/')` after user set.
- [ ] **Error Display**: Verify `errorMsg` shown from catch.
- [ ] **Loading State**: Verify button disabled and spinner shown.
- [ ] **Already Logged In**: Verify redirect on mount when `userStore.user` exists.

### SignOutPage

- [ ] **Logout on Mount**: Verify `userStore.logout()` called.
- [ ] **Redirect**: Verify `router.push('/signin')` after logout.
