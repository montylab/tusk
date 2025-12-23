<script
  setup
  lang="ts"
>
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const userStore = useUserStore()
const router = useRouter()

const handleLogin = async () => {
  await userStore.login()
  if (userStore.user) {
    router.push('/')
  }
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
      <h1>TaskTracker</h1>
      <p>Organize your day with precision</p>
      <button @click="handleLogin"
              class="login-btn">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
             alt="Google" />
        Login with Google
      </button>
    </div>
  </div>
</template>

<style scoped>
.signin-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: var(--bg-dark);
}

.login-card {
  padding: 3rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.login-card h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #fff 0%, #aaa 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-card p {
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.login-btn img {
  width: 20px;
}
</style>
