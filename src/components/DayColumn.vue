<script
    setup
    lang="ts"
>
import TaskItem from './TaskItem.vue'
import type { Task } from '../types'
import { useTaskLayout } from '../composables/useTaskLayout'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
    date: string
    tasks: Task[]
    startHour: number
    endHour: number
    activeTaskId: string | number | null
    mode: 'none' | 'drag' | 'resize-top' | 'resize-bottom'
    currentSnapTime: number | null
    currentDuration: number | null
    taskStatuses: Record<string | number, 'past' | 'future' | 'on-air' | null>
    isGhost?: boolean
}>(), {
    isGhost: false
})

const emit = defineEmits<{
    (e: 'start-operation', payload: { event: MouseEvent, taskId: string | number, opMode: 'drag' | 'resize-top' | 'resize-bottom', initialRect?: DOMRect }): void
    (e: 'slot-click', payload: { startTime: number }): void
    (e: 'edit', task: Task): void
}>()

const hours = computed(() =>
    Array.from({ length: props.endHour - props.startHour }, (_, i) => i + props.startHour)
)

const { layoutTasks } = useTaskLayout(
    () => props.tasks,
    computed(() => props.activeTaskId),
    computed(() => props.currentSnapTime),
    computed(() => props.currentDuration),
    {
        startHour: props.startHour,
        endHour: props.endHour,
        hourHeight: 80
    }
)

const handleSlotClick = (hour: number, q: number) => {
    emit('slot-click', { startTime: hour + q * 0.25 })
}
</script>

<template>
    <div class="day-column"
         :class="{ 'is-ghost': isGhost }">
        <div class="column-grid">
            <div v-for="hour in hours"
                 :key="hour"
                 class="hour-row">
                <div v-for="q in 4"
                     :key="q - 1"
                     class="quarter-slot"
                     @click="handleSlotClick(hour, q - 1)">
                </div>
            </div>
        </div>

        <div class="tasks-container">
            <template v-for="task in layoutTasks"
                      :key="task.id">
                <div class="task-wrapper-absolute"
                     :class="{
                        'is-dragging': task.id === activeTaskId && mode === 'drag',
                        'dragged-origin': task.id === activeTaskId
                    }"
                     :style="task.style"
                     @mousedown="emit('start-operation', {
                        event: $event,
                        taskId: task.id,
                        opMode: 'drag',
                        initialRect: ($event.currentTarget as HTMLElement).getBoundingClientRect()
                    })">

                    <!-- Top Handle -->
                    <div v-if="task.id !== activeTaskId || mode !== 'drag'"
                         class="resize-handle top"
                         @mousedown.stop="emit('start-operation', {
                            event: $event,
                            taskId: task.id,
                            opMode: 'resize-top',
                            initialRect: ($event.currentTarget as HTMLElement).closest('.task-wrapper-absolute')?.getBoundingClientRect()
                        })">
                    </div>

                    <TaskItem :task="task"
                              :is-dragging="task.id === activeTaskId && mode === 'drag'"
                              :is-shaking="task.isOverlapping"
                              :status="taskStatuses[task.id]"
                              @edit="emit('edit', $event)" />

                    <!-- Bottom Handle -->
                    <div v-if="task.id !== activeTaskId || mode !== 'drag'"
                         class="resize-handle bottom"
                         @mousedown.stop="emit('start-operation', {
                            event: $event,
                            taskId: task.id,
                            opMode: 'resize-bottom',
                            initialRect: ($event.currentTarget as HTMLElement).closest('.task-wrapper-absolute')?.getBoundingClientRect()
                        })">
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.day-column {
    flex: 1;
    position: relative;
    border-left: 1px solid var(--border-color);
    min-width: 200px;
    background: rgba(255, 255, 255, 0.01);
}

.column-grid {
    position: relative;
}

.hour-row {
    height: 80px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
}

.quarter-slot {
    flex: 1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    cursor: cell;
    transition: background 0.2s;
}

.quarter-slot:last-child {
    border-bottom: none;
}

.quarter-slot:hover {
    background: rgba(255, 255, 255, 0.03);
}

.tasks-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
}

.task-wrapper-absolute {
    position: absolute;
    pointer-events: auto;
    /* Only animate when NOT interacting to avoid lag/jumping */
    transition: none;
    user-select: none;
}

/* Base transition for static items */
.task-wrapper-absolute:not(.dragged-origin) {
    transition: transform 0.1s, box-shadow 0.2s, opacity 0.2s;
}

.task-wrapper-absolute.is-dragging {
    opacity: 0.15;
    pointer-events: none;
}

.resize-handle {
    position: absolute;
    left: 0;
    right: 0;
    height: 6px;
    cursor: ns-resize;
    z-index: 10;
}

.resize-handle.top {
    top: -3px;
}

.resize-handle.bottom {
    bottom: -3px;
}

.is-ghost {
    opacity: 0.5;
    pointer-events: none;
}

.dragged-origin {
    opacity: 0.25;
    pointer-events: none;
}
</style>
