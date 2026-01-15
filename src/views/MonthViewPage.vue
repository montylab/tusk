<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import TaskPageLayout from '../components/TaskPageLayout.vue'
import TaskEditorPopup from '../components/TaskEditorPopup.vue'
import MonthCalendar from '../components/MonthCalendar.vue'
import { useTasksStore } from '../stores/tasks'
import { useTaskEditor } from '../composables/useTaskEditor'
import { getMonthCalendarGrid } from '../utils/dateUtils'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()
const { scheduledTasks } = storeToRefs(tasksStore)

// Current viewing year/month
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

// Task editor composable
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

// Parse route params to get year/month
const parseRouteDate = () => {
	const { date, year, month, day } = route.params

	if (year && month) {
		// /month/2025/01 or /month/2025/01/26
		viewYear.value = parseInt(year as string, 10)
		viewMonth.value = parseInt(month as string, 10) - 1 // Convert to 0-indexed
	} else {
		// /month (no params - use current date)
		const now = new Date()
		viewYear.value = now.getFullYear()
		viewMonth.value = now.getMonth()
	}
}

// Update store's currentDates to include all days in the calendar grid
const updateCurrentDates = () => {
	const grid = getMonthCalendarGrid(viewYear.value, viewMonth.value)
	const allDates = grid.flat()
	tasksStore.currentDates = allDates
}

// Navigation
const goToPrevMonth = () => {
	if (viewMonth.value === 0) {
		viewMonth.value = 11
		viewYear.value--
	} else {
		viewMonth.value--
	}
	updateRoute()
}

const goToNextMonth = () => {
	if (viewMonth.value === 11) {
		viewMonth.value = 0
		viewYear.value++
	} else {
		viewMonth.value++
	}
	updateRoute()
}

const updateRoute = () => {
	router.push({
		name: 'month-ym',
		params: {
			year: viewYear.value.toString(),
			month: (viewMonth.value + 1).toString().padStart(2, '0')
		}
	})
}

// Create task handler
const handleCreateTask = (payload: { date: string }) => {
	handleOpenCreatePopup({ startTime: 9, date: payload.date })
}

// Watch route changes
watch(
	() => [route.params.date, route.params.year, route.params.month, route.params.day],
	() => {
		parseRouteDate()
		updateCurrentDates()
	},
	{ immediate: true }
)
</script>

<template>
	<TaskPageLayout @edit="handleEditTask">
		<MonthCalendar
			:year="viewYear"
			:month="viewMonth"
			:tasks-by-date="scheduledTasks"
			@create-task="handleCreateTask"
			@edit-task="handleEditTask"
			@prev-month="goToPrevMonth"
			@next-month="goToNextMonth"
		/>

		<template #popups>
			<TaskEditorPopup
				:show="showEditorPopup"
				:task="taskToEdit"
				:task-type="popupTaskType"
				:initial-start-time="initialStartTime"
				:initial-date="popupTargetDate"
				@close="handlePopupClose"
				@create="handleTaskCreate"
				@update="handleTaskUpdate"
			/>
		</template>
	</TaskPageLayout>
</template>

<style scoped>
/* Month view uses full layout from TaskPageLayout and MonthCalendar */
</style>
