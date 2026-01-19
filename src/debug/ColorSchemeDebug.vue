<script setup lang="ts">
import { computed } from 'vue'
import DayColumn from '../components/DayColumn.vue'
import { useCategoriesStore } from '../stores/categories'
import { tailwindColors, radixColors, ibmCarbonColors, defaultColors } from '../stores/settings'
import type { Task } from '../types'

const categoriesStore = useCategoriesStore()

const remap = async (palette: string[]) => {
	await categoriesStore.remapCategoriesToPalette(palette)
}

const categories = computed(() => categoriesStore.categoriesArray)

const currentTime = new Date()
const todayStr = currentTime.toISOString().split('T')[0]

// Mock tasks for first 3 days
const pastTasks = computed(() => {
	return categories.value.map((cat, i) => ({
		id: `past-${cat.id}`,
		text: `Past ${cat.name}`,
		category: cat.name,
		startTime: 9 + i * 0.75,
		duration: 30,
		completed: false,
		date: todayStr
	})) as Task[]
})

const activeTasks = computed(() => {
	return categories.value.map((cat, i) => ({
		id: `active-${cat.id}`,
		text: `Active ${cat.name}`,
		category: cat.name,
		startTime: 9 + i * 0.75,
		duration: 30,
		completed: false,
		date: todayStr
	})) as Task[]
})

const futureTasks = computed(() => {
	return categories.value.map((cat, i) => ({
		id: `future-${cat.id}`,
		text: `Future ${cat.name}`,
		category: cat.name,
		startTime: 9 + i * 0.75,
		duration: 30,
		completed: false,
		date: todayStr
	})) as Task[]
})

// Statuses
const pastStatuses = computed(() => {
	const res: Record<string, 'past'> = {}
	pastTasks.value.forEach((t) => (res[t.id] = 'past'))
	return res
})

const activeStatuses = computed(() => {
	const res: Record<string, 'on-air'> = {}
	activeTasks.value.forEach((t) => (res[t.id] = 'on-air'))
	return res
})

const futureStatuses = computed(() => {
	const res: Record<string, 'future'> = {}
	futureTasks.value.forEach((t) => (res[t.id] = 'future'))
	return res
})

// Per-category days
const categoryDays = computed(() => {
	return categories.value.map((cat) => {
		const tasks = [
			{
				id: `p-${cat.id}`,
				text: 'Past',
				category: cat.name,
				startTime: 9,
				duration: 60,
				completed: false,
				date: todayStr
			},
			{
				id: `a-${cat.id}`,
				text: 'On-Air',
				category: cat.name,
				startTime: 11,
				duration: 60,
				completed: false,
				date: todayStr
			},
			{
				id: `f-${cat.id}`,
				text: 'Future',
				category: cat.name,
				startTime: 13,
				duration: 60,
				completed: false,
				date: todayStr
			}
		] as Task[]

		const statuses: Record<string, any> = {
			[`p-${cat.id}`]: 'past',
			[`a-${cat.id}`]: 'on-air',
			[`f-${cat.id}`]: 'future'
		}

		return { cat, tasks, statuses }
	})
})

const mockSchedules = computed(() => {
	if (categories.value.length === 0) return []

	const taskTemplates = [
		{ text: 'Deep Work Session', duration: 90 },
		{ text: 'Quick Sync', duration: 15 },
		{ text: 'Project Planning', duration: 45 },
		{ text: 'Client Meeting', duration: 60 },
		{ text: 'Email Batching', duration: 30 },
		{ text: 'Code Review', duration: 45 },
		{ text: 'Technical Debt', duration: 120 },
		{ text: 'Learning / Course', duration: 75 }
	]

	const generateRandomDay = (seed: number) => {
		const dayTasks: Task[] = []
		let currentPos = 8.5 // Start at 8:30 AM

		for (let i = 0; i < 6; i++) {
			const template = taskTemplates[(seed + i) % taskTemplates.length]
			const cat = categories.value[(seed * 2 + i) % categories.value.length]

			dayTasks.push({
				id: `rnd-${seed}-${i}`,
				text: template.text,
				category: cat.name,
				startTime: currentPos,
				duration: template.duration,
				date: todayStr,
				completed: false
			} as Task)

			currentPos += template.duration / 60 + 0.25 // Add 15min gap
		}
		return dayTasks
	}

	return [
		{ name: 'Past Logic A', tasks: generateRandomDay(1), status: 'past' },
		{ name: 'Past Logic B', tasks: generateRandomDay(2), status: 'past' },
		{ name: 'Past Logic C', tasks: generateRandomDay(3), status: 'past' },
		{ name: 'Future Logic A', tasks: generateRandomDay(4), status: 'future' },
		{ name: 'Future Logic B', tasks: generateRandomDay(5), status: 'future' },
		{ name: 'Future Logic C', tasks: generateRandomDay(6), status: 'future' }
	].map((s) => ({
		name: s.name,
		tasks: s.tasks,
		statuses: s.tasks.reduce(
			(acc, t) => {
				acc[t.id] = s.status
				return acc
			},
			{} as Record<string, any>
		)
	}))
})

