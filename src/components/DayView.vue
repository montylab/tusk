<script
    setup
    lang="ts"
>
import { ref, watch, onMounted, onUnmounted, computed, toRef, nextTick } from 'vue'
import DayColumn from './DayColumn.vue'
import AddDayZone from './AddDayZone.vue'
import type { Task } from '../types'
import { useDragOperator } from '../composables/useDragOperator'

const props = withDefaults(defineProps<{
    dates: string[]
    tasksByDate: Record<string, Task[]>
    startHour?: number
    endHour?: number
}>(), {
    startHour: 0,
    endHour: 24,
})

const emit = defineEmits<{
    (e: 'create-task', payload: { startTime: number, date: string }): void
    (e: 'edit', task: Task): void
    (e: 'add-day'): void
}>()

const headerOffset = ref(0)
const tasksContainerRef = ref<HTMLElement | null>(null)
const scrollAreaRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)

const { isDragging } = useDragOperator()

// --- Scroll & Layout ---
const updateScroll = () => {
    if (scrollAreaRef.value) {
        scrollTop.value = scrollAreaRef.value.scrollTop
    }
}

// --- Time & Status Helpers ---
const currentTime = ref(new Date())
let timer: any = null
const taskStatuses = ref<Record<string | number, 'past' | 'future' | 'on-air' | null>>({})

const allTasks = computed(() => Object.values(props.tasksByDate).flat())

const getTaskStatus = (task: Task | Partial<Task>, now: Date): 'past' | 'future' | 'on-air' | null => {
    if (task.startTime === null || task.startTime === undefined || !task.date) return null
    const todayStr = now.toISOString().split('T')[0]
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes()
    const taskStartMinutes = task.startTime * 60
    const taskEndMinutes = taskStartMinutes + (task.duration || 60)

    if (task.date > todayStr) return 'future'
    if (task.date < todayStr) return 'past'
    if (currentTotalMinutes < taskStartMinutes) return 'future'
    if (currentTotalMinutes >= taskStartMinutes && currentTotalMinutes < taskEndMinutes) return 'on-air'
    return 'past'
}

const updateTaskStatuses = () => {
    const now = currentTime.value
    allTasks.value.forEach(task => {
        taskStatuses.value[task.id] = getTaskStatus(task, now)
    })
}

// --- Stats ---
const formatStatsTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return `${h}:${m.toString().padStart(2, '0')}h`
}

const getDayStats = (date: string) => {
    const tasks = props.tasksByDate[date] || []
    let total = 0
    let completed = 0
    let deepTotal = 0
    let deepCompleted = 0
    const now = currentTime.value
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes()

    tasks.forEach(t => {
        const status = taskStatuses.value[t.id]
        total += t.duration
        let taskCompletedMinutes = 0
        if (status === 'past') {
            taskCompletedMinutes = t.duration
        } else if (status === 'on-air' && t.startTime !== null) {
            const taskStartMinutes = t.startTime * 60
            taskCompletedMinutes = Math.max(0, Math.min(t.duration, currentTotalMinutes - taskStartMinutes))
        }
        completed += taskCompletedMinutes
        if (t.isDeepWork) {
            deepTotal += t.duration
            deepCompleted += taskCompletedMinutes
        }
    })
    return {
        tasks: `${formatStatsTime(completed)} / ${formatStatsTime(total)}`,
        deep: `${formatStatsTime(deepCompleted)} / ${formatStatsTime(deepTotal)}`,
        hasDeep: deepTotal > 0
    }
}

const hours = Array.from({ length: props.endHour - props.startHour }, (_, i) => i + props.startHour)

// Task Boundaries
const taskBoundaryTimes = computed(() => {
    const times = new Set<number>()
    allTasks.value.forEach(task => {
        if (task.startTime !== null && task.startTime !== undefined) {
            if (task.startTime % 1 !== 0) times.add(task.startTime)
            const endTime = task.startTime + (task.duration / 60)
            if (endTime % 1 !== 0) times.add(endTime)
        }
    })
    return Array.from(times).sort((a, b) => a - b)
})

