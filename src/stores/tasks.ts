import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Task } from '../types'
import * as firebaseService from '../services/firebaseService'
import * as taskService from '../services/taskService'
import { useUserStore } from './user'
import { formatDate } from '../utils/dateUtils'
import { nerve, NERVE_EVENTS } from '../services/nerve'

export const useTasksStore = defineStore('tasks', () => {
	const userStore = useUserStore()

	// --- State ---
	const tasks = ref<Task[]>([]) // Merged view for read-only access

	// Internal separate states
	const calendarTasksState = ref<Record<string, Task[]>>({})
	const todoTasksState = ref<Task[]>([])
	const shortcutsTasksState = ref<Task[]>([])

	const currentDates = ref<string[]>([formatDate(new Date())])

	const loading = ref(false)
	const error = ref<string | null>(null)

	let unsubs: (() => void)[] = []
	const calendarUnsubs = new Map<string, () => void>()

	// --- Getters ---
	const scheduledTasks = computed(() => calendarTasksState.value)
	const todoTasks = computed(() => todoTasksState.value.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
	const shortcutTasks = computed(() => shortcutsTasksState.value.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))

	const getTaskById = computed(() => (id: string | number) => {
		// Search in all dates
		for (const dateTasks of Object.values(calendarTasksState.value)) {
			const found = dateTasks.find((t) => t.id === id)
			if (found) return found
		}
		return todoTasksState.value.find((t) => t.id === id) || shortcutsTasksState.value.find((t) => t.id === id)
	})

	// --- Sync Logic ---
	watch(
		() => userStore.user,
		(newUser) => {
			if (newUser) {
				setupSync()
			} else {
				clearState()
			}
		},
		{ immediate: true }
	)

	// Watch currentDates and manage subscriptions
	watch(
		currentDates,
		(newDates) => {
			if (!userStore.user) return

			newDates.forEach((date) => {
				if (!calendarUnsubs.has(date)) {
					subscribeToCalendarDate(date)
				}
			})

			for (const date of calendarUnsubs.keys()) {
				if (!newDates.includes(date)) {
					unsubscribeFromCalendarDate(date)
				}
			}
		},
		{ deep: true }
	)

	function clearState() {
		calendarTasksState.value = {}
		todoTasksState.value = []
		shortcutsTasksState.value = []
		tasks.value = []
		unsubs.forEach((u) => u())
		unsubs = []
		calendarUnsubs.clear()
	}

	function setupSync() {
		clearState()
		loading.value = true

		currentDates.value.forEach((date) => subscribeToCalendarDate(date))

		unsubs.push(
			firebaseService.subscribeToList('todo', (newTasks) => {
				todoTasksState.value = newTasks
				updateMergedState()
			})
		)

		unsubs.push(
			firebaseService.subscribeToList('shortcuts', (newTasks) => {
				shortcutsTasksState.value = newTasks
				updateMergedState()
			})
		)

		loading.value = false
	}

	function subscribeToCalendarDate(date: string) {
		if (calendarUnsubs.has(date)) return

		const unsub = firebaseService.subscribeToDate(date, (newTasks) => {
			calendarTasksState.value = {
				...calendarTasksState.value,
				[date]: newTasks
			}
			updateMergedState()
		})
		calendarUnsubs.set(date, unsub)
	}

	function unsubscribeFromCalendarDate(date: string) {
		const unsub = calendarUnsubs.get(date)
		if (unsub) {
			unsub()
			calendarUnsubs.delete(date)
			const newState = { ...calendarTasksState.value }
			delete newState[date]
			calendarTasksState.value = newState
			updateMergedState()
		}
	}

	function updateMergedState() {
		const allCalendarTasks = Object.values(calendarTasksState.value).flat()
		tasks.value = [...allCalendarTasks, ...todoTasksState.value, ...shortcutsTasksState.value]
	}

	// --- Helpers ---

	const calculateNewOrder = (list: Task[], targetIndex: number): number => {
		const sortedList = list.sort((a, b) => (a.order || 0) - (b.order || 0))

		if (targetIndex === 0) {
			if (sortedList.length === 0) return 10000
			return (sortedList[0].order || 0) / 2
		} else if (targetIndex >= sortedList.length) {
			const last = sortedList[sortedList.length - 1]
			return (last.order || 0) + 10000
		} else {
			const prev = sortedList[targetIndex - 1]
			const next = sortedList[targetIndex]
			return ((prev.order || 0) + (next.order || 0)) / 2
		}
	}

	const getMaxOrder = (list: Task[]): number => {
		return list.length > 0 ? Math.max(...list.map((t) => t.order || 0)) : 0
	}

	// --- Actions (thin delegation to taskService) ---

	const createTodo = async (taskData: Omit<Task, 'id'>) => {
		try {
			const order = getMaxOrder(todoTasks.value) + 10000
			return await taskService.createTodo({ ...taskData, order })
		} catch (err) {
			console.error(err)
			error.value = 'Failed to create todo'
		}
	}

	const createShortcut = async (taskData: Omit<Task, 'id'>) => {
		try {
			const order = getMaxOrder(shortcutTasks.value) + 10000
			return await taskService.createShortcut({ ...taskData, order })
		} catch (err) {
			console.error(err)
			error.value = 'Failed to create shortcut'
		}
	}

	const createScheduledTask = async (taskData: Omit<Task, 'id'>) => {
		try {
			const date = taskData.date || currentDates.value[0]
			return await taskService.createScheduledTask(taskData, date)
		} catch (err) {
			console.error(err)
			error.value = 'Failed to create scheduled task'
		}
	}

	const updateTodo = async (id: string | number, updates: Partial<Task>) => {
		await taskService.updateTodo(id, updates)
	}

	const updateShortcut = async (id: string | number, updates: Partial<Task>) => {
		await taskService.updateShortcut(id, updates)
	}

	const updateScheduledTask = async (id: string | number, date: string, updates: Partial<Task>) => {
		const existingTask = calendarTasksState.value[date]?.find((t) => t.id === id)
		if (!existingTask) {
			console.error('Task not found for stat update')
			return
		}
		await taskService.updateScheduledTask(id, date, updates, existingTask)
	}

	const moveTodoToCalendar = async (id: string | number, date: string, startTime: number, duration: number) => {
		const task = todoTasksState.value.find((t) => t.id === id)
		if (!task) {
			console.error('Task not found in todo list')
			return
		}
		await taskService.moveTodoToCalendar(task, date, startTime, duration)
	}

	const moveCalendarToTodo = async (id: string | number, date: string, order?: number) => {
		const task = calendarTasksState.value[date]?.find((t) => t.id === id)
		if (!task) {
			console.error('Task not found in calendar')
			return
		}
		const finalOrder = order !== undefined ? order : getMaxOrder(todoTasks.value) + 10000
		await taskService.moveCalendarToTodo(task, date, finalOrder)
	}

	const moveTodoToShortcut = async (id: string | number, order?: number) => {
		const task = todoTasksState.value.find((t) => t.id === id)
		if (!task) return
		const finalOrder = order !== undefined ? order : getMaxOrder(shortcutTasks.value) + 10000
		await taskService.moveTodoToShortcut(task, finalOrder)
	}

	const moveCalendarToShortcut = async (id: string | number, date: string, order?: number) => {
		const task = calendarTasksState.value[date]?.find((t) => t.id === id)
		if (!task) return
		const finalOrder = order !== undefined ? order : getMaxOrder(shortcutTasks.value) + 10000
		await taskService.moveCalendarToShortcut(task, date, finalOrder)
	}

	const moveScheduledTask = async (id: string | number, fromDate: string, toDate: string, updates: Partial<Task>) => {
		const task = calendarTasksState.value[fromDate]?.find((t) => t.id === id)
		if (!task) {
			console.error('Task not found in source date')
			return
		}
		await taskService.moveScheduledTask(task, fromDate, toDate, updates)
	}

	const copyShortcutToTodo = async (id: string | number, order?: number) => {
		const shortcut = shortcutsTasksState.value.find((t) => t.id === id)
		if (!shortcut) return
		const finalOrder = order !== undefined ? order : getMaxOrder(todoTasks.value) + 10000
		return await taskService.copyShortcutToTodo(shortcut, finalOrder)
	}

	const copyShortcutToCalendar = async (id: string | number, date: string, startTime: number, duration: number) => {
		const shortcut = shortcutsTasksState.value.find((t) => t.id === id)
		if (!shortcut) return
		return await taskService.copyShortcutToCalendar(shortcut, date, startTime, duration)
	}

	const deleteTodo = async (id: string | number) => {
		await taskService.deleteTodo(id)
	}

	const deleteShortcut = async (id: string | number) => {
		await taskService.deleteShortcut(id)
	}

	const deleteScheduledTask = async (id: string | number, date: string) => {
		const task = calendarTasksState.value[date]?.find((t) => t.id === id)
		await taskService.deleteScheduledTask(id, date, task)
	}

	const reorderTodo = (id: string | number, targetIndex: number) => {
		const finalOrder = calculateNewOrder(todoTasks.value, targetIndex)
		updateTodo(id, { order: finalOrder })
	}
	const reorderShortcut = (id: string | number, targetIndex: number) => {
		const finalOrder = calculateNewOrder(shortcutTasks.value, targetIndex)
		updateShortcut(id, { order: finalOrder })
	}

	return {
		// State
		tasks,
		calendarTasksState,
		todoTasksState,
		shortcutsTasksState,
		loading,
		error,
		currentDates,

		// Actions
		addDate(date: string) {
			if (!currentDates.value.includes(date)) {
				currentDates.value.push(date)
				subscribeToCalendarDate(date)
			}
		},
		removeDate(date: string) {
			const index = currentDates.value.indexOf(date)
			if (index > -1) {
				currentDates.value.splice(index, 1)
				unsubscribeFromCalendarDate(date)
			}
		},

		// Getters
		scheduledTasks,
		todoTasks,
		shortcutTasks,
		getTaskById,

		// Actions
		createTodo,
		createShortcut,
		createScheduledTask,

		updateTodo,
		updateShortcut,
		updateScheduledTask,

		moveTodoToCalendar,
		moveCalendarToTodo,
		moveTodoToShortcut,
		moveCalendarToShortcut,

		copyShortcutToTodo,
		copyShortcutToCalendar,

		deleteTodo,
		deleteShortcut,
		deleteScheduledTask,

		moveScheduledTask,

		reorderTodo,
		reorderShortcut,

		// Helpers
		calculateNewOrder,

		// Helper to generate temp IDs for Ctrl+Click duplicates
		generateTempId(): string {
			return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		}
	}
})
