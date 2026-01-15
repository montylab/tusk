import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
	onAuthStateChanged,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	type User
} from 'firebase/auth'
import { auth } from '../firebase'

export const useUserStore = defineStore('user', () => {
	const user = ref<User | null>(null)
	const loading = ref(true)

	// Initialize auth listener immediately
	const initAuth = () => {
		onAuthStateChanged(auth, (firebaseUser) => {
			user.value = firebaseUser
			loading.value = false
		})
	}

	initAuth()

	async function loginWithGoogle() {
		const provider = new GoogleAuthProvider()
		try {
			await signInWithPopup(auth, provider)
		} catch (error) {
			console.error('Login with Google failed:', error)
			throw error
		}
	}

	async function signUpWithEmail(email: string, pass: string) {
		try {
			await createUserWithEmailAndPassword(auth, email, pass)
		} catch (error) {
			console.error('Signup with Email failed:', error)
			throw error
		}
	}

	async function signInWithEmail(email: string, pass: string) {
		try {
			await signInWithEmailAndPassword(auth, email, pass)
		} catch (error) {
			console.error('Signin with Email failed:', error)
			throw error
		}
	}

	async function logout() {
		try {
			await signOut(auth)
		} catch (error) {
			console.error('Logout failed:', error)
		}
	}

	return {
		user,
		loading,
		loginWithGoogle,
		signUpWithEmail,
		signInWithEmail,
		logout,
		isAuthenticated: () => !!user.value
	}
})