const formatTimeLabel = (time: number) => {
    const h = Math.floor(time)
    const m = Math.round((time % 1) * 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

const timeIndicatorTop = computed(() => {
    const now = currentTime.value
    const currentTotalHours = now.getHours() + now.getMinutes() / 60
    if (currentTotalHours < props.startHour || currentTotalHours > props.endHour) return -100
    return (currentTotalHours - props.startHour) * 80
})

const getDayName = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date().toISOString().split('T')[0]
    if (dateStr === today) return 'Today'
    return d.toLocaleDateString('en-US', { weekday: 'long' })
}

const getNextDateLabel = computed(() => {
    if (!props.dates.length) return ''
    const lastDate = new Date(props.dates[props.dates.length - 1])
    const nextDate = new Date(lastDate)
    nextDate.setDate(lastDate.getDate() + 1)
    return getDayName(nextDate.toISOString().split('T')[0]) + ' (' + nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ')'
})

const handleSlotClick = (hour: number, quarter: number, date: string) => {
    if (isDragging.value) return
    const startTime = hour + (quarter * 0.25)
    emit('create-task', { startTime, date })
}

const onAddDay = async () => {
    emit('add-day')
    await nextTick()
    if (scrollAreaRef.value) {
        scrollAreaRef.value.scrollTo({ left: scrollAreaRef.value.scrollWidth, behavior: 'smooth' })
    }
}

const scrollToTop = () => {
    scrollAreaRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const updateHeaderOffset = () => {
    if (tasksContainerRef.value) {
        const headerEl = tasksContainerRef.value.querySelector('.column-header')
        if (headerEl) {
            headerOffset.value = headerEl.clientHeight
        }
    }
}

onMounted(() => {
    updateTaskStatuses()
    timer = setInterval(() => {
        currentTime.value = new Date()
        updateTaskStatuses()
    }, 60000)
    window.addEventListener('resize', updateHeaderOffset)
    updateHeaderOffset()
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
    window.removeEventListener('resize', updateHeaderOffset)
})

watch(() => props.tasksByDate, updateTaskStatuses, { immediate: true, deep: true })

defineExpose({
    scrollToTop
})
</script>

<template>
    <div class="day-view-container">
        <div class="calendar-layout">
            <div class="calendar-scroll-area"
                 ref="scrollAreaRef"
                 @scroll="updateScroll">
                <div class="calendar-grid">
                    <!-- Time Labels -->
                    <div class="time-labels">
                        <div class="column-header"></div>
                        <div v-for="hour in hours"
                             :key="hour"
                             class="time-label">
                            {{ hour.toString().padStart(2, '0') }}:00
                        </div>
                        <div v-for="time in taskBoundaryTimes"
                             :key="`boundary-${time}`"
                             class="time-label task-boundary-label"
                             :style="{ top: `${(time - startHour) * 80 + 70}px` }">
                            {{ formatTimeLabel(time) }}
                        </div>
                    </div>

                    <!-- Columnar Content -->
                    <div class="days-wrapper"
                         ref="tasksContainerRef">
                        <div v-for="time in taskBoundaryTimes"
                             :key="`line-${time}`"
                             class="task-boundary-line"
                             :style="{ top: `${(time - startHour) * 80 + headerOffset}px` }">
                        </div>

                        <div v-for="date in dates"
                             :key="date"
                             class="day-column-outer">
                            <div class="column-header">
                                <div class="header-left">
                                    <span class="day-name">{{ getDayName(date) }}</span>
                                    <span class="date-num">{{ date }}</span>
                                </div>
                                <div class="header-right">
                                    <div class="stat-row">
                                        <i class="pi pi-check-circle"></i>
                                        <span>{{ getDayStats(date).tasks }}</span>
                                    </div>
                                    <div v-if="getDayStats(date).hasDeep"
                                         class="stat-row deep">
                                        <i class="pi pi-brain"></i>
                                        <span>{{ getDayStats(date).deep }}</span>
                                    </div>
                                </div>
                            </div>

                            <DayColumn :date="date"
                                       :tasks="tasksByDate[date] || []"
                                       :start-hour="startHour"
                                       :end-hour="endHour"
                                       :task-statuses="taskStatuses"
                                       :scroll-top="scrollTop"
                                       @slot-click="handleSlotClick($event.startTime, 0, date)"
                                       @edit="emit('edit', $event)" />

                            <div v-if="timeIndicatorTop >= 0 && getDayName(date) === 'Today'"
                                 class="current-time-line"
                                 :style="{ top: `${timeIndicatorTop + headerOffset}px` }">
                                <div class="time-dot"></div>
                            </div>
                        </div>

                        <AddDayZone :label="getNextDateLabel"
                                    @add-day="onAddDay" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.day-view-container {
    background: var(--bg-card);
    border-radius: var(--radius);
    padding-top: .5rem;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    backdrop-filter: blur(10px);
    overflow: hidden;
}

.calendar-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.calendar-scroll-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    position: relative;
}

.calendar-scroll-area::-webkit-scrollbar {
    scrollbar-color: red;
}

.calendar-grid {
    display: flex;
    position: relative;
    min-height: 100%;
    min-width: fit-content;
}

.time-labels {
    width: 60px;
    flex-shrink: 0;
    position: relative;
}

.time-label {
    height: 80px;
    padding: 0 1rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    border-bottom: 1px solid #333;
    display: flex;
    align-items: flex-start;
}

.task-boundary-label {
    position: absolute;
    right: 0;
    height: auto;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
    border-bottom: none;
    border-top: 1px solid #333;
    font-weight: 400;
    padding: 0 0.5rem;
    pointer-events: none;
    display: flex;
    align-items: flex-start;
}

.days-wrapper {
    display: flex;
    flex: 1;
    min-width: 0;
    position: relative;
}

.day-column-outer {
    flex: 1;
    min-width: 200px;
    width: 20vw;
    display: flex;
    flex-direction: column;
    position: relative;
}

.column-header {
    height: 70px;
    padding: 0 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    background: color-mix(in srgb, var(--bg-card) 60%, transparent);
    position: sticky;
    inset: 0;
    z-index: 20;
    backdrop-filter: blur(4px);
    transition: background 0.2s;
}

.column-header:hover {
    background: color-mix(in srgb, var(--bg-card) 85%, transparent);
}

.header-left,
.header-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.header-left {
    align-items: flex-start;
}

.header-right {
    align-items: flex-end;
}

.stat-row {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-muted);
}

.stat-row i {
    font-size: 0.6rem;
    opacity: 0.7;
}

.stat-row.deep {
    color: #a78bfa;
}

.stat-row.deep i {
    opacity: 1;
}

.day-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: #fff;
}

.date-num {
    font-size: 0.7rem;
    color: var(--text-muted);
}

.current-time-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-urgent);
    z-index: 100;
    pointer-events: none;
    box-shadow: 0 0 10px var(--color-urgent);
}

.time-dot {
    position: absolute;
    left: -4px;
    top: -4px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-urgent);
}
</style>
