<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

onMounted(async () => {
  await userStore.logout()
  router.push({ name: 'signin' })
})
</script>

<template>
  <div class="signout-page">
    <div class="signout-content">
      <div class="loader"></div>
      <p>Signing out...</p>
    </div>
  </div>
</template>

<style scoped>
.signout-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: var(--bg-dark);
}

.signout-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.signout-content p {
  color: var(--text-muted);
}

.loader {
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 3px solid var(--primary-color);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
