<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import DayColumn from './DayColumn.vue'
import AddDayZone from './AddDayZone.vue'
import type { Task } from '../types'
import { useDragOperator } from '../composables/useDragOperator'
import { getTaskStatus } from '../logic/taskStatus'
import { useSettingsStore } from '../stores/settings'
import AppIcon from './common/AppIcon.vue'

const props = withDefaults(
	defineProps<{
		dates: string[]
		tasksByDate: Record<string, Task[]>
		startHour?: number
		endHour?: number
	}>(),
	{
		startHour: 0,
		endHour: 24
	}
)

const emit = defineEmits<{
	(e: 'create-task', payload: { startTime: number; date: string }): void
	(e: 'edit', task: Task): void
	(e: 'add-day'): void
}>()

const headerOffset = ref(0)
const tasksContainerRef = ref<HTMLElement | null>(null)
const scrollAreaRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const scrollLeft = ref(0)

const { isDragging } = useDragOperator()

// --- Scroll & Layout ---
const updateScroll = () => {
	if (scrollAreaRef.value) {
		scrollTop.value = scrollAreaRef.value.scrollTop
		scrollLeft.value = scrollAreaRef.value.scrollLeft
	}
}

// --- Time & Status Helpers ---
const currentTime = ref(new Date())
let timer: any = null
const taskStatuses = ref<Record<string | number, 'past' | 'future' | 'on-air' | null>>({})

const allTasks = computed(() => Object.values(props.tasksByDate).flat())

