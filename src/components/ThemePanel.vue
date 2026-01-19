<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppearanceStore, type ThemeType, THEMES, SCALES } from '../stores/appearance'
import { useUIStore } from '../stores/ui'

const appearanceStore = useAppearanceStore()
const uiStore = useUIStore()
const { theme, interfaceScale } = storeToRefs(appearanceStore)
const { isThemePanelOpen } = storeToRefs(uiStore)

const toggleTheme = (t: ThemeType) => {
	appearanceStore.theme = t
}
const setScale = (s: number) => {
	appearanceStore.interfaceScale = s
}
</script>

<template>
	<Transition name="slide-fade">
		<div class="theme-panel" v-if="isThemePanelOpen">
			<div class="panel-header">
				<h3 class="panel-title">Appearance</h3>
				<button class="close-btn" @click="uiStore.closeThemePanel">
					<i class="pi pi-times"></i>
				</button>
			</div>

			<div class="switcher-group">
				<span class="switcher-label">Base Theme</span>
				<div class="switcher-row">
					<button v-for="t in THEMES" :key="t" class="theme-btn" :class="{ active: theme === t }" @click="toggleTheme(t)" :title="t">
						{{ t[0].toUpperCase() }}
					</button>
				</div>
			</div>

			<div class="switcher-group">
				<span class="switcher-label">Interface Scale</span>
				<div class="switcher-row">
					<button
						v-for="s in SCALES"
						:key="s"
						class="theme-btn scale-btn"
						:class="{ active: interfaceScale === s }"
						@click="setScale(s)"
						:title="`${s}%`"
					>
						{{ s }}
					</button>
				</div>
			</div>
		</div>
	</Transition>
</template>

<style scoped>
.theme-panel {
	position: fixed;
	top: 5rem;
	right: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: var(--spacing-lg);
	background: var(--bg-popover);
	padding: var(--spacing-lg);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-md);
	border: 1px solid var(--border-color);
	z-index: 1000;
	min-width: 200px;
	backdrop-filter: blur(10px);
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.25rem;
}

.panel-title {
	font-size: var(--font-sm);
	font-weight: 700;
	color: var(--text-primary);
}

.close-btn {
	background: transparent;
	border: none;
	color: var(--text-muted);
	cursor: pointer;
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	transition: all 0.2s;
}

.close-btn:hover {
	background: var(--surface-hover);
	color: var(--text-primary);
}

.switcher-group {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}

.switcher-label {
	font-size: var(--font-xs);
	text-transform: uppercase;
	font-weight: 800;
	color: var(--text-muted);
	letter-spacing: 0.05em;
}

.switcher-row {
	display: flex;
	gap: var(--spacing-sm);
}

.theme-btn {
	width: 2.25rem;
	height: 2.25rem;
	border-radius: var(--radius-md);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: var(--font-sm);
	font-weight: bold;
	background: var(--bg-page);
	color: var(--text-muted);
	border: 1px solid var(--border-color);
	transition: all 0.2s;
	cursor: pointer;
}

.theme-btn:hover {
	color: var(--text-primary);
	border-color: var(--accent);
	background: var(--surface-hover);
}

.theme-btn.active {
	background: var(--accent);
	color: #fff;
	border-color: var(--accent);
}

/* Animations */
.slide-fade-enter-active,
.slide-fade-leave-active {
	transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
	transform: translateY(-10px);
	opacity: 0;
}
</style>
