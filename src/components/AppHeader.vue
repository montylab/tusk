<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useUIStore } from '../stores/ui'
import { storeToRefs } from 'pinia'
import AppLogo from './common/AppLogo.vue'
import AppIcon from './common/AppIcon.vue'

const route = useRoute()
const userStore = useUserStore()
const uiStore = useUIStore()
const { user } = storeToRefs(userStore)

const viewMap: Record<string, string> = {
	day: 'day',
	home: 'day',
	week: 'week',
	month: 'month'
}

const currentView = computed(() => viewMap[route.name as string] || null)
</script>

<template>
	<header class="app-header">
		<div class="header-left">
			<router-link to="/" class="logo-container">
				<div class="logo-svg">
					<AppLogo />
				</div>
				<span class="brand-name">Tusk</span>
			</router-link>
		</div>

		<div class="header-center">
			<div class="view-switcher">
				<router-link :to="{ name: 'day' }" :class="['view-btn', { active: currentView === 'day' }]">Day</router-link>
				<router-link :to="{ name: 'week' }" :class="['view-btn', { active: currentView === 'week' }]">Week</router-link>
				<router-link :to="{ name: 'month' }" :class="['view-btn', { active: currentView === 'month' }]">Month</router-link>
			</div>
		</div>

		<div class="header-right" v-if="user">
			<button class="create-task-btn" @click="uiStore.triggerCreateTask()">
				<i class="pi pi-plus"></i>
				<span>Create Task</span>
			</button>

			<button
				class="icon-btn theme-btn-toggle"
				:class="{ active: uiStore.isThemePanelOpen }"
				@click="uiStore.toggleThemePanel"
				title="Theme"
			>
				<AppIcon name="theme" size="1rem" />
			</button>

			<router-link :to="{ name: 'stats' }" class="icon-btn" title="Statistics">
				<AppIcon name="stats" size="1rem" />
			</router-link>

			<router-link :to="{ name: 'settings' }" class="icon-btn" title="Settings">
				<AppIcon name="settings" size="1rem" />
			</router-link>

			<router-link :to="{ name: 'signout' }" class="icon-btn logout-btn" title="Logout">
				<AppIcon name="logout" size="1rem" />
			</router-link>

			<img v-if="user.photoURL" :src="user.photoURL" class="user-avatar" :alt="user.displayName || 'User'" />
			<div v-else class="user-avatar-placeholder">
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
	padding: var(--spacing-sm) var(--spacing-lg);
	background: var(--bg-header);
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
	gap: var(--spacing-sm);
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
	color: var(--text-header);
}

.brand-name {
	font-size: var(--font-xl);
	line-height: 1;
	font-weight: 800;
	letter-spacing: -0.02em;
	background: var(--text-header);
	-webkit-background-clip: text;
	background-clip: text;
	-webkit-text-fill-color: transparent;
}

.header-center {
	justify-content: center;
}

.header-right {
	justify-content: flex-end;
	gap: var(--spacing-sm);
	/* Layout gap */
}

.view-switcher {
	display: flex;
	gap: 0.5rem;
	padding: 0.25rem;
	border-radius: 8px;
}

.view-btn {
	padding: var(--spacing-sm) var(--spacing-lg);
	/* Internal spacing */
	background: transparent;
	border: none;
	color: var(--text-header);
	opacity: 0.7;
	font-size: var(--font-base);
	line-height: 1.25rem;
	font-weight: 500;
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: all 0.2s;
	text-decoration: none;
}

.view-btn:hover {
	opacity: 1;
	background: var(--surface-hover);
}

.view-btn.active {
	opacity: 1;
	background: var(--surface-hover);
	color: var(--accent);
}

.create-task-btn {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background: var(--accent-gradient);
	color: var(--text-on-accent);
	border: none;
	border-radius: var(--radius-md);
	font-size: var(--font-sm);
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	margin-right: var(--spacing-sm);
}

.create-task-btn:hover {
	filter: brightness(1.1);
	transform: translateY(-1px);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.create-task-btn i {
	font-size: 0.8rem;
}

.icon-btn {
	width: 2.25rem;
	height: 2.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--surface-hover);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-md);
	color: var(--text-header);
	cursor: pointer;
	transition: all 0.2s;
	text-decoration: none;
}

.icon-btn:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: var(--accent);
}

.icon-btn.active {
	background: var(--accent);
	border-color: var(--accent);
	color: white;
}

.theme-btn-toggle i {
	font-size: 0.9rem;
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
	color: var(--text-on-accent);
	font-size: 1rem;
}
</style>
