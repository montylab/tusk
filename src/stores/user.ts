import { defineStore } from 'pinia';
import { ref, onMounted } from 'vue';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    type User
} from 'firebase/auth';
import { auth } from '../firebase';

export const useUserStore = defineStore('user', () => {
    const user = ref<User | null>(null);
    const loading = ref(true);

    onMounted(() => {
        // Support mocking for tests
        if (import.meta.env.DEV) {
            if ((window as any).__MOCK_USER__) {
                user.value = (window as any).__MOCK_USER__;
                loading.value = false;
                return;
            }

            // Listen for manual mock updates
            (window as any).__UPDATE_MOCK_USER__ = (mockUser: any) => {
                user.value = mockUser;
                loading.value = false;
            };
        }

        onAuthStateChanged(auth, (firebaseUser) => {
            // Don't override mock user if set
            if (import.meta.env.DEV && (window as any).__MOCK_USER__) return;

            user.value = firebaseUser;
            loading.value = false;
        });
    });

    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Login with Google failed:', error);
            throw error;
        }
    }

    async function signUpWithEmail(email: string, pass: string) {
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error('Signup with Email failed:', error);
            throw error;
        }
    }

    async function signInWithEmail(email: string, pass: string) {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error('Signin with Email failed:', error);
            throw error;
        }
    }

    async function logout() {
        try {
            if (import.meta.env.DEV) {
                (window as any).__MOCK_USER__ = null;
            }
            await signOut(auth);
            if (import.meta.env.DEV) {
                user.value = null;
            }
        } catch (error) {
            console.error('Logout failed:', error);
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
    };
});