const startHour = 8
const endHour = 20
</script>

<template>
	<div class="color-debug-page">
		<header class="debug-header">
			<div class="header-main">
				<h1>Color Scheme Debug</h1>
				<p>Debugging task colors across different states (Past, On-Air, Future)</p>
			</div>

			<div class="header-controls">
				<span class="control-label">Bulk Remap:</span>
				<button class="control-btn" @click="remap(defaultColors)">Default</button>
				<button class="control-btn" @click="remap(tailwindColors)">Tailwind</button>
				<button class="control-btn" @click="remap(radixColors)">Radix</button>
				<button class="control-btn" @click="remap(ibmCarbonColors)">IBM Carbon</button>
			</div>
		</header>

		<div class="debug-grid">
			<!-- All Past -->
			<div class="debug-col">
				<h3>All Past</h3>
				<DayColumn
					:date="todayStr"
					:tasks="pastTasks"
					:start-hour="startHour"
					:end-hour="endHour"
					:task-statuses="pastStatuses"
					:current-time="currentTime"
				/>
			</div>

			<!-- All Active -->
			<div class="debug-col">
				<h3>All Active</h3>
				<DayColumn
					:date="todayStr"
					:tasks="activeTasks"
					:start-hour="startHour"
					:end-hour="endHour"
					:task-statuses="activeStatuses"
					:current-time="currentTime"
				/>
			</div>

			<!-- All Future -->
			<div class="debug-col">
				<h3>All Future</h3>
				<DayColumn
					:date="todayStr"
					:tasks="futureTasks"
					:start-hour="startHour"
					:end-hour="endHour"
					:task-statuses="futureStatuses"
					:current-time="currentTime"
				/>
			</div>

			<!-- Individual Categories -->
			<div v-for="day in categoryDays" :key="day.cat.id" class="debug-col">
				<h3>{{ day.cat.name }}</h3>
				<DayColumn
					:date="todayStr"
					:tasks="day.tasks"
					:start-hour="startHour"
					:end-hour="endHour"
					:task-statuses="day.statuses"
					:current-time="currentTime"
				/>
			</div>

			<!-- Mock Schedules -->
			<div v-for="schedule in mockSchedules" :key="schedule.name" class="debug-col">
				<h3>{{ schedule.name }}</h3>
				<DayColumn
					:date="todayStr"
					:tasks="schedule.tasks"
					:start-hour="startHour"
					:end-hour="endHour"
					:task-statuses="schedule.statuses"
					:current-time="currentTime"
				/>
			</div>
		</div>
	</div>
</template>

<style scoped>
.color-debug-page {
	padding: 2rem;
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-main);
	overflow: hidden;
}

.debug-header {
	margin-bottom: 2rem;
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--border-color);
}

.header-main h1 {
	font-size: 2rem;
	margin: 0;
	color: var(--antipod-color);
}

.header-main p {
	color: var(--text-muted);
	margin: 0.5rem 0 0 0;
}

.header-controls {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.control-label {
	font-size: 0.8rem;
	font-weight: 700;
	text-transform: uppercase;
	color: var(--text-muted);
	margin-right: 0.25rem;
}

.control-btn {
	padding: 0.5rem 1rem;
	background: var(--bg-card);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-sm);
	color: var(--text-primary);
	font-size: 0.85rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
}

.control-btn:hover {
	background: var(--accent);
	color: var(--text-on-accent);
	border-color: var(--accent);
	transform: translateY(-2px);
}

.debug-grid {
	display: flex;
	gap: 1rem;
	flex: 1;
	overflow-x: auto;
	padding-bottom: 2rem;
}

.debug-col {
	min-width: 250px;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.debug-col h3 {
	text-align: center;
	font-size: 0.9rem;
	margin: 0;
	padding: 0.5rem;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 4px;
	color: var(--antipod-color);
}

:deep(.day-column) {
	height: 800px;
	border: 1px solid var(--border-color);
	border-radius: 8px;
	overflow-y: auto;
}
</style>
