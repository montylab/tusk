<script setup lang="ts">
import CategoriesManager from '../components/CategoriesManager.vue'
import { useSettingsStore } from '../stores/settings'
import { useAppearanceStore, type ThemeType } from '../stores/appearance'
import { useUIStore } from '../stores/ui'
import { storeToRefs } from 'pinia'

const settingsStore = useSettingsStore()
const appearanceStore = useAppearanceStore()
const uiStore = useUIStore()
const { settings } = storeToRefs(settingsStore)
const { theme, interfaceScale } = storeToRefs(appearanceStore)

const updateStartHour = (event: Event) => {
	const val = parseFloat((event.target as HTMLInputElement).value)
	if (!isNaN(val) && val >= 0 && val <= 23) {
		settingsStore.updateSettings({ defaultStartHour: val })
	}
}

const updateTheme = (event: Event) => {
	const val = (event.target as HTMLSelectElement).value as ThemeType
	const mouseEvent = event as MouseEvent
	uiStore.startThemeTransition(mouseEvent.clientX || window.innerWidth / 2, mouseEvent.clientY || window.innerHeight / 2, val)
}

// const updateColorScheme = (event: Event) => {
// 	const val = (event.target as HTMLSelectElement).value as ColorSchemeType
// 	// For select elements, clientX might be 0, so we use center as fallback or we could try to find element position
// 	const rect = (event.target as HTMLElement).getBoundingClientRect()
// 	uiStore.startThemeTransition(rect.left + rect.width / 2, rect.top + rect.height / 2, val)
// }

const updateInterfaceScale = (event: Event) => {
	const val = parseInt((event.target as HTMLSelectElement).value)
	appearanceStore.interfaceScale = val
}
</script>

<template>
	<div class="settings-page">
		<div class="settings-content-wrapper">
			<header class="page-header">
				<h1>Settings</h1>
				<p>Manage your application preferences and data</p>
			</header>

			<div class="settings-container">
				<section class="settings-section">
					<h2>Calendar Settings</h2>
					<div class="setting-item">
						<div class="setting-info">
							<label for="start-hour">Default Day Start Hour</label>
							<p class="setting-desc">The calendar will automatically scroll to this hour when loaded</p>
						</div>
						<input
							id="start-hour"
							type="number"
							:value="settings.defaultStartHour ?? 0"
							@change="updateStartHour"
							min="0"
							max="23"
							step="1"
							class="setting-input"
						/>
					</div>
				</section>

				<section class="settings-section">
					<h2>Appearance & Interface</h2>

					<div class="setting-item">
						<div class="setting-info">
							<label for="theme">Application Theme</label>
							<p class="setting-desc">Switch between light and dark modes</p>
						</div>
						<select id="theme" :value="theme ?? 'dark'" @change="updateTheme" class="setting-input select">
							<option value="light">Light</option>
							<option value="dark">Dark</option>
						</select>
					</div>

					<!-- <div class="setting-item">
						<div class="setting-info">
							<label for="color-scheme">Color Scheme</label>
							<p class="setting-desc">Choose your preferred accent colors</p>
						</div>
						<select id="color-scheme" :value="colorScheme ?? 'brisky'" @change="updateColorScheme" class="setting-input select">
							<option value="pastel">Pastel</option>
							<option value="brisky">Brisky</option>
							<option value="royal">Royal</option>
						</select>
					</div> -->

					<div class="setting-item">
						<div class="setting-info">
							<label for="interface-scale">Interface Scale</label>
							<p class="setting-desc">Adjust the size of the user interface</p>
						</div>
						<select id="interface-scale" :value="interfaceScale ?? 100" @change="updateInterfaceScale" class="setting-input select">
							<option :value="50">50%</option>
							<option :value="75">75%</option>
							<option :value="100">100%</option>
							<option :value="150">150%</option>
						</select>
					</div>
				</section>

				<section class="settings-section">
					<CategoriesManager />
				</section>

				<!-- Future settings sections can go here -->
			</div>
		</div>
	</div>
</template>

<style scoped>
.settings-page {
	width: 100%;
	height: 100%;
	overflow-y: auto;
	color: var(--text-primary);
}

.settings-content-wrapper {
	max-width: 1000px;
	margin: 0 auto;
	padding: 3rem 2rem;
}

.page-header {
	margin-bottom: 3rem;
	border-bottom: 1px solid var(--border-color);
	padding-bottom: 2rem;
}

.page-header h1 {
	font-size: 2.5rem;
	font-weight: 800;
	margin-bottom: var(--spacing-sm);
	background: var(--accent-gradient);
	-webkit-background-clip: text;
	background-clip: text;
	-webkit-text-fill-color: transparent;
}

.page-header p {
	color: var(--text-muted);
	font-size: 1.1rem;
}

.settings-container {
	display: flex;
	flex-direction: column;
	gap: 4rem;
}

.settings-section {
	animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(20px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.settings-section h2 {
	font-size: var(--font-lg);
	margin-bottom: var(--spacing-md);
	color: var(--text-primary);
	border-left: 4px solid var(--accent);
	padding-left: var(--spacing-md);
}

.setting-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--spacing-md);
	margin: var(--spacing-md) 0;
	background-color: var(--bg-card);
	border-radius: var(--radius-md);
	border: 1px solid var(--border-color);
	transition: border-color 0.2s;
}

.setting-item:hover {
	border-color: var(--accent);
}

.setting-info {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.setting-info label {
	font-weight: 500;
	font-size: 1.1rem;
}

.setting-desc {
	color: var(--text-muted);
	font-size: 0.9rem;
	margin: 0;
}

.setting-input {
	width: 100px;
	font-size: var(--font-base);
	text-align: center;
}

.setting-input:focus {
	outline: none;
	border-color: var(--accent);
	box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent), transparent 80%);
}

.setting-input.select {
	width: auto;
	min-width: 140px;
	text-align: left;
}
</style>
