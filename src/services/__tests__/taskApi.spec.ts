import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as taskApi from '../taskApi'

const STORAGE_KEY = 'tasktracker_tasks'

describe('taskApi', () => {
	beforeEach(() => {
		localStorage.clear()
		vi.clearAllMocks()
	})

	describe('Initialization', () => {
		it('seeds localStorage with initial tasks if empty', async () => {
			const tasks = await taskApi.getTasks()
			expect(tasks.length).toBeGreaterThan(0)
			expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()

			// Check specific seed data
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
			expect(stored.find((t: any) => t.text === 'Design the UI')).toBeTruthy()
		})

		it('does not overwrite existing data', async () => {
			const preExisting = [{ id: 999, text: 'Existing' }]
			localStorage.setItem(STORAGE_KEY, JSON.stringify(preExisting))

			const tasks = await taskApi.getTasks()
			expect(tasks).toHaveLength(1)
			expect(tasks[0].id).toBe(999)
		})
	})

	describe('CRUD', () => {
		it('createTask adds to storage', async () => {
			const newTask = await taskApi.createTask({ text: 'New Item' })

			expect(newTask.id).toBeDefined()
			expect(newTask.text).toBe('New Item')

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
			expect(stored).toContainEqual(newTask)
		})

		it('updateTask updates in storage', async () => {
			// Ensure data exists
			await taskApi.getTasks()
			const tasks = await taskApi.getTasks()
			const targetId = tasks[0].id as number

			const updated = await taskApi.updateTask(targetId, { completed: true })
			expect(updated.completed).toBe(true)

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
			const storedTask = stored.find((t: any) => t.id === targetId)
			expect(storedTask.completed).toBe(true)
		})

		it('updateTask throws if not found', async () => {
			await expect(taskApi.updateTask(99999, { completed: true })).rejects.toThrow('Task with id 99999 not found')
		})

		it('deleteTask removes from storage', async () => {
			await taskApi.getTasks()
			const tasks = await taskApi.getTasks()
			const targetId = tasks[0].id as number

			await taskApi.deleteTask(targetId)

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
			expect(stored.find((t: any) => t.id === targetId)).toBeUndefined()
		})

		it('deleteTask acts as no-op if not found', async () => {
			const initialTasks = await taskApi.getTasks()
			const initialLength = initialTasks.length

			await taskApi.deleteTask(99999)

			const tasksAfter = await taskApi.getTasks()
			expect(tasksAfter).toHaveLength(initialLength)
		})
	})
})
