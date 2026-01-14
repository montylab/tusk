<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { storeToRefs } from 'pinia'
import logoSrc from '../assets/icons/logo.svg'
import settingsSrc from '../assets/icons/settings.svg'
import logoutSrc from '../assets/icons/logout.svg'

const route = useRoute()
const userStore = useUserStore()
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
				<img :src="logoSrc" class="logo-svg" alt="Tusk Logo" />
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
			<router-link :to="{ name: 'settings' }" class="icon-btn" title="Settings">
				<img :src="settingsSrc" class="header-icon" alt="Settings" />
			</router-link>

			<router-link :to="{ name: 'signout' }" class="icon-btn logout-btn" title="Logout">
				<img :src="logoutSrc" class="header-icon" alt="Logout" />
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
	background: #fff2;
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

.header-icon {
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
