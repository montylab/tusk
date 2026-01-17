<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Task } from '../types'
import { useTasksStore } from '../stores/tasks'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'

const props = defineProps<{
	task: Task
	layoutStyle: Record<string, any>
	startHour: number
}>()

const emit = defineEmits<{
	(e: 'start-resize'): void
	(e: 'end-resize'): void
}>()

const tasksStore = useTasksStore()
const settingsStore = useSettingsStore()
const { hourHeight, settings } = storeToRefs(settingsStore)

const isResizing = ref(false)
const resizeHandle = ref<'top' | 'bottom' | null>(null)

// Local state during resize
const localStartTime = ref(props.task.startTime || 0)
const localDuration = ref(props.task.duration || 60)

// Reset local state when task changes (and not resizing)
watch(
	() => props.task,
	(newTask) => {
		if (!isResizing.value) {
			localStartTime.value = newTask.startTime || 0
			localDuration.value = newTask.duration || 60
		}
	},
	{ deep: true, immediate: true }
)

// Derived task object for the slot
const displayTask = computed(() => {
	if (!isResizing.value) return props.task
	return {
		...props.task,
		startTime: localStartTime.value,
		duration: localDuration.value
	}
})

const startY = ref(0)
const initialStartTime = ref(0)
const initialDuration = ref(0)

const getEventY = (e: MouseEvent | TouchEvent) => {
	if ('touches' in e && e.touches.length > 0) return e.touches[0].clientY
	if ('changedTouches' in e && e.changedTouches.length > 0) return e.changedTouches[0].clientY
	return (e as MouseEvent).clientY
}

const onStart = (e: MouseEvent | TouchEvent, handle: 'top' | 'bottom') => {
	e.stopPropagation()
	if (e.cancelable) e.preventDefault()

	isResizing.value = true
	resizeHandle.value = handle
	startY.value = getEventY(e)

	initialStartTime.value = props.task.startTime || 0
	initialDuration.value = props.task.duration || 60

	emit('start-resize')

	if (e.type === 'touchstart') {
		window.addEventListener('touchmove', onMove, { passive: false })
		window.addEventListener('touchend', onEnd)
	} else {
		window.addEventListener('mousemove', onMove)
		window.addEventListener('mouseup', onEnd)
	}
}

const onMove = (e: MouseEvent | TouchEvent) => {
	if (!isResizing.value) return
	if (e.type === 'touchmove' && e.cancelable) e.preventDefault()

	const currentY = getEventY(e)
	const dy = currentY - startY.value
	const minutesDelta = (dy / hourHeight.value) * 60

	const snap = settings.value.snapMinutes || 15

	if (resizeHandle.value === 'bottom') {
		let newDuration = initialDuration.value + minutesDelta
		newDuration = Math.round(newDuration / snap) * snap
		newDuration = Math.max(snap, newDuration)
		localDuration.value = newDuration
	} else if (resizeHandle.value === 'top') {
		let newStartTime = initialStartTime.value + minutesDelta / 60
		newStartTime = Math.round(newStartTime * (60 / snap)) / (60 / snap)

		const originalEndTime = initialStartTime.value + initialDuration.value / 60
		let newDurationPixels = (originalEndTime - newStartTime) * 60

		if (newDurationPixels < snap) {
			newDurationPixels = snap
			newStartTime = originalEndTime - snap / 60
		}

		localStartTime.value = newStartTime
		localDuration.value = newDurationPixels
	}
}

const onEnd = async () => {
	if (!isResizing.value) return

	window.removeEventListener('mousemove', onMove)
	window.removeEventListener('mouseup', onEnd)
	window.removeEventListener('touchmove', onMove)
	window.removeEventListener('touchend', onEnd)

	const finalStartTime = localStartTime.value
	const finalDuration = localDuration.value
	const date = props.task.date

	if (date && (finalStartTime !== props.task.startTime || finalDuration !== props.task.duration)) {
		await tasksStore.updateScheduledTask(props.task.id, date, {
			startTime: finalStartTime,
			duration: finalDuration
		})
	}

	isResizing.value = false
	resizeHandle.value = null
	emit('end-resize')
}
</script>

<template>
	<div
		class="task-resizer-wrapper"
		:class="{ 'is-resizing': isResizing }"
		:style="[
			layoutStyle,
			isResizing
				? {
						top: `${(localStartTime - props.startHour) * hourHeight}px`,
						height: `${(localDuration / 60) * hourHeight}px`,
						zIndex: 20
					}
				: {}
		]"
	>
		<slot :resizedTask="displayTask" :isResizing="isResizing"></slot>

		<!-- Handles -->
		<div class="resize-handle top" @mousedown="onStart($event, 'top')" @touchstart="onStart($event, 'top')"></div>
		<div class="resize-handle bottom" @mousedown="onStart($event, 'bottom')" @touchstart="onStart($event, 'bottom')"></div>
	</div>
</template>

<style scoped>
.task-resizer-wrapper {
	position: absolute;
	display: flex;
	flex-direction: column;
}

.resize-handle {
	position: absolute;
	left: 0;
	right: 0;
	height: 8px; /* Slightly larger for easier grab */
	cursor: ns-resize;
	z-index: 10;
}

.resize-handle.top {
	top: -4px;
}

.resize-handle.bottom {
	bottom: -4px;
}

.resize-handle:hover {
	background: rgba(255, 255, 255, 0.2);
}
</style>
