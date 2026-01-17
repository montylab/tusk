<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import DayView from '../components/DayView.vue'
import TaskPageLayout from '../components/TaskPageLayout.vue'
import TaskEditorPopup from '../components/TaskEditorPopup.vue'
import { useTasksStore } from '../stores/tasks'
import { useTimeBoundaries } from '../composables/useTimeBoundaries'
import { useTaskEditor } from '../composables/useTaskEditor'
import { formatDate, getMonday, getWeekDays } from '../utils/dateUtils'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()
const { onDayChange } = useTimeBoundaries()

onDayChange((newDate) => {
	router.push({ name: 'week', params: { date: newDate } })
})
const { currentDates, scheduledTasks } = storeToRefs(tasksStore)

// Reference to DayView
const dayViewRef = ref<any>(null)

// Shared Task Logic
const {
	showEditorPopup,
	initialStartTime,
	taskToEdit,
	popupTaskType,
	popupTargetDate,
	handleOpenCreatePopup,
	handleEditTask,
	handleTaskCreate,
	handleTaskUpdate,
	handlePopupClose
} = useTaskEditor()

// Watch for date parameter changes
watch(
	() => route.params.date,
	(paramDate) => {
		let baseDate: Date
		if (paramDate && typeof paramDate === 'string') {
			baseDate = new Date(paramDate)
		} else {
			baseDate = new Date()
		}

		const monday = getMonday(baseDate)
		const weekDays = getWeekDays(monday)
		tasksStore.currentDates = weekDays

		setTimeout(() => {
			dayViewRef.value?.scrollToTop()
			const today = formatDate(new Date())
			if (weekDays.includes(today)) {
				dayViewRef.value?.scrollToDate(today)
			}
		}, 330)
	},
	{ immediate: true }
)
</script>

<template>
	<TaskPageLayout @edit="handleEditTask">
		<template #header>
			<div class="header-actions-row">
				<h2 class="week-title">Week View ({{ currentDates[0] }} - {{ currentDates[6] }})</h2>
			</div>
		</template>

		<DayView
			ref="dayViewRef"
			:dates="currentDates"
			:tasks-by-date="scheduledTasks"
			:start-hour="0"
			:end-hour="24"
			@create-task="handleOpenCreatePopup"
			@edit="handleEditTask"
		/>

		<template #popups>
			<TaskEditorPopup
				:show="showEditorPopup"
				:task="taskToEdit"
				:task-type="popupTaskType"
				:initial-start-time="initialStartTime"
				:initial-date="popupTargetDate"
				:start-compact="!taskToEdit"
				@close="handlePopupClose"
				@create="handleTaskCreate"
				@update="handleTaskUpdate"
			/>
		</template>
	</TaskPageLayout>
</template>

<style scoped>
.header-actions-row {
	display: flex;
	align-items: center;
	gap: 2rem;
	margin-bottom: 1rem;
}

.week-title {
	margin: 0;
	color: var(--text-light);
	font-size: 1.2rem;
}
</style>
