<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '../stores/ui'
import { useAppearanceStore, type ThemeType } from '../stores/appearance'

const uiStore = useUIStore()
const appearanceStore = useAppearanceStore()
const { themeTransitionState } = storeToRefs(uiStore)

const overlayVisible = ref(false)
const isExpanded = ref(false)

const circleStyle = computed(() => ({
	left: `${themeTransitionState.value.x}px`,
	top: `${themeTransitionState.value.y}px`
}))

watch(
	() => themeTransitionState.value.isActive,
	async (active) => {
		const { targetTheme } = themeTransitionState.value

		if (!active || !targetTheme) {
			return
		}

		overlayVisible.value = true
		isExpanded.value = false

		// Force local browser to register scale(0) before we scale up
		await nextTick()
		await new Promise((r) => requestAnimationFrame(r))

		isExpanded.value = true

		// Phase 1: Expansion (0.25s)
		setTimeout(() => {
			appearanceStore.theme = targetTheme as ThemeType

			// Phase 2: Pause (0.1s) then Shrink
			setTimeout(() => {
				isExpanded.value = false

				// Cleanup after shrink finishes (0.6s)
				setTimeout(() => {
					overlayVisible.value = false
					uiStore.themeTransitionState.isActive = false
				}, 600)
			}, 100)
		}, 100)
	}
)
</script>

<template>
	<Teleport to="body">
		<div v-if="overlayVisible" class="theme-transition-overlay">
			<div class="transition-circle" :class="{ 'is-active': isExpanded }" :style="circleStyle"></div>
		</div>
	</Teleport>
</template>

<style scoped>
.theme-transition-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	pointer-events: none;
	z-index: 99999;
	overflow: hidden;
}

.transition-circle {
	position: fixed;
	width: 100px;
	height: 100px;
	margin: -50px 0 0 -50px;
	background: var(--accent);
	border-radius: 50%;
	transform: scale(0);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform;
	transition-duration: 0.5s;
}

.transition-circle.is-active {
	transform: scale(50); /* Covers screen regardless of click position */
	transition-duration: 0.3s;
}
</style>
