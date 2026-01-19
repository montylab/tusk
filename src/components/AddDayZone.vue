<script setup lang="ts">
import { ref, onUnmounted, watch, onMounted, computed } from 'vue'
import { useDragOperator } from '../composables/useDragOperator'

const props = defineProps<{
	label: string
}>()

const emit = defineEmits<{
	(e: 'add-day'): void
}>()

const { isDragging, currentZone, registerZone, unregisterZone, updateZoneBounds } = useDragOperator()

const zoneRef = ref<HTMLElement | null>(null)
const isHovered = computed(() => currentZone.value === 'add-day-zone')

const totalCountdownSeconds = 3
const speed = 1.2
const countdown = ref(totalCountdownSeconds)

let timer: any = null

const updateBounds = () => {
	if (zoneRef.value) {
		updateZoneBounds('add-day-zone', zoneRef.value.getBoundingClientRect())
	}
}

onMounted(() => {
	if (zoneRef.value) {
		// Register zone (dropping here cancels the drag)
		registerZone('add-day-zone', zoneRef.value.getBoundingClientRect())

		updateBounds()
		window.addEventListener('resize', updateBounds)

		const resizeObserver = new ResizeObserver(() => updateBounds())
		resizeObserver.observe(zoneRef.value)
		;(zoneRef.value as any).__resizeObserver = resizeObserver
	}
})

onUnmounted(() => {
	unregisterZone('add-day-zone')
	window.removeEventListener('resize', updateBounds)

	if (zoneRef.value && (zoneRef.value as any).__resizeObserver) {
		;(zoneRef.value as any).__resizeObserver.disconnect()
	}
	if (timer) clearInterval(timer)
})

const startCountdown = () => {
	if (!isDragging.value) return

	countdown.value = totalCountdownSeconds
	if (timer) clearInterval(timer)

	timer = setInterval(() => {
		countdown.value--
		if (countdown.value < 0) {
			emit('add-day')
			stopCountdown()
		}
	}, 1000 / speed)
}

const stopCountdown = () => {
	if (timer) {
		clearInterval(timer)
		timer = null
	}
	countdown.value = totalCountdownSeconds
}

// Start countdown when hovering while dragging
watch(isHovered, (val) => {
	if (val && isDragging.value) {
		startCountdown()
	} else {
		stopCountdown()
	}
})

// Stop countdown if drag ends
watch(isDragging, (val) => {
	if (!val) stopCountdown()
})
</script>

<template>
	<div class="zone-occupier">
		<div
			class="add-day-zone"
			ref="zoneRef"
			@click="emit('add-day')"
			:class="{
				'is-counting': isDragging && isHovered && countdown < totalCountdownSeconds,
				over: isHovered
			}"
		>
			<div class="add-content">
				<template v-if="isDragging && isHovered">
					<div class="countdown-number">{{ countdown }}</div>
					<div class="countdown-label">Hold to add</div>
				</template>
				<template v-else>
					<div class="plus-icon">+</div>
					<div class="hover-label">Add {{ label }}</div>
				</template>
			</div>

			<!-- Progress Bar Background/Effect -->
			<div
				class="progress-overlay"
				v-if="isDragging && isHovered"
				:style="{
					height: ((totalCountdownSeconds - countdown) / totalCountdownSeconds) * 100 * 1.05 + '%'
				}"
			></div>
		</div>
	</div>
</template>

<style scoped>
.zone-occupier {
	width: 2rem;
	position: relative;
}

.add-day-zone {
	width: calc(2rem + var(--scrollbar-size));
	border-left: 1px solid var(--border-color);
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	display: flex;
	align-items: center;
	justify-content: center;
	position: fixed;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 50;
	overflow: hidden;
	background: var(--bg-card);
	backdrop-filter: blur(10px);
	z-index: 999;
	text-align: center;
}

.add-day-zone:hover,
.add-day-zone.over {
	width: 10rem;
	background: var(--surface-hover);
	border-left-style: solid;
}

.is-counting {
	width: 10rem !important;
	background: color-mix(in srgb, var(--accent), transparent 90%);
}

.add-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	white-space: nowrap;
	position: relative;
	z-index: 2;
}

.plus-icon {
	font-size: 1.5rem;
	color: var(--text-muted);
	transition: transform 0.3s;
}

.add-day-zone:hover .plus-icon,
.add-day-zone.over .plus-icon {
	transform: rotate(180deg) scale(calc(4 + var(--ui-scale) * 1));
	color: var(--accent);
}

.hover-label {
	opacity: 0;
	transform: translateY(10px);
	transition: all 0.3s;
	font-size: 0.8rem;
	color: var(--text-muted);
}

.add-day-zone:hover .hover-label,
.add-day-zone.over .hover-label {
	opacity: 1;
	transform: translateY(0);
}

.countdown-number {
	font-size: 3rem;
	font-weight: 800;
	color: var(--text-primary);
	line-height: 1;
	animation: pulse 1s infinite;
}

.countdown-label {
	font-size: 0.75rem;
	color: var(--text-muted);
	text-transform: uppercase;
	letter-spacing: 1px;
}

.progress-overlay {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: color-mix(in srgb, var(--accent), transparent 90%);
	transition: height 0.8s linear;
	z-index: 1;
	pointer-events: none;
}

@keyframes pulse {
	0% {
		transform: scale(1);
		opacity: 0.8;
	}

	50% {
		transform: scale(1.1);
		opacity: 1;
	}

	100% {
		transform: scale(1);
		opacity: 0.8;
	}
}
</style>
