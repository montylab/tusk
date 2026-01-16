<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import AppLogo from '../components/common/AppLogo.vue'

const userStore = useUserStore()
const router = useRouter()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

const handleGoogleLogin = async () => {
	try {
		loading.value = true
		errorMsg.value = ''
		await userStore.loginWithGoogle()
		if (userStore.user) {
			router.push('/')
		}
	} catch (err: any) {
		errorMsg.value = err.message || 'Google login failed'
	} finally {
		loading.value = false
	}
}

const handleEmailAuth = async () => {
	if (!email.value || !password.value) {
		errorMsg.value = 'Please fill in all fields'
		return
	}

	try {
		loading.value = true
		errorMsg.value = ''
		if (isSignUp.value) {
			await userStore.signUpWithEmail(email.value, password.value)
		} else {
			await userStore.signInWithEmail(email.value, password.value)
		}

		if (userStore.user) {
			router.push('/')
		}
	} catch (err: any) {
		errorMsg.value = err.message || (isSignUp.value ? 'Signup failed' : 'Login failed')
	} finally {
		loading.value = false
	}
}

const toggleMode = () => {
	isSignUp.value = !isSignUp.value
	errorMsg.value = ''
}

// If already logged in, redirect to home
onMounted(() => {
	if (userStore.user) {
		router.push('/')
	}
})
</script>

<template>
	<div class="signin-page">
		<div class="login-card">
			<div class="logo-area">
				<div class="logo-svg">
					<AppLogo />
				</div>
				<h1>Tusk</h1>
				<p>{{ isSignUp ? 'Join the community' : 'Welcome back' }}</p>
			</div>

			<form @submit.prevent="handleEmailAuth" class="auth-form">
				<div class="input-group">
					<label for="email">Email</label>
					<input id="email" v-model="email" type="email" placeholder="name@example.com" required />
				</div>

				<div class="input-group">
					<label for="password">Password</label>
					<input id="password" v-model="password" type="password" placeholder="••••••••" required />
				</div>

				<p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

				<button type="submit" class="submit-btn" :disabled="loading">
					<i v-if="loading" class="pi pi-spin pi-spinner"></i>
					<span v-else>{{ isSignUp ? 'Create Account' : 'Sign In' }}</span>
				</button>
			</form>

			<div class="divider">
				<span>or</span>
			</div>

			<button @click="handleGoogleLogin" class="google-btn" :disabled="loading">
				<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
				Continue with Google
			</button>

			<div class="toggle-mode">
				{{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
				<button @click="toggleMode" class="text-link">
					{{ isSignUp ? 'Sign In' : 'Sign Up' }}
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.signin-page {
	width: 100%;
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	background: radial-gradient(circle at top right, var(--bg-card), var(--bg-page));
	padding: var(--spacing-md);
}

.login-card {
	width: 100%;
	max-width: 420px;
	padding: var(--spacing-xl);
	background: var(--bg-popover);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-lg);
	backdrop-filter: blur(20px);
	box-shadow: var(--shadow-lg);
}

.logo-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 2rem;
}

.logo-svg {
	width: 48px;
	height: 48px;
	color: var(--text-primary);
	margin-bottom: var(--spacing-sm);
}

.logo-area h1 {
	font-size: 3rem;
	margin: 0;
	font-weight: 800;
	letter-spacing: -1px;
	background: var(--accent-gradient);
	background-clip: text;
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
}

.logo-area p {
	color: var(--text-muted);
	font-size: var(--font-base);
	margin-top: var(--spacing-xs);
}

.auth-form {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.input-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	text-align: left;
}

.input-group label {
	font-size: var(--font-sm);
	font-weight: 500;
	color: var(--text-meta);
	margin-left: var(--spacing-xs);
}

.input-group input {
	padding: 0.75rem var(--spacing-md);
	background: var(--bg-input);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-md);
	color: var(--text-primary);
	font-size: var(--font-base);
	transition: all 0.2s;
}

.input-group input:focus {
	outline: none;
	border-color: var(--accent);
	background: color-mix(in srgb, var(--text-primary), transparent 93%);
	box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent), transparent 90%);
}

.error-text {
	color: #ef4444;
	font-size: 0.875rem;
	margin: 0;
}

.submit-btn {
	background: var(--accent-gradient);
	color: var(--text-on-accent);
	padding: 0.75rem;
	border: none;
	border-radius: var(--radius-md);
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
	background: #4f46e5;
	transform: translateY(-1px);
}

.submit-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.divider {
	display: flex;
	align-items: center;
	text-align: center;
	margin: 1.5rem 0;
	color: #475569;
}

.divider::before,
.divider::after {
	content: '';
	flex: 1;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.divider span {
	padding: 0 0.75rem;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 1px;
}

.google-btn {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 0.75rem;
	background: #fff;
	color: #1e293b;
	border: none;
	border-radius: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	margin-bottom: 1.5rem;
}

.google-btn:hover:not(:disabled) {
	background: #f8fafc;
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.google-btn img {
	width: 20px;
}

.toggle-mode {
	font-size: 0.875rem;
	color: #94a3b8;
}

.text-link {
	background: none;
	border: none;
	color: #6366f1;
	font-weight: 600;
	cursor: pointer;
	padding: 0;
	margin-left: 0.25rem;
}

.text-link:hover {
	text-decoration: underline;
}
</style>
