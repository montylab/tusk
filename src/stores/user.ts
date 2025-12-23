import { defineStore } from 'pinia';
import { ref, onMounted } from 'vue';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    type User
} from 'firebase/auth';
import { auth } from '../firebase';

export const useUserStore = defineStore('user', () => {
    const user = ref<User | null>(null);
    const loading = ref(true);

    onMounted(() => {
        // Support mocking for tests
        if (import.meta.env.DEV && (window as any).__MOCK_USER__) {
            user.value = (window as any).__MOCK_USER__;
            loading.value = false;
            return;
        }

        onAuthStateChanged(auth, (firebaseUser) => {
            user.value = firebaseUser;
            loading.value = false;
        });
    });

    async function login() {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Login failed:', error);
        }
    }

    async function logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    return {
        user,
        loading,
        login,
        logout,
        isAuthenticated: () => !!user.value
    };
});
