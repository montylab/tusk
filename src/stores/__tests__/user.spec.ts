import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../user'
import { auth } from '../../firebase'
import { onAuthStateChanged, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'

// ── Mocks ──────────────────────────────────────────────────────────
vi.mock('../../firebase', () => ({
	auth: {}
}))

vi.mock('firebase/auth', () => ({
	getAuth: vi.fn(),
	GoogleAuthProvider: vi.fn(),
	onAuthStateChanged: vi.fn(),
	signInWithPopup: vi.fn(),
	createUserWithEmailAndPassword: vi.fn(),
	signInWithEmailAndPassword: vi.fn(),
	signOut: vi.fn()
}))

describe('user.ts', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
		vi.clearAllMocks()
	})

	it('initializes and listens to auth state', () => {
		useUserStore()
		expect(onAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function))
	})

	it('updates user on auth state change', () => {
		const store = useUserStore()
		const mockUser = { uid: '123' }

		// Simulate callback
		const callback = vi.mocked(onAuthStateChanged).mock.calls[0][1]
		callback(mockUser as any)

		expect(store.user).toEqual(mockUser)
		expect(store.loading).toBe(false)
		expect(store.isAuthenticated()).toBe(true)
	})

	it('handles Google Login', async () => {
		const store = useUserStore()
		await store.loginWithGoogle()
		expect(signInWithPopup).toHaveBeenCalled()
	})

	it('handles Email Sign Up', async () => {
		const store = useUserStore()
		await store.signUpWithEmail('a@b.com', 'pass')
		expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'a@b.com', 'pass')
	})

	it('handles Email Sign In', async () => {
		const store = useUserStore()
		await store.signInWithEmail('a@b.com', 'pass')
		expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'a@b.com', 'pass')
	})

	it('handles Logout', async () => {
		const store = useUserStore()
		await store.logout()
		expect(signOut).toHaveBeenCalledWith(auth)
	})
})
