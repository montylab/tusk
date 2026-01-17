<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = withDefaults(
	defineProps<{
		side: 'left' | 'right'
		minWidth?: number
		maxWidth?: number
		defaultWidth?: number
		storageKey?: string
	}>(),
	{
		minWidth: 150,
		maxWidth: 600,
		defaultWidth: 300
	}
)

const emit = defineEmits<{
	(e: 'resize', width: number): void
}>()

const width = ref(props.defaultWidth)
const isDragging = ref(false)

// Load saved width from localStorage
onMounted(() => {
	if (props.storageKey) {
		const saved = localStorage.getItem(props.storageKey)
		if (saved) {
			const parsedWidth = parseInt(saved, 10)
			if (!isNaN(parsedWidth)) {
				width.value = Math.max(props.minWidth, Math.min(props.maxWidth, parsedWidth))
			}
		}
	}
	emit('resize', width.value)
})

const getEventX = (e: MouseEvent | TouchEvent) => {
	if ('touches' in e && e.touches.length > 0) return e.touches[0].clientX
	if ('changedTouches' in e && e.changedTouches.length > 0) return e.changedTouches[0].clientX
	return (e as MouseEvent).clientX
}

const handleStart = (e: MouseEvent | TouchEvent) => {
	if (e.cancelable) e.preventDefault()
	isDragging.value = true

	const startX = getEventX(e)
	const startWidth = width.value

	const handleMove = (e: MouseEvent | TouchEvent) => {
		if (!isDragging.value) return
		if (e.type === 'touchmove' && e.cancelable) e.preventDefault()

		const currentX = getEventX(e)
		const delta = props.side === 'right' ? currentX - startX : startX - currentX
		const newWidth = Math.max(props.minWidth, Math.min(props.maxWidth, startWidth + delta))

		width.value = newWidth
		emit('resize', newWidth)
	}

	const handleEnd = () => {
		isDragging.value = false
		document.removeEventListener('mousemove', handleMove)
		document.removeEventListener('mouseup', handleEnd)
		document.removeEventListener('touchmove', handleMove)
		document.removeEventListener('touchend', handleEnd)

		// Save to localStorage
		if (props.storageKey) {
			localStorage.setItem(props.storageKey, width.value.toString())
		}
	}

	if (e.type === 'touchstart') {
		document.addEventListener('touchmove', handleMove, { passive: false })
		document.addEventListener('touchend', handleEnd)
	} else {
		document.addEventListener('mousemove', handleMove)
		document.addEventListener('mouseup', handleEnd)
	}
}

const handleStyle = computed(() => ({
	[props.side]: '-4px'
}))
</script>

<template>
	<div class="resizable-panel" :style="{ width: `${width}px` }">
		<slot></slot>
		<div
			class="resize-handle"
			:class="{ dragging: isDragging, [side]: true }"
			:style="handleStyle"
			@mousedown="handleStart"
			@touchstart="handleStart"
		>
			<div class="handle-indicator"></div>
		</div>
	</div>
</template>

<style scoped>
.resizable-panel {
	position: relative;
	flex-shrink: 0;
	height: 100%;
}

.resize-handle {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 8px;
	cursor: col-resize;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.2s ease;
}

.resize-handle:hover,
.resize-handle.dragging {
	background-color: color-mix(in srgb, var(--accent), transparent 90%);
}

.resize-handle.dragging {
	background-color: color-mix(in srgb, var(--accent), transparent 80%);
}

.handle-indicator {
	width: 2px;
	height: 40px;
	background: var(--border-color);
	border-radius: 2px;
	transition: all 0.2s ease;
}

.resize-handle:hover .handle-indicator,
.resize-handle.dragging .handle-indicator {
	background: var(--accent);
	height: 60px;
}

.resize-handle.dragging .handle-indicator {
	background: var(--accent-hover);
}
</style>
