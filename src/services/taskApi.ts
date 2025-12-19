import type { Task } from '../types'

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// LocalStorage key
const STORAGE_KEY = 'tasktracker_tasks'

// Initial seed data
const INITIAL_TASKS: Task[] = [
    { id: 1, text: 'Design the UI', completed: false, category: 'Work', startTime: 9, duration: 60 },
    { id: 3, text: 'Client Meeting', completed: false, category: 'Work', startTime: 10, duration: 30 },
    { id: 4, text: 'Gym', completed: false, category: 'Personal', startTime: 18.25, duration: 45 },
    { id: 101, text: 'Brainstorming', category: 'Work', duration: 30, completed: false, startTime: null, isShortcut: true },
    { id: 102, text: 'Code Review', category: 'Work', duration: 45, completed: false, startTime: null, isShortcut: true },
    { id: 103, text: 'Quick Workout', category: 'Personal', duration: 15, completed: false, startTime: null, isShortcut: true },
    { id: 104, text: 'Email Batching', category: 'Work', duration: 20, completed: false, startTime: null, isShortcut: true },
    { id: 201, text: 'Submit Expense Report', category: 'Work', duration: 15, completed: false, startTime: null },
    { id: 202, text: 'Buy Groceries', category: 'Personal', duration: 45, completed: false, startTime: null },
    { id: 203, text: 'Prepare Slides for Demo', category: 'Urgent', duration: 30, completed: false, startTime: null },
]

// Initialize localStorage if empty
const initializeStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS))
    }
}

// Get all tasks from localStorage
export const getTasks = async (): Promise<Task[]> => {
    await delay(300) // Simulate network delay
    initializeStorage()
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
}

// Create a new task
export const createTask = async (task: Partial<Task>): Promise<Task> => {
    await delay(200)
    const tasks = await getTasks()
    const newTask: Task = {
        text: 'New Task',
        category: 'Default',
        completed: false,
        startTime: null,
        duration: 60,
        ...task,
        id: task.id || Date.now()
    } as Task
    tasks.push(newTask)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    return newTask
}

// Update an existing task
export const updateTask = async (id: number, updates: Partial<Task>): Promise<Task> => {
    await delay(200)
    const tasks = await getTasks()
    const index = tasks.findIndex(t => t.id === id)
    if (index === -1) {
        throw new Error(`Task with id ${id} not found`)
    }
    tasks[index] = { ...tasks[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    return tasks[index]
}

// Delete a task
export const deleteTask = async (id: number): Promise<void> => {
    await delay(200)
    const tasks = await getTasks()
    const filtered = tasks.filter(t => t.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}
