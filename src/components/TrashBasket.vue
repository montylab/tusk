<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useDragOperator } from '../composables/useDragOperator'
import trashSrc from '../assets/icons/trash.svg'

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
			<img :src="trashSrc" class="trash-icon" alt="Delete" />
		</div>
		<span class="label">Delete</span>
	</div>
</template>

<style scoped>
.trash-basket {
	width: calc(5vw * var(--ui-scale, 1));
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: rgba(255, 67, 67, 0.05);
	border-right: 1px solid rgba(255, 67, 67, 0.2);
	transition: all 0.3s ease;
	color: #ff4343;
	gap: 0.5rem;
}

.trash-basket.active {
	background: rgba(255, 67, 67, 0.5);
	transform: scale(1.5);
	transform-origin: left center;
	box-shadow: 0.625rem 0 1.25rem rgba(255, 67, 67, 0.1);
}

.icon-container {
	padding: 0.75rem;
	border-radius: 50%;
	background: rgba(255, 67, 67, 0.1);
	transition: transform 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.active .icon-container {
	transform: scale(1.2) rotate(5deg);
}

.label {
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	opacity: 0.7;
}

.active .label {
	opacity: 1;
}

.trash-icon {
	width: 1.75rem;
	height: 1.75rem;
}
</style>
