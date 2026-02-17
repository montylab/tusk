# Test Scenarios: user (Store)

## Happy Path

1. [ ] **Initializes and listens to auth state**
   - Inputs: Mount store
   - Expected: onAuthStateChanged called, loading=true initially

2. [ ] **Updates user on auth state change**
   - Inputs: Trigger onAuthStateChanged callback with user object
   - Expected: user state updates, loading=false

3. [ ] **Handles Google Login**
   - Inputs: loginWithGoogle()
   - Expected: signInWithPopup called with auth and provider

4. [ ] **Handles Email Scroll**
   - Inputs: signUpWithEmail('test@test.com', 'pass')
   - Expected: createUserWithEmailAndPassword called

5. [ ] **Handles Email Sign In**
   - Inputs: signInWithEmail('test@test.com', 'pass')
   - Expected: signInWithEmailAndPassword called

6. [ ] **Handles Logout**
   - Inputs: logout()
   - Expected: signOut called

## Edge Cases

1. [ ] **Handles Login Error**
   - Inputs: signInWithPopup throws
   - Expected: Error logged/thrown

2. [ ] **isAuthenticated returns correct boolean**
   - Inputs: user=null vs user=Object
   - Expected: false vs true
