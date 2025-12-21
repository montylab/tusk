import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Task } from '../types'
import * as firebaseService from '../services/firebaseService'
import { useUserStore } from './user'

export const useTasksStore = defineStore('tasks', () => {
    const userStore = useUserStore()

    // --- State ---
    const tasks = ref<Task[]>([]) // Merged view for read-only access

    // Internal separate states
    const calendarTasksState = ref<Task[]>([])
    const todoTasksState = ref<Task[]>([])
    const shortcutsTasksState = ref<Task[]>([])

    const currentDate = ref(new Date().toISOString().split('T')[0])

    const categoryColors = ref<Record<string, string>>({
        Work: 'var(--color-work)',
        Personal: 'var(--color-personal)',
        Urgent: 'var(--color-urgent)',
        Learning: 'var(--color-learning)',
        Default: 'var(--color-default)'
    })
    const loading = ref(false)
    const error = ref<string | null>(null)

    let unsubs: (() => void)[] = []

    // --- Getters ---
    const scheduledTasks = computed(() => calendarTasksState.value)
    const todoTasks = computed(() => todoTasksState.value.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
    const shortcutTasks = computed(() => shortcutsTasksState.value.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))

    const getTaskById = computed(() => (id: string | number) => {
        return calendarTasksState.value.find(t => t.id === id) ||
            todoTasksState.value.find(t => t.id === id) ||
            shortcutsTasksState.value.find(t => t.id === id)
    })

    // --- Sync Logic ---
    watch(() => userStore.user, (newUser) => {
        if (newUser) {
            setupSync()
        } else {
            clearState()
        }
    }, { immediate: true })

    function clearState() {
        calendarTasksState.value = []
        todoTasksState.value = []
        shortcutsTasksState.value = []
        tasks.value = []
        unsubs.forEach(u => u())
        unsubs = []
    }

    function setupSync() {
        clearState()
        loading.value = true

        // 1. Calendar (Today)
        unsubs.push(firebaseService.subscribeToDate(currentDate.value, (newTasks) => {
            calendarTasksState.value = newTasks
            updateMergedState()
        }))

        // 2. To-Do
        unsubs.push(firebaseService.subscribeToList('todo', (newTasks) => {
            todoTasksState.value = newTasks
            updateMergedState()
        }))

        // 3. Shortcuts
        unsubs.push(firebaseService.subscribeToList('shortcuts', (newTasks) => {
            shortcutsTasksState.value = newTasks
            updateMergedState()
        }))

        loading.value = false
    }

    function updateMergedState() {
        tasks.value = [...calendarTasksState.value, ...todoTasksState.value, ...shortcutsTasksState.value]
    }

    // --- Creation Actions ---

    const createTodo = async (taskData: Omit<Task, 'id'>) => {
        try {
            const list = todoTasks.value
            const maxOrder = list.length > 0 ? Math.max(...list.map(t => t.order || 0)) : 0

            const defaults = {
                text: 'New To-Do',
                category: 'Default',
                completed: false,
                startTime: null,
                duration: 60,
                isShortcut: false,
                order: maxOrder + 10000,
                date: undefined // Not relevant for todo
            }

            const finalTaskData = { ...defaults, ...taskData }
            return await firebaseService.createTaskInPath('todo', finalTaskData)
        } catch (err) {
            console.error(err)
            error.value = 'Failed to create todo'
        }
    }

    const createShortcut = async (taskData: Omit<Task, 'id'>) => {
        try {
            const list = shortcutTasks.value
            const maxOrder = list.length > 0 ? Math.max(...list.map(t => t.order || 0)) : 0

            const defaults = {
                text: 'New Shortcut',
                category: 'Default',
                completed: false,
                startTime: null,
                duration: 60,
                isShortcut: true,
                order: maxOrder + 10000,
                date: undefined
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
                date: currentDate.value
            }

            const finalTaskData = { ...defaults, ...taskData }
            return await firebaseService.createTaskInPath(`calendar/${currentDate.value}`, finalTaskData)
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

        await firebaseService.updateTaskInPath(`calendar/${date}`, id, updates)
    }

    // --- Move Actions (Atomic Transfer) ---

    const moveTodoToCalendar = async (id: string | number, date: string, startTime: number, duration: number) => {
        const task = todoTasksState.value.find(t => t.id === id)
        if (!task) {
            console.error('Task not found in todo list')
            return
        }

        // Logic: Delete from 'todo', create in 'calendar/date'
        const updates = { startTime, duration, date, isShortcut: false }
        await firebaseService.moveTask('todo', `calendar/${date}`, task, updates)
    }

    const moveCalendarToTodo = async (id: string | number, date: string) => {
        const task = calendarTasksState.value.find(t => t.id === id)
        if (!task) {
            console.error('Task not found in calendar')
            return
        }

        // Calculate temporary order for destination list (will be adjusted by reorder)
        const maxOrder = todoTasks.value.length > 0 ? Math.max(...todoTasks.value.map(t => t.order || 0)) : 0
        const tempOrder = maxOrder + 10000

        const updates = { startTime: null, date: null, isShortcut: false, order: tempOrder } as any
        await firebaseService.moveTask(`calendar/${date}`, 'todo', task, updates)
    }

    // Convert (Move) To-Do -> Shortcut
    const moveTodoToShortcut = async (id: string | number) => {
        const task = todoTasksState.value.find(t => t.id === id)
        if (!task) return

        // Calculate temporary order for destination list (will be adjusted by reorder)
        const maxOrder = shortcutTasks.value.length > 0 ? Math.max(...shortcutTasks.value.map(t => t.order || 0)) : 0
        const tempOrder = maxOrder + 10000

        const updates = { startTime: null, date: null, isShortcut: true, completed: false, order: tempOrder } as any
        await firebaseService.moveTask('todo', 'shortcuts', task, updates)
    }

    // Convert (Move) Calendar -> Shortcut
    const moveCalendarToShortcut = async (id: string | number, date: string) => {
        const task = calendarTasksState.value.find(t => t.id === id)
        if (!task) return

        // Calculate temporary order for destination list (will be adjusted by reorder)
        const maxOrder = shortcutTasks.value.length > 0 ? Math.max(...shortcutTasks.value.map(t => t.order || 0)) : 0
        const tempOrder = maxOrder + 10000

        const updates = { startTime: null, date: null, isShortcut: true, completed: false, order: tempOrder } as any
        await firebaseService.moveTask(`calendar/${date}`, 'shortcuts', task, updates)
    }

    // --- Copy Actions (Templates) ---

    const copyShortcutToTodo = async (id: string | number) => {
        const shortcut = shortcutsTasksState.value.find(t => t.id === id)
        if (!shortcut) return

        const { id: _, ...data } = shortcut
        return await createTodo({ ...data, isShortcut: false, startTime: null, date: null })
    }

    const copyShortcutToCalendar = async (id: string | number, date: string, startTime: number, duration: number) => {
        const shortcut = shortcutsTasksState.value.find(t => t.id === id)
        if (!shortcut) return

        const { id: _, ...data } = shortcut
        // We use createTaskInPath directly instead of createTodo to go straight to calendar
        return await firebaseService.createTaskInPath(`calendar/${date}`, {
            ...data,
            isShortcut: false,
            date,
            startTime,
            duration
        })
    }

    // --- Delete Actions ---

    const deleteTodo = async (id: string | number) => {
        await firebaseService.deleteTaskFromPath('todo', id)
    }

    const deleteShortcut = async (id: string | number) => {
        await firebaseService.deleteTaskFromPath('shortcuts', id)
    }

    const deleteScheduledTask = async (id: string | number, date: string) => {
        await firebaseService.deleteTaskFromPath(`calendar/${date}`, id)
    }

    // --- Legacy / Helper for Reordering (Optional, generic reorder is tricky with explicit paths) ---
    // We can implement specific reorders
    const calculateNewOrder = (list: Task[], taskId: string | number, targetIndex: number): number => {
        // Removing the task we are moving to check neighbors accurately
        const filtered = list.filter(t => t.id !== taskId)



        if (targetIndex === 0) {
            // Moving to top
            if (filtered.length === 0) return 10000
            return (filtered[0].order || 0) / 2
        } else if (targetIndex >= filtered.length) {
            // Moving to bottom
            const last = filtered[filtered.length - 1]
            return (last.order || 0) + 10000
        } else {
            // Moving between two items
            const prev = filtered[targetIndex - 1]
            const next = filtered[targetIndex]
            return ((prev.order || 0) + (next.order || 0)) / 2
        }
    }

    // Explicit reorder that takes a target INDEX (not order value)
    const reorderTodo = (id: string | number, targetIndex: number) => {
        const newOrder = calculateNewOrder(todoTasks.value, id, targetIndex)
        updateTodo(id, { order: newOrder })
    }
    const reorderShortcut = (id: string | number, targetIndex: number) => {
        const newOrder = calculateNewOrder(shortcutTasks.value, id, targetIndex)
        updateShortcut(id, { order: newOrder })
    }

    return {
        // State
        tasks,
        categoryColors,
        loading,
        error,
        currentDate, // Export to allow changing the "viewed" date

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

        reorderTodo,
        reorderShortcut
    }
})
