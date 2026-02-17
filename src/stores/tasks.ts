import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Task } from '../types'
import * as firebaseService from '../services/firebaseService'
import { applyStatDelta, buildDelta, isDateInPast } from '../services/statsService'
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

			// Subscribe to new dates
			newDates.forEach((date) => {
				if (!calendarUnsubs.has(date)) {
					subscribeToCalendarDate(date)
				}
			})

			// Unsubscribe from removed dates (optional, but good for cleanup)
			// Actually, for DayView we probably want to keep them if they are still in view?
			// But DayViewPage replaces the array.
			// Let's unsubscribe from anything NOT in the new list.
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

		// 1. Calendar (Initial Dates)
		currentDates.value.forEach((date) => subscribeToCalendarDate(date))

		// 2. To-Do
		unsubs.push(
			firebaseService.subscribeToList('todo', (newTasks) => {
				todoTasksState.value = newTasks
				updateMergedState()
			})
		)

		// 3. Shortcuts
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

	// --- Creation Actions ---

	const createTodo = async (taskData: Omit<Task, 'id'>) => {
		try {
			const list = todoTasks.value
			const maxOrder = list.length > 0 ? Math.max(...list.map((t) => t.order || 0)) : 0

			const defaults = {
				text: 'New To-Do',
				category: 'Default',
				completed: false,
				startTime: null,
				duration: 60,
				isShortcut: false,
				order: maxOrder + 10000,
				// date: null, // Not relevant for todo
				isDeepWork: false
			}

			const finalTaskData = { ...defaults, ...taskData }
			const res = await firebaseService.createTaskInPath('todo', finalTaskData)
			nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: String(res.id || 'unknown') })
			return res
		} catch (err) {
			console.error(err)
			error.value = 'Failed to create todo'
		}
	}

	const createShortcut = async (taskData: Omit<Task, 'id'>) => {
		try {
			const list = shortcutTasks.value
			const maxOrder = list.length > 0 ? Math.max(...list.map((t) => t.order || 0)) : 0

			const defaults = {
				text: 'New Shortcut',
				category: 'Default',
				completed: false,
				startTime: null,
				duration: 60,
				isShortcut: true,
				order: maxOrder + 10000,
				date: null,
				isDeepWork: false
			}

			const finalTaskData = { ...defaults, ...taskData }
			return await firebaseService.createTaskInPath('shortcuts', finalTaskData)
		} catch (err) {
			console.error(err)
			error.value = 'Failed to create shortcut'
		}
	}

	const createScheduledTask = async (taskData: Omit<Task, 'id'>) => {
		try {
			const defaults = {
				text: 'New Event',
				category: 'Default',
				completed: false,
				startTime: 9,
				duration: 60,
				isShortcut: false,
				order: 0,
				date: taskData.date || currentDates.value[0],
				color: null,
				isDeepWork: false
			}

			const finalTaskData = { ...defaults, ...taskData, isCompleted: isDateInPast(taskData.date || defaults.date) }
			const date = finalTaskData.date
			const res = await firebaseService.createTaskInPath(`calendar/${date}`, finalTaskData)
			nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: String(res.id || 'unknown') })
			applyStatDelta(date!, buildDelta(finalTaskData)).catch(console.error)
			return res
		} catch (err) {
			console.error(err)
			error.value = 'Failed to create scheduled task'
		}
	}

	// --- Update Actions (In-Place) ---

	// Update properties of a To-Do item (text, category, order, completed)
	const updateTodo = async (id: string | number, updates: Partial<Task>) => {
		// Safety: Ensure we don't accidentally move it via generic properties
		// Verify it exists in todo list? We can, but firebase would just fail if path is wrong.
		if (updates.startTime !== undefined && updates.startTime !== null) {
			console.warn('Use moveTodoToCalendar to change startTime')
			return
		}
		await firebaseService.updateTaskInPath('todo', id, updates)
	}

	const updateShortcut = async (id: string | number, updates: Partial<Task>) => {
		await firebaseService.updateTaskInPath('shortcuts', id, updates)
	}

	const updateScheduledTask = async (id: string | number, date: string, updates: Partial<Task>) => {
		// Safety: If date changes, we need a move.
		if (updates.date && updates.date !== date) {
			console.warn('Use moveScheduledTaskToDate to change date')
			return
		}
		if (updates.startTime === null) {
			console.warn('Use moveCalendarToTodo to unschedule')
			return
		}

		// Stat adjustments for duration/category changes
		const existingTask = calendarTasksState.value[date]?.find((t) => t.id === id)
		if (existingTask) {
			const durationChanged = updates.duration !== undefined && updates.duration !== existingTask.duration
			const categoryChanged = updates.category !== undefined && updates.category !== existingTask.category
			if (durationChanged || categoryChanged) {
				// Subtract old, add new
				const oldDelta = buildDelta(existingTask, -1)
				const newTask = { ...existingTask, ...updates }
				const newDelta = buildDelta(newTask, 1)
				applyStatDelta(date, oldDelta).catch(console.error)
				applyStatDelta(date, newDelta).catch(console.error)
			}
		}

		await firebaseService.updateTaskInPath(`calendar/${date}`, id, updates)
		if (updates.completed === true) {
			nerve.emit(NERVE_EVENTS.TASK_COMPLETED, { taskId: String(id) })
		} else if (updates.completed === false) {
			nerve.emit(NERVE_EVENTS.TASK_UNCOMPLETED, { taskId: String(id) })
		}
	}

	// --- Move Actions (Atomic Transfer) ---

	const moveTodoToCalendar = async (id: string | number, date: string, startTime: number, duration: number) => {
		const task = todoTasksState.value.find((t) => t.id === id)
		if (!task) {
			console.error('Task not found in todo list')
			return
		}

		// Logic: Delete from 'todo', create in 'calendar/date'
		const updates = { startTime, duration, date, isShortcut: false, isCompleted: isDateInPast(date) }
		await firebaseService.moveTask('todo', `calendar/${date}`, task, updates)
		nerve.emit(NERVE_EVENTS.TASK_MOVED)
		applyStatDelta(date, buildDelta({ ...task, ...updates })).catch(console.error)
	}

	const moveCalendarToTodo = async (id: string | number, date: string, order?: number) => {
		const task = calendarTasksState.value[date]?.find((t) => t.id === id)
		if (!task) {
			console.error('Task not found in calendar')
			return
		}

		// Use provided order or calculate temporary order
		const finalOrder =
			order !== undefined ? order : todoTasks.value.length > 0 ? Math.max(...todoTasks.value.map((t) => t.order || 0)) + 10000 : 10000

		const updates = { startTime: null, date: null, isShortcut: false, order: finalOrder } as any
		await firebaseService.moveTask(`calendar/${date}`, 'todo', task, updates)
		applyStatDelta(date, buildDelta(task, -1)).catch(console.error)
	}

	// Convert (Move) To-Do -> Shortcut
	const moveTodoToShortcut = async (id: string | number, order?: number) => {
		const task = todoTasksState.value.find((t) => t.id === id)
		if (!task) return

		// Use provided order or calculate temporary order
		const finalOrder =
			order !== undefined
				? order
				: shortcutTasks.value.length > 0
					? Math.max(...shortcutTasks.value.map((t) => t.order || 0)) + 10000
					: 10000

		const updates = {
			startTime: null,
			date: null,
			isShortcut: true,
			completed: false,
			order: finalOrder
		} as any
		await firebaseService.moveTask('todo', 'shortcuts', task, updates)
	}

	// Convert (Move) Calendar -> Shortcut
	const moveCalendarToShortcut = async (id: string | number, date: string, order?: number) => {
		const task = calendarTasksState.value[date]?.find((t) => t.id === id)
		if (!task) return

		// Use provided order or calculate temporary order
		const finalOrder =
			order !== undefined
				? order
				: shortcutTasks.value.length > 0
					? Math.max(...shortcutTasks.value.map((t) => t.order || 0)) + 10000
					: 10000

		const updates = {
			startTime: null,
			date: null,
			isShortcut: true,
			completed: false,
			order: finalOrder
		} as any
		await firebaseService.moveTask(`calendar/${date}`, 'shortcuts', task, updates)
		applyStatDelta(date, buildDelta(task, -1)).catch(console.error)
	}

	const moveScheduledTask = async (id: string | number, fromDate: string, toDate: string, updates: Partial<Task>) => {
		const task = calendarTasksState.value[fromDate]?.find((t) => t.id === id)
		if (!task) {
			console.error('Task not found in source date')
			return
		}

		// Logic: Delete from 'calendar/fromDate', create in 'calendar/toDate'
		// We must include all existing data plus updates
		const moveUpdates = {
			...updates,
			date: toDate,
			isShortcut: false
		}

		await firebaseService.moveTask(`calendar/${fromDate}`, `calendar/${toDate}`, task, moveUpdates)
		nerve.emit(NERVE_EVENTS.TASK_MOVED)
		// Subtract from old date, add to new date
		applyStatDelta(fromDate, buildDelta(task, -1)).catch(console.error)
		applyStatDelta(toDate, buildDelta({ ...task, ...moveUpdates })).catch(console.error)
	}

	// --- Copy Actions (Templates) ---

	const copyShortcutToTodo = async (id: string | number, order?: number) => {
		const shortcut = shortcutsTasksState.value.find((t) => t.id === id)
		if (!shortcut) return

		const { id: _, ...data } = shortcut
		const taskData = { ...data, isShortcut: false, startTime: null, date: null }

		// If order is provided, use it directly instead of letting createTodo calculate
		if (order !== undefined) {
			const res = await firebaseService.createTaskInPath('todo', { ...taskData, order })
			nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: String(res.id || 'unknown') })
			return res
		}

		return await createTodo(taskData)
	}

	const copyShortcutToCalendar = async (id: string | number, date: string, startTime: number, duration: number) => {
		const shortcut = shortcutsTasksState.value.find((t) => t.id === id)
		if (!shortcut) return

		const { id: _, ...data } = shortcut
		const taskData = { ...data, isShortcut: false, date, startTime, duration, isCompleted: isDateInPast(date) }
		const res = await firebaseService.createTaskInPath(`calendar/${date}`, taskData)
		nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: String(res.id || 'unknown') })
		applyStatDelta(date, buildDelta(taskData)).catch(console.error)
		return res
	}

	// --- Delete Actions ---

	const deleteTodo = async (id: string | number) => {
		await firebaseService.deleteTaskFromPath('todo', id)
		nerve.emit(NERVE_EVENTS.TASK_DELETED)
	}

	const deleteShortcut = async (id: string | number) => {
		await firebaseService.deleteTaskFromPath('shortcuts', id)
		nerve.emit(NERVE_EVENTS.TASK_DELETED)
	}

	const deleteScheduledTask = async (id: string | number, date: string) => {
		const task = calendarTasksState.value[date]?.find((t) => t.id === id)
		await firebaseService.deleteTaskFromPath(`calendar/${date}`, id)
		nerve.emit(NERVE_EVENTS.TASK_DELETED)
		if (task) {
			applyStatDelta(date, buildDelta(task, -1)).catch(console.error)
		}
	}

	// --- Legacy / Helper for Reordering (Optional, generic reorder is tricky with explicit paths) ---
	// We can implement specific reorders
	const calculateNewOrder = (list: Task[], targetIndex: number): number => {
		const sortedList = list.sort((a, b) => (a.order || 0) - (b.order || 0))

		if (targetIndex === 0) {
			// Moving to top
			if (sortedList.length === 0) return 10000
			return (sortedList[0].order || 0) / 2
		} else if (targetIndex >= sortedList.length) {
			// Moving to bottom
			const last = sortedList[sortedList.length - 1]
			return (last.order || 0) + 10000
		} else {
			// Moving between two items
			const prev = sortedList[targetIndex - 1]
			const next = sortedList[targetIndex]
			return ((prev.order || 0) + (next.order || 0)) / 2
		}
	}

	// Explicit reorder that takes a target INDEX (not order value)
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