const updateTaskStatuses = () => {
	const now = currentTime.value
	allTasks.value.forEach((task) => {
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

	tasks.forEach((t) => {
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
	allTasks.value.forEach((task) => {
		if (task.startTime !== null && task.startTime !== undefined) {
			if (task.startTime % 1 !== 0) times.add(task.startTime)
			const endTime = task.startTime + task.duration / 60
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

const settingsStore = useSettingsStore()
const { hourHeight, uiScale } = storeToRefs(settingsStore)

const timeIndicatorTop = computed(() => {
	const now = currentTime.value
	const currentTotalHours = now.getHours() + now.getMinutes() / 60
	if (currentTotalHours < props.startHour || currentTotalHours > props.endHour) return -100
	return (currentTotalHours - props.startHour) * hourHeight.value
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
	return (
		getDayName(nextDate.toISOString().split('T')[0]) + ' (' + nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ')'
	)
})

const handleSlotClick = (hour: number, quarter: number, date: string) => {
	if (isDragging.value) return
	const startTime = hour + quarter * 0.25
	emit('create-task', { startTime, date })
}

const scrollToCurrentTime = (behavior: ScrollBehavior = 'auto') => {
	const now = new Date()
	const currentHour = now.getHours() + now.getMinutes() / 60
	const scrollHour = Math.max(props.startHour, currentHour - 1)
	if (scrollAreaRef.value) {
		const top = (scrollHour - props.startHour) * hourHeight.value
		scrollAreaRef.value.scrollTo({ top, behavior })
	}
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

	// Scroll to current time once settings are loaded
	watch(
		() => settingsStore.loading,
		(isLoading) => {
			if (!isLoading) {
				nextTick(() => scrollToCurrentTime())
			}
		},
		{ immediate: true }
	)
})

onUnmounted(() => {
	if (timer) clearInterval(timer)
	window.removeEventListener('resize', updateHeaderOffset)
})

watch(uiScale, () => {
	nextTick(() => updateHeaderOffset())
})

watch(() => props.tasksByDate, updateTaskStatuses, { immediate: true, deep: true })

const scrollToDate = (date: string) => {
	if (!scrollAreaRef.value || !tasksContainerRef.value) return

	const columns = Array.from(tasksContainerRef.value.querySelectorAll('.day-column-outer'))
	const targetColumn = columns.find((_, index) => props.dates[index] === date) as HTMLElement

	if (targetColumn) {
		const containerWidth = scrollAreaRef.value.clientWidth
		const columnLeft = targetColumn.offsetLeft
		const columnWidth = targetColumn.offsetWidth
		const scrollTo = columnLeft - containerWidth / 2 + columnWidth / 2
		scrollAreaRef.value.scrollTo({ left: scrollTo, behavior: 'smooth' })
		console.log(scrollTo)
	}
}

defineExpose({
	scrollToTop,
	scrollToDate,
	scrollToCurrentTime
})
</script>

<template>
	<div class="day-view-container">
		<div class="calendar-layout">
			<div class="calendar-scroll-area" ref="scrollAreaRef" @scroll="updateScroll">
				<div class="calendar-grid">
					<!-- Time Labels -->
					<div class="time-labels">
						<div class="column-header"></div>
						<div v-for="hour in hours" :key="hour" class="time-label">{{ hour.toString().padStart(2, '0') }}:00</div>
						<div
							v-for="time in taskBoundaryTimes"
							:key="`boundary-${time}`"
							class="time-label task-boundary-label"
							:style="{ top: `${(time - startHour) * hourHeight + headerOffset}px` }"
						>
							{{ formatTimeLabel(time) }}
						</div>
					</div>

					<!-- Columnar Content -->
					<div class="days-wrapper" ref="tasksContainerRef">
						<div
							v-for="time in taskBoundaryTimes"
							:key="`line-${time}`"
							class="task-boundary-line"
							:style="{ top: `${(time - startHour) * hourHeight + headerOffset}px` }"
						></div>

						<div v-for="date in dates" :key="date" class="day-column-outer">
							<div class="column-header">
								<div class="header-left">
									<span class="day-name">{{ getDayName(date) }}</span>
									<span class="date-num">{{ date }}</span>
								</div>
								<div class="header-right">
									<div class="stat-row">
										<AppIcon name="check" size="0.75rem" />
										<span>{{ getDayStats(date).tasks }}</span>
									</div>
									<div v-if="getDayStats(date).hasDeep" class="stat-row deep">
										<AppIcon name="brain" size="0.75rem" />
										<span>{{ getDayStats(date).deep }}</span>
									</div>
								</div>
							</div>

							<DayColumn
								:date="date"
								:tasks="tasksByDate[date] || []"
								:start-hour="startHour"
								:end-hour="endHour"
								:task-statuses="taskStatuses"
								:scroll-top="scrollTop"
								:scroll-left="scrollLeft"
								@slot-click="handleSlotClick($event.startTime, 0, date)"
								@edit="emit('edit', $event)"
							/>

							<div
								v-if="timeIndicatorTop >= 0 && getDayName(date) === 'Today'"
								class="current-time-line"
								:style="{ top: `${timeIndicatorTop + headerOffset}px` }"
							>
								<div class="time-dot"></div>
							</div>
						</div>

						<AddDayZone :label="getNextDateLabel" @add-day="onAddDay" />
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
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	border: 1px solid var(--border-color);
	backdrop-filter: blur(10px);
	overflow: hidden;
}

.day-view {
	padding-top: 0.5rem;
	flex: 1;
	display: flex;
	flex-direction: column;
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
	width: 4rem;
	flex-shrink: 0;
	position: sticky;
	left: 0;
	z-index: 30;
	background: var(--bg-card);
	border-right: 1px solid var(--border-color);
}

.time-label {
	height: var(--hour-height);
	padding: 0 var(--spacing-md);
	font-size: var(--font-sm);
	color: color-mix(in srgb, var(--text-primary), transparent 25%);
	border-bottom: 1px solid var(--border-color);
	display: flex;
	align-items: flex-start;
}

.task-boundary-label {
	position: absolute;
	right: 0;
	height: auto;
	font-size: var(--font-xs);
	color: color-mix(in srgb, var(--text-primary), transparent 60%);
	border-bottom: none;
	border-top: 1px solid var(--border-color);
	font-weight: 400;
	padding: 0 var(--spacing-xs);
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
	min-width: 12.5rem;
	width: 20vw;
	display: flex;
	flex-direction: column;
	position: relative;
}

.column-header {
	height: var(--header-height);
	padding: 0 0.75rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 2px solid var(--border-color);
	background: color-mix(in srgb, var(--bg-card) 60%, transparent);
	position: sticky;
	top: 0;
	z-index: 40;
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
	font-size: var(--font-xs);
	font-weight: 600;
	color: var(--text-muted);
}

.stat-row.deep {
	color: #a78bfa;
}

.day-name {
	font-size: var(--font-base);
	font-weight: 700;
	color: var(--text-primary);
	line-height: 1.3;
}

.date-num {
	font-size: var(--font-sm);
	color: var(--text-muted);
}

.current-time-line {
	position: absolute;
	left: 0;
	right: 0;
	height: 2px;
	background: var(--color-danger);
	z-index: 100;
	pointer-events: none;
	box-shadow: 0 0 calc(var(--ui-scale) * 10px) var(--color-danger);
}

.time-dot {
	position: absolute;
	inset: 1px 0;
	transform: translate(-50%, -50%);
	--dot-size: calc(0.5rem + 0.25rem / var(--ui-scale));
	width: var(--dot-size);
	height: var(--dot-size);
	border-radius: 50%;
	background: var(--color-danger);
}
</style>
