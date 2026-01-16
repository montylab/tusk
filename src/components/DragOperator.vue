<script setup lang="ts">
import { computed } from 'vue'
import { useDragOperator } from '../composables/useDragOperator'
import { getTaskStatus } from '../logic/taskStatus'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'
import TaskItem from './TaskItem.vue'

const { isDragging, draggedTask, ghostPosition, currentZone, dropData, isDestroying } = useDragOperator()
const settingsStore = useSettingsStore()
const { hourHeight, uiScale } = storeToRefs(settingsStore)

const isVisible = computed(() => isDragging.value || isDestroying.value)

const isOverCalendar = computed(() => currentZone.value?.startsWith('calendar-day-'))

const ghostStyle = computed(() => {
	if (!ghostPosition.value) return {}

	// If destroying, animate towards the trash basket corner
	if (isDestroying.value) {
		return {
			top: '100%',
			left: '100%',
			width: '0px',
			height: '0px',
			opacity: '0',
			transform: 'translate(-100%, -100%) scale(0) rotate(20deg)',
			transition: 'all 0.3s cubic-bezier(0.55, 0, 1, 0.45)'
		}
	}

	// Default dimensions
	let width = `${220 * uiScale.value}px`
	let height = `${hourHeight.value}px`
	let left = `${ghostPosition.value.x}px`
	let top = `${ghostPosition.value.y}px`
	let transform = 'translate(-50%, -50%)'

	// If over calendar and we have snapped coordinates, use them!
	if (isOverCalendar.value && dropData.value?.snappedRect) {
		const snap = dropData.value.snappedRect
		left = `${snap.left}px`
		top = `${snap.top}px`
		width = `${snap.width}px` // Full width of column
		height = `${snap.height}px`
		transform = 'none' // We are positioning top-left exactly
	} else if (isOverCalendar.value) {
		// Fallback if snap data missing but over calendar (rare)
		const duration = dropData.value?.duration || draggedTask.value?.duration || 60
		height = `${(duration / 60) * hourHeight.value}px`
		width = `${200 * uiScale.value}px`
	}

	return {
		top,
		left,
		width,
		height,
		transform,
		transition: 'none'
	}
})

// Create a reactive task object for the ghost
const ghostTask = computed(() => {
	if (!draggedTask.value) return null

	const overrides: any = {}

	if (isOverCalendar.value) {
		// Apply snapped calendar data
		if (dropData.value) {
			overrides.startTime = dropData.value.time
			overrides.duration = dropData.value.duration
			overrides.date = dropData.value.date
			overrides.status = getTaskStatus(overrides)
		}
	} else {
		// Force compact mode behavior
		overrides.duration = 60
	}

	return {
		...draggedTask.value,
		...overrides
	}
})
</script>

<template>
	<Teleport to="body">
		<div v-if="isVisible && ghostTask" class="drag-ghost" :style="ghostStyle" :class="{ 'is-destroying': isDestroying }">
			<TaskItem :task="ghostTask" :is-dragging="true" :status="ghostTask.status" />
		</div>
	</Teleport>
</template>

<style scoped>
.drag-ghost {
	z-index: 9999;
	will-change: top, left, width, height, transform, opacity;
	border-radius: 6px;
	box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
	pointer-events: none;
	position: fixed;
}

.drag-ghost.is-destroying {
	overflow: hidden;
	box-shadow: none;
}
</style>
