<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import DayView from '../components/DayView.vue'
import TaskPageLayout from '../components/TaskPageLayout.vue'
import TaskEditorPopup from '../components/TaskEditorPopup.vue'
import { useTasksStore } from '../stores/tasks'
import { useTimeBoundaries } from '../composables/useTimeBoundaries'
import { useTaskEditor } from '../composables/useTaskEditor'
import { formatDate } from '../utils/dateUtils'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()
const { onDayChange } = useTimeBoundaries()

onDayChange((newDate) => {
	router.push({ name: 'day', params: { date: newDate } })
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
	(newDate, oldDate) => {
		if (newDate && typeof newDate === 'string') {
			tasksStore.currentDates = [newDate]
		} else {
			const today = formatDate(new Date())
			tasksStore.currentDates = [today]
		}

		if (newDate !== oldDate) {
			nextTick(() => {
				dayViewRef.value?.scrollToTop()
			})
		}
	},
	{ immediate: true }
)

const handleAddDay = () => {
	const lastDateStr = currentDates.value[currentDates.value.length - 1]
	const lastDate = new Date(lastDateStr)
	const nextDate = new Date(lastDate)
	nextDate.setDate(lastDate.getDate() + 1)
	const nextDateStr = nextDate.toISOString().split('T')[0]
	tasksStore.addDate(nextDateStr)
}
</script>

<template>
	<TaskPageLayout @edit="handleEditTask">
		<template #header>
			<button class="create-btn" @click="handleOpenCreatePopup()">Create Task</button>
		</template>

		<DayView
			ref="dayViewRef"
			:dates="currentDates"
			:tasks-by-date="scheduledTasks"
			:start-hour="0"
			:end-hour="24"
			@create-task="handleOpenCreatePopup"
			@edit="handleEditTask"
			@add-day="handleAddDay"
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
.create-btn {
	margin-bottom: 1rem;
	padding: 0.5rem 1rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.create-btn:hover {
	filter: brightness(1.1);
	transform: translateY(-1px);
}
</style>
