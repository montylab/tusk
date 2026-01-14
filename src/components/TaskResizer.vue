<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Task } from '../types'
import { useTasksStore } from '../stores/tasks'

const props = withDefaults(
	defineProps<{
		task: Task
		layoutStyle: Record<string, any>
		hourHeight?: number
		snapMinutes?: number
		startHour: number
	}>(),
	{
		hourHeight: 80,
		snapMinutes: 15
	}
)

const emit = defineEmits<{
	(e: 'start-resize'): void
	(e: 'end-resize'): void
}>()

const tasksStore = useTasksStore()

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

const onMouseDown = (e: MouseEvent, handle: 'top' | 'bottom') => {
	e.stopPropagation() // Prevent drag start
	// e.preventDefault() // Allow focus? But text selection might be bad.
	e.preventDefault()

	isResizing.value = true
	resizeHandle.value = handle
	startY.value = e.clientY

	initialStartTime.value = props.task.startTime || 0
	initialDuration.value = props.task.duration || 60

	emit('start-resize')

	window.addEventListener('mousemove', onMouseMove)
	window.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e: MouseEvent) => {
	if (!isResizing.value) return

	const dy = e.clientY - startY.value
	const minutesDelta = (dy / props.hourHeight) * 60

	const snap = props.snapMinutes

	if (resizeHandle.value === 'bottom') {
		let newDuration = initialDuration.value + minutesDelta
		// Snap duration
		newDuration = Math.round(newDuration / snap) * snap
		// Min duration
		newDuration = Math.max(snap, newDuration)

		localDuration.value = newDuration
		// localStartTime unchanged
	} else if (resizeHandle.value === 'top') {
		let newStartTime = initialStartTime.value + minutesDelta / 60
		// Snap
		newStartTime = Math.round(newStartTime * (60 / snap)) / (60 / snap)

		const originalEndTime = initialStartTime.value + initialDuration.value / 60
		let newDurationPixels = (originalEndTime - newStartTime) * 60

		// Min duration check
		if (newDurationPixels < snap) {
			newDurationPixels = snap
			newStartTime = originalEndTime - snap / 60
		}

		localStartTime.value = newStartTime
		localDuration.value = newDurationPixels
	}
}

const onMouseUp = async () => {
	if (!isResizing.value) return

	window.removeEventListener('mousemove', onMouseMove)
	window.removeEventListener('mouseup', onMouseUp)

	const finalStartTime = localStartTime.value
	const finalDuration = localDuration.value
	const date = props.task.date

	// Optimistic update waiting? No, we just commit.
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
		<div class="resize-handle top" @mousedown="onMouseDown($event, 'top')"></div>
		<div class="resize-handle bottom" @mousedown="onMouseDown($event, 'bottom')"></div>
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
