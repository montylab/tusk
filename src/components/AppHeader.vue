<script
  setup
  lang="ts"
>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const currentView = computed(() => {
  const name = route.name as string
  if (name === 'day' || name === 'home') return 'day'
  if (name === 'week') return 'week'
  if (name === 'month') return 'month'
  return null
})

const navigateToView = (view: 'day' | 'week' | 'month') => {
  router.push({ name: view })
}

const goToSettings = () => {
  router.push({ name: 'settings' })
}

const logout = () => {
  router.push({ name: 'signout' })
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo-container"
           @click="router.push('/')">
        <svg class="logo-svg"
             viewBox="0 0 32 32"
             fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path d="M10 24C12 24 20 22 24 8"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round" />
          <circle cx="24"
                  cy="8"
                  r="2.5"
                  fill="var(--color-urgent)" />
          <circle cx="24"
                  cy="8"
                  r="5"
                  fill="var(--color-urgent)"
                  opacity="0.3" />
        </svg>
        <span class="brand-name">Tusk</span>
      </div>
    </div>

    <div class="header-center">
      <div class="view-switcher">
        <button :class="['view-btn', { active: currentView === 'day' }]"
                @click="navigateToView('day')">
          Day
        </button>
        <button :class="['view-btn', { active: currentView === 'week' }]"
                @click="navigateToView('week')">
          Week
        </button>
        <button :class="['view-btn', { active: currentView === 'month' }]"
                @click="navigateToView('month')">
          Month
        </button>
      </div>
    </div>

    <div class="header-right"
         v-if="user">
      <button class="icon-btn"
              @click="goToSettings"
              title="Settings">
        <svg xmlns="http://www.w3.org/2000/svg"
             width="20"
             height="20"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">
          <circle cx="12"
                  cy="12"
                  r="3"></circle>
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m-2 2l-4.2 4.2M23 12h-6m-6 0H5m13.2 5.2l-4.2-4.2m-2-2l-4.2-4.2">
          </path>
        </svg>
      </button>

      <button class="icon-btn logout-btn"
              @click="logout"
              title="Logout">
        <svg xmlns="http://www.w3.org/2000/svg"
             width="20"
             height="20"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21"
                y1="12"
                x2="9"
                y2="12"></line>
        </svg>
      </button>

      <img v-if="user.photoURL"
           :src="user.photoURL"
           class="user-avatar"
           :alt="user.displayName || 'User'" />
      <div v-else
           class="user-avatar-placeholder">
        {{ (user.displayName || user.email || 'U')[0].toUpperCase() }}
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
  height: 60px;
  flex-shrink: 0;
}

.header-left,
.header-center,
.header-right {
  flex: 1;
  display: flex;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.logo-container:hover {
  opacity: 0.8;
}

.logo-svg {
  width: 32px;
  height: 32px;
  color: white;
}

.brand-name {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.6) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-center {
  justify-content: center;
}

.header-right {
  justify-content: flex-end;
  gap: 0.75rem;
}

.view-switcher {
  display: flex;
  gap: 0.5rem;
  /* background: rgba(255, 255, 255, 0.1); */
  padding: 0.25rem;
  border-radius: 8px;
  /* border: 1px solid var(--border-color); */
}

.view-btn {
  padding: 0.5rem 1.25rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  color: var(--text-light);
  background: rgba(255, 255, 255, 0.05);
}

.view-btn.active {
  background: #FFF2;
  color: white;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary-color);
}

.logout-btn:hover {
  background: rgba(255, 69, 58, 0.2);
  border-color: #ff453a;
  color: #ff453a;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--primary-color);
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--primary-color);
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  font-size: 0.9rem;
}
</style>
