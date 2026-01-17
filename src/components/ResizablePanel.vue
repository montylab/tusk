<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = withDefaults(
	defineProps<{
		side: 'left' | 'right' | 'top' | 'bottom'
		minSize?: number
		maxSize?: number
		defaultSize?: number
		storageKey?: string
	}>(),
	{
		minSize: 0,
		maxSize: 9999,
		defaultSize: 300
	}
)

const emit = defineEmits<{
	(e: 'resize', size: number): void
}>()

const dimension = computed(() => (['left', 'right'].includes(props.side) ? 'width' : 'height'))
const size = ref(props.defaultSize)
const isDragging = ref(false)

// Load saved size from localStorage
onMounted(() => {
	if (props.storageKey) {
		const saved = localStorage.getItem(props.storageKey)
		if (saved) {
			const parsedSize = parseInt(saved, 10)
			if (!isNaN(parsedSize)) {
				size.value = Math.max(props.minSize, Math.min(props.maxSize, parsedSize))
			}
		}
	}
	emit('resize', size.value)
})

const getEventPos = (e: MouseEvent | TouchEvent) => {
	const isWidth = dimension.value === 'width'
	if ('touches' in e && e.touches.length > 0) return isWidth ? e.touches[0].clientX : e.touches[0].clientY
	if ('changedTouches' in e && e.changedTouches.length > 0) return isWidth ? e.changedTouches[0].clientX : e.changedTouches[0].clientY
	return isWidth ? (e as MouseEvent).clientX : (e as MouseEvent).clientY
}

const handleStart = (e: MouseEvent | TouchEvent) => {
	if (e.cancelable) e.preventDefault()
	isDragging.value = true

	const startPos = getEventPos(e)
	const startSize = size.value

	const handleMove = (e: MouseEvent | TouchEvent) => {
		if (!isDragging.value) return
		if (e.type === 'touchmove' && e.cancelable) e.preventDefault()

		const currentPos = getEventPos(e)
		const delta = props.side === 'right' || props.side === 'bottom' ? currentPos - startPos : startPos - currentPos
		const newSize = Math.max(props.minSize, Math.min(props.maxSize, startSize + delta))

		size.value = newSize
		emit('resize', newSize)
	}

	const handleEnd = () => {
		isDragging.value = false
		document.removeEventListener('mousemove', handleMove)
		document.removeEventListener('mouseup', handleEnd)
		document.removeEventListener('touchmove', handleMove)
		document.removeEventListener('touchend', handleEnd)

		// Save to localStorage
		if (props.storageKey) {
			localStorage.setItem(props.storageKey, size.value.toString())
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
	<div class="resizable-panel" :class="[dimension]" :style="{ [dimension]: `${size}px` }">
		<slot></slot>
		<div
			class="resize-handle"
			:class="{ dragging: isDragging, [side]: true, [dimension]: true }"
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
}

.resizable-panel.width {
	height: 100%;
}

.resizable-panel.height {
	width: 100%;
}

.resize-handle {
	position: absolute;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.2s ease;
}

.resize-handle.width {
	top: 0;
	bottom: 0;
	width: 8px;
	cursor: col-resize;
}

.resize-handle.height {
	left: 0;
	right: 0;
	height: 8px;
	cursor: row-resize;
}

.resize-handle:hover,
.resize-handle.dragging {
	background-color: color-mix(in srgb, var(--accent), transparent 90%);
}

.resize-handle.dragging {
	background-color: color-mix(in srgb, var(--accent), transparent 80%);
}

.handle-indicator {
	background: var(--border-color);
	border-radius: 2px;
	transition: all 0.2s ease;
}

.resize-handle.width .handle-indicator {
	width: 2px;
	height: 40px;
}

.resize-handle.height .handle-indicator {
	width: 40px;
	height: 2px;
}

.resize-handle:hover .handle-indicator,
.resize-handle.dragging .handle-indicator {
	background: var(--accent);
}

.resize-handle.width:hover .handle-indicator,
.resize-handle.width.dragging .handle-indicator {
	height: 60px;
}

.resize-handle.height:hover .handle-indicator,
.resize-handle.height.dragging .handle-indicator {
	width: 60px;
}

.resize-handle.dragging .handle-indicator {
	background: var(--accent-hover);
}
</style>
