<script
  setup
  lang="ts"
>
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useUserStore } from './stores/user'
import { useSettingsStore } from './stores/settings'
import AppHeader from './components/AppHeader.vue'
import DragOperator from './components/DragOperator.vue'

const userStore = useUserStore()
const { user, loading: authLoading } = storeToRefs(userStore)

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

// Apply settings to document
watch(settings, (newSettings) => {
  if (newSettings.theme) {
    document.documentElement.setAttribute('data-theme', newSettings.theme)
  } else {
    document.documentElement.setAttribute('data-theme', 'dark')
  }

  if (newSettings.colorScheme) {
    document.documentElement.setAttribute('data-scheme', newSettings.colorScheme)
  } else {
    document.documentElement.setAttribute('data-scheme', 'brisky')
  }

  if (newSettings.interfaceScale) {
    document.documentElement.setAttribute('data-scale', newSettings.interfaceScale.toString())
    document.documentElement.style.fontSize = `${newSettings.interfaceScale}%`
  } else {
    document.documentElement.setAttribute('data-scale', '100')
    document.documentElement.style.fontSize = '100%'
  }
}, { deep: true, immediate: true })
</script>

<template>
  <div class="app-layout">
    <div v-if="authLoading"
         class="loading-overlay">
      <div class="loader"></div>
      <p>Checking authentication...</p>
    </div>

    <template v-else>
      <AppHeader v-if="user" />
      <main class="app-main">
        <router-view />
      </main>
      <DragOperator />
    </template>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: var(--bg-dark);
  overflow: hidden;
}

.app-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.loading-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.loader {
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 3px solid var(--primary-color);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
