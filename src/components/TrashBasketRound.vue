<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useDragOperator } from '../composables/useDragOperator'
import AppIcon from './common/AppIcon.vue'

const { currentZone, registerZone, unregisterZone, updateZoneBounds } = useDragOperator()

const basketRef = ref<HTMLElement | null>(null)

// Reactive active state based on current zone
const isOver = computed(() => currentZone.value === 'trash')

const updateBounds = () => {
	if (basketRef.value) {
		updateZoneBounds('trash', basketRef.value.getBoundingClientRect())
	}
}

onMounted(() => {
	if (basketRef.value) {
		updateBounds()
		registerZone('trash', basketRef.value.getBoundingClientRect())

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
	<div ref="basketRef" class="trash-basket-round" :class="{ 'is-over': isOver }">
		<div class="icon-wrapper">
			<AppIcon name="trash" size="3rem" color="white" />
		</div>
	</div>
</template>

<style scoped>
.trash-basket-round {
	--basket-size: 8rem;

	position: fixed;
	bottom: calc(var(--basket-size) * -0.3); /* ~30% of 8rem is 2.4rem */
	right: calc(var(--basket-size) * -0.3);
	width: var(--basket-size);
	height: var(--basket-size);
	border-radius: 50%;
	background: var(--color-basket-accent, #ef4444);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
	cursor: pointer;
}

.trash-basket-round.is-over {
	transform: scale(1.8) translate(-10%, -10%);
	background: color-mix(in srgb, var(--color-basket-accent, #ef4444), white 10%);
	box-shadow: 0 0 4rem 1rem var(--bg-page);
}

.icon-wrapper {
	/* Adjust icon position since basket is partially off-screen */
	margin-top: calc(var(--basket-size) * -0.15);
	margin-left: calc(var(--basket-size) * -0.15);
	transition: transform 0.3s ease;
}

.is-over .icon-wrapper {
	transform: scale(1.2) rotate(-15deg);
}
</style>
