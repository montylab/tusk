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

const logout = () => {
  router.push({ name: 'signout' })
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <router-link to="/"
                   class="logo-container">
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
      </router-link>
    </div>

    <div class="header-center">
      <div class="view-switcher">
        <router-link :to="{ name: 'day' }"
                     :class="['view-btn', { active: currentView === 'day' }]">
          Day
        </router-link>
        <router-link :to="{ name: 'week' }"
                     :class="['view-btn', { active: currentView === 'week' }]">
          Week
        </router-link>
        <router-link :to="{ name: 'month' }"
                     :class="['view-btn', { active: currentView === 'month' }]">
          Month
        </router-link>
      </div>
    </div>

    <div class="header-right"
         v-if="user">
      <router-link :to="{ name: 'settings' }"
                   class="icon-btn"
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
      </router-link>

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
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
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
  /* Spacing inside sub-component */
  cursor: pointer;
  transition: opacity 0.2s;
  text-decoration: none;
}

.logo-container:hover {
  opacity: 0.8;
}

.logo-svg {
  width: 2rem;
  height: 2rem;
  color: white;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
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
  /* Layout gap */
}

.view-switcher {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
  border-radius: 8px;
}

.view-btn {
  padding: 0.5rem 1.25rem;
  /* Internal spacing */
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.25rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
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
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.icon-btn svg {
  width: 1rem;
  height: 1rem;
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
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: 2px solid var(--primary-color);
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: 2px solid var(--primary-color);
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  font-size: 1rem;
}
</style>
