import { ref, watch } from 'vue'
import { useTasksStore } from '../stores/tasks'
import { useUIStore } from '../stores/ui'
import { formatDate, getTimeSnapped } from '../utils/dateUtils'
import type { Task } from '../types'

export function useTaskEditor() {
	const tasksStore = useTasksStore()
	const uiStore = useUIStore()

	// Popup visibility state
	const showEditorPopup = ref(false)
	const initialStartTime = ref<number | null>(null)
	const taskToEdit = ref<Task | null>(null)
	const popupTaskType = ref<'scheduled' | 'todo' | 'shortcut'>('scheduled')
	const popupTargetDate = ref<string | null>(null)

	// Watch for global trigger
	watch(
		() => uiStore.createTaskTrigger,
		() => {
			handleOpenCreatePopup()
		}
	)

	// Handlers
	const handleOpenCreatePopup = (payload?: { startTime: number; date?: string }) => {
		taskToEdit.value = null
		initialStartTime.value = payload?.startTime ?? getTimeSnapped()
		popupTargetDate.value = payload?.date ?? formatDate(new Date())
		popupTaskType.value = 'scheduled'
		showEditorPopup.value = true
	}

	const handleEditTask = (task: Task) => {
		taskToEdit.value = task
		if (task.startTime !== null && task.startTime !== undefined) {
			popupTaskType.value = 'scheduled'
		} else if (task.isShortcut) {
			popupTaskType.value = 'shortcut'
		} else {
			popupTaskType.value = 'todo'
		}
		showEditorPopup.value = true
	}

	const handleTaskCreate = (payload: {
		text: string
		description: string
		category: string
		isDeepWork: boolean
		startTime?: number | null
		duration?: number
		date?: string | null
	}) => {
		tasksStore.createScheduledTask({
			text: payload.text,
			description: payload.description,
			category: payload.category,
			completed: false,
			startTime: payload.startTime ?? null,
			duration: payload.duration ?? 60,
			date: payload.date || popupTargetDate.value || tasksStore.currentDates[0],
			isShortcut: false,
			isDeepWork: payload.isDeepWork,
			order: 0,
			color: null
		} as any)
		showEditorPopup.value = false
	}

	const handleTaskUpdate = (payload: { id: string | number; updates: Partial<Task> }) => {
		const task = tasksStore.getTaskById(payload.id)
		if (!task) return
		if (task.startTime !== null && task.startTime !== undefined) {
			tasksStore.updateScheduledTask(task.id, task.date!, payload.updates)
		} else if (task.isShortcut) {
			tasksStore.updateShortcut(task.id, payload.updates)
		} else {
			tasksStore.updateTodo(task.id, payload.updates)
		}
		showEditorPopup.value = false
	}

	const handlePopupClose = () => {
		showEditorPopup.value = false
		taskToEdit.value = null
		popupTargetDate.value = null
	}

	return {
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
	}
}
