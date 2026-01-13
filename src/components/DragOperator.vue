<script
    setup
    lang="ts"
>
import { computed } from 'vue'
import { useDragOperator } from '../composables/useDragOperator'
import { getTaskStatus } from '../logic/taskStatus'
import TaskItem from './TaskItem.vue'

const { isDragging, draggedTask, ghostPosition, currentZone, dropData } = useDragOperator()

const isOverCalendar = computed(() => currentZone.value?.startsWith('calendar-day-'))

const ghostStyle = computed(() => {
    if (!ghostPosition.value) return {}

    // Default dimensions
    let width = '220px'
    let height = '70px' // Let TaskItem determine height for piles (compact)
    let left = `${ghostPosition.value.x}px`
    let top = `${ghostPosition.value.y}px`
    let transform = 'translate(-50%, -50%)' // Center on cursor by default

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
        height = `${(duration / 60) * 80}px`
        width = '200px'
    }

    return {
        top,
        left,
        width,
        height,
        transform
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
            overrides.status = getTaskStatus(overrides, new Date())
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
        <div v-if="isDragging && ghostTask"
             class="drag-ghost"
             :style="ghostStyle">
            <TaskItem :task="ghostTask"
                      :is-dragging="true"
                      :status="ghostTask.status" />
        </div>
    </Teleport>
</template>

<style scoped>
.drag-ghost {
    z-index: 9999;
    will-change: top, left, width, height;
    border-radius: 6px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
    pointer-events: none;
    position: fixed
}
</style>
