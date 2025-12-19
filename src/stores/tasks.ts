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
        tasks.value.filter(task => task.startTime === null && !task.isShortcut)
    )

    const shortcutTasks = computed(() =>
        tasks.value.filter(task => task.isShortcut === true)
    )

    const getTaskById = computed(() => (id: number) =>
        tasks.value.find(task => task.id === id)
    )

    // Actions
    const loadTasks = async () => {
        loading.value = true
        error.value = null
        try {
            tasks.value = await taskApi.getTasks()
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
        const newTask: Task = {
            ...taskData,
            id: tempId
        }
        tasks.value.push(newTask)

        // Sync to backend in background
        taskApi.createTask(taskData)
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
        unscheduleTask
    }
})
