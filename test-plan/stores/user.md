# User Store Test Plan

## Description

Pinia store managing Firebase authentication state. Supports Google, email sign-up, email sign-in, and logout.

## Unit Tests

### Auth State

- [ ] **`initAuth`**: Verify `onAuthStateChanged` callback sets `user` and clears `loading`.
- [ ] **Logged In**: Verify `user` ref contains Firebase `User` object.
- [ ] **Logged Out**: Verify `user` is null.
- [ ] **`isAuthenticated`**: Verify returns `!!user.value`.

### Actions

- [ ] **`loginWithGoogle`**: Verify `signInWithPopup` with `GoogleAuthProvider`.
- [ ] **`signUpWithEmail`**: Verify `createUserWithEmailAndPassword(auth, email, pass)`.
- [ ] **`signInWithEmail`**: Verify `signInWithEmailAndPassword(auth, email, pass)`.
- [ ] **`logout`**: Verify `signOut(auth)`.

### Error Handling

- [ ] **Login Failure**: Verify error logged and rethrown.
- [ ] **SignUp Failure**: Verify error logged and rethrown.
- [ ] **SignIn Failure**: Verify error logged and rethrown.
- [ ] **Logout Failure**: Verify error logged (not rethrown).
