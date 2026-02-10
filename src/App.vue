<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from './stores/user'
import AppHeader from './components/AppHeader.vue'
import DragOperator from './components/DragOperator.vue'
import InterfaceManager from './components/InterfaceManager.vue'
import ThemePanel from './components/ThemePanel.vue'
import ThemeTransitionOverlay from './components/ThemeTransitionOverlay.vue'
import DebugFAB from './debug/DebugFAB.vue'
import { useGlobalShortcuts } from './composables/useGlobalShortcuts'
import { useSoundSystem } from './composables/useSoundSystem'
import { useNotificationSystem } from './composables/useNotificationSystem'
import { useTaskMonitor } from './composables/useTaskMonitor'
import { useTimeStore } from './stores/time'

const userStore = useUserStore()
const { user, loading: authLoading } = storeToRefs(userStore)

// Initialize global shortcuts
useGlobalShortcuts()

// Initialize app internal systems
useSoundSystem()
useNotificationSystem()
useTaskMonitor()

// Initialize time system
const timeStore = useTimeStore()
timeStore.startTicking()

const isDev = import.meta.env.DEV
</script>

<template>
	<InterfaceManager />
	<ThemeTransitionOverlay />
	<ThemePanel v-if="user" />
	<DebugFAB v-if="user && isDev" />
	<div class="app-layout">
		<div v-if="authLoading" class="loading-overlay">
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
	overflow: hidden;
	position: relative;
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
	border: 3px solid var(--border-color);
	border-radius: 50%;
	border-top: 3px solid var(--accent);
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
