import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task } from '../types'
import * as taskApi from '../services/taskApi'

export const useTasksStore = defineStore('tasks', () => {
    // State
    const tasks = ref<Task[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const scheduledTasks = computed(() =>
        tasks.value.filter(task => task.startTime !== null && !task.isShortcut)
    )

    const todoTasks = computed(() =>
        tasks.value
            .filter(task => task.startTime === null && !task.isShortcut)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    )

    const shortcutTasks = computed(() =>
        tasks.value
            .filter(task => task.isShortcut === true)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    )

    const getTaskById = computed(() => (id: number) =>
        tasks.value.find(task => task.id === id)
    )

    // Actions
    const loadTasks = async () => {
        loading.value = true
        error.value = null
        try {
            const fetchedTasks = await taskApi.getTasks()
            // Normalize order for legacy tasks or tasks starting at 0
            // We want unique, incrementing orders based on their original arrival
            tasks.value = fetchedTasks.map((t, i) => ({
                ...t,
                order: t.order ?? (i * 10)
            }))
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to load tasks'
            console.error('Error loading tasks:', err)
        } finally {
            loading.value = false
        }
    }

    const createTask = (taskData: Omit<Task, 'id'>) => {
        // Optimistic update: create task immediately with temporary ID
        const tempId = Date.now()
        // Ensure new task has an order
        const list = taskData.isShortcut ? shortcutTasks.value : todoTasks.value
        const maxOrder = list.length > 0 ? Math.max(...list.map(t => t.order || 0)) : 0

        const newTask: Task = {
            ...taskData,
            id: tempId,
            order: taskData.order ?? (maxOrder + 10)
        }
        tasks.value.push(newTask)

        // Sync to backend in background
        taskApi.createTask(newTask)
            .then(savedTask => {
                // Replace temp task with real one from backend
                const index = tasks.value.findIndex(t => t.id === tempId)
                if (index !== -1) {
                    tasks.value[index] = savedTask
                }
            })
            .catch(err => {
                error.value = err instanceof Error ? err.message : 'Failed to create task'
                console.error('Error creating task:', err)
                // Revert optimistic update on error
                tasks.value = tasks.value.filter(t => t.id !== tempId)
            })

        return newTask
    }

    const updateTask = (id: number, updates: Partial<Task>) => {
        // Find the task and store original state
        const index = tasks.value.findIndex(t => t.id === id)
        if (index === -1) return

        const originalTask = { ...tasks.value[index] }

        // Optimistic update: apply changes immediately
        tasks.value[index] = { ...tasks.value[index], ...updates }

        // Sync to backend in background
        taskApi.updateTask(id, updates)
            .catch(err => {
                error.value = err instanceof Error ? err.message : 'Failed to update task'
                console.error('Error updating task:', err)
                // Revert to original state on error
                const currentIndex = tasks.value.findIndex(t => t.id === id)
                if (currentIndex !== -1) {
                    tasks.value[currentIndex] = originalTask
                }
            })
    }

    const deleteTask = (id: number) => {
        // Store original state for potential revert
        const originalTask = tasks.value.find(t => t.id === id)

        // Optimistic update: remove immediately
        tasks.value = tasks.value.filter(t => t.id !== id)

        // Sync to backend in background
        taskApi.deleteTask(id)
            .catch(err => {
                error.value = err instanceof Error ? err.message : 'Failed to delete task'
                console.error('Error deleting task:', err)
                // Revert: add task back on error
                if (originalTask) {
                    tasks.value.push(originalTask)
                }
            })
    }

    const scheduleTask = (id: number, startTime: number, duration?: number) => {
        const updates: Partial<Task> = { startTime }
        if (duration !== undefined) {
            updates.duration = duration
        }
        updateTask(id, updates)
    }

    const unscheduleTask = (id: number) => {
        updateTask(id, { startTime: null })
    }

    const convertToTodo = (id: number) => {
        updateTask(id, { startTime: null, isShortcut: false })
    }

    const convertToShortcut = (id: number) => {
        const original = getTaskById.value(id)
        if (!original) return

        // Create a new shortcut template from the task
        const { id: _, ...taskData } = original
        createTask({
            ...taskData,
            startTime: null,
            isShortcut: true,
            completed: false
        })

        // Remove the original calendar task
        deleteTask(id)
    }

    const reorderTask = (id: number, targetIndex: number, listType: 'todo' | 'shortcut') => {
        const list = listType === 'todo' ? todoTasks.value : shortcutTasks.value
        const otherTasks = list.filter(t => t.id !== id)

        let newOrder: number
        if (otherTasks.length === 0) {
            newOrder = 10
        } else if (targetIndex <= 0) {
            newOrder = (otherTasks[0].order ?? 0) - 10
        } else if (targetIndex >= otherTasks.length) {
            newOrder = (otherTasks[otherTasks.length - 1].order ?? 0) + 10
        } else {
            const prev = otherTasks[targetIndex - 1].order ?? 0
            const next = otherTasks[targetIndex].order ?? 0

            if (prev === next) {
                // Should not happen with normalized data, but as a fallback
                newOrder = prev + 0.5
            } else {
                newOrder = (prev + next) / 2
            }
        }

        updateTask(id, { order: newOrder })
    }

    return {
        // State
        tasks,
        loading,
        error,
        // Getters
        scheduledTasks,
        todoTasks,
        shortcutTasks,
        getTaskById,
        // Actions
        loadTasks,
        createTask,
        updateTask,
        deleteTask,
        scheduleTask,
        unscheduleTask,
        convertToTodo,
        convertToShortcut,
        reorderTask
    }
})
