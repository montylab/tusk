<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useDragOperator } from '../composables/useDragOperator'
import AppIcon from './common/AppIcon.vue'

const { currentZone, registerZone, unregisterZone, updateZoneBounds } = useDragOperator()

const basketRef = ref<HTMLElement | null>(null)

// Reactive active state based on current zone
const isActive = computed(() => currentZone.value === 'trash')

const updateBounds = () => {
	if (basketRef.value) {
		updateZoneBounds('trash', basketRef.value.getBoundingClientRect())
	}
}

onMounted(() => {
	if (basketRef.value) {
		// Register zone
		registerZone('trash', basketRef.value.getBoundingClientRect())

		// Listen for resize events
		window.addEventListener('resize', updateBounds)

		const resizeObserver = new ResizeObserver(() => updateBounds())
		resizeObserver.observe(basketRef.value)
		;(basketRef.value as any).__resizeObserver = resizeObserver
	}
})

onUnmounted(() => {
	unregisterZone('trash')
	window.removeEventListener('resize', updateBounds)
	if (basketRef.value && (basketRef.value as any).__resizeObserver) {
		;(basketRef.value as any).__resizeObserver.disconnect()
	}
})
</script>

<template>
	<div ref="basketRef" class="trash-basket" :class="{ active: isActive }">
		<div class="icon-container">
			<AppIcon name="trash" size="1.75rem" />
		</div>
		<span class="label">Delete</span>
	</div>
</template>

<style scoped>
.trash-basket {
	width: 100%;
	height: 100%;
	position: relative;
	z-index: 999;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--color-basket-accent), transparent 80%) 0%,
			color-mix(in srgb, var(--color-basket-accent), transparent 90%) 60%,
			transparent 100%
		)
		no-repeat;
	transition: all 0.3s ease;
	color: var(--color-basket-accent);
	gap: var(--spacing-sm);
}

.trash-basket.active {
	background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--color-basket-accent), transparent 20%) 0%,
			color-mix(in srgb, var(--color-basket-accent), transparent 50%) 60%,
			transparent 100%
		)
		no-repeat;
	border: none;
	transform: scale(1.1);
	transform-origin: center center;
	color: #fff;
}

.icon-container {
	padding: var(--spacing-sm);
	border-radius: var(--radius-full);
	background: color-mix(in srgb, var(--color-basket-accent), transparent 90%);
	transition: transform 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.active .icon-container {
	transform: scale(1.2) rotate(5deg);
	background: rgba(255, 255, 255, 0.2);
}

.label {
	font-size: var(--font-xs);
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	opacity: 0.7;
}

.active .label {
	opacity: 1;
}
</style>
