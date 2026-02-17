import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as firebaseService from '../firebaseService'
import { auth, db } from '../../firebase'
import { ref, onValue, push, set, update, remove } from 'firebase/database'

// Mock Firebase
vi.mock('../../firebase', () => ({
	auth: { currentUser: null },
	db: {}
}))

vi.mock('firebase/database', () => ({
	ref: vi.fn(() => ({ key: 'mock-ref' })),
	onValue: vi.fn(),
	push: vi.fn(() => ({ key: 'new-id' })),
	set: vi.fn(),
	update: vi.fn(),
	remove: vi.fn()
}))

describe('firebaseService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Reset auth state
		;(auth as any).currentUser = { uid: 'test-user' }
	})

	describe('getUserRoot', () => {
		it('throws if no user', () => {
			;(auth as any).currentUser = null
			expect(() => firebaseService.subscribeToDate('2024-01-01', () => {})).toThrow('User must be logged in')
		})
	})

	describe('Subscriptions', () => {
		it('subscribeToDate calls onValue with correct ref', () => {
			const cb = vi.fn()
			firebaseService.subscribeToDate('2024-01-01', cb)

			expect(ref).toHaveBeenCalledWith(db, 'users/test-user/calendar/2024-01-01')
			expect(onValue).toHaveBeenCalled()

			// simulate callback
			const onValueCallback = (onValue as any).mock.calls[0][1]
			onValueCallback({ val: () => ({ task1: { text: 't1' } }) })

			expect(cb).toHaveBeenCalledWith([{ text: 't1', id: 'task1', date: '2024-01-01' }])
		})

		it('subscribeToList calls onValue with correct ref', () => {
			const cb = vi.fn()
			firebaseService.subscribeToList('todo', cb)

			expect(ref).toHaveBeenCalledWith(db, 'users/test-user/todo')

			// simulate callback with empty data
			const onValueCallback = (onValue as any).mock.calls[0][1]
			onValueCallback({ val: () => null })

			expect(cb).toHaveBeenCalledWith([])
		})
	})

	describe('CRUD', () => {
		it('createTaskInPath', async () => {
			const task = { text: 'New Task' } as any
			const result = await firebaseService.createTaskInPath('todo', task)

			expect(ref).toHaveBeenCalledWith(db, 'users/test-user/todo')
			expect(push).toHaveBeenCalled()
			expect(set).toHaveBeenCalledWith(expect.anything(), task)
			expect(result).toEqual({ ...task, id: 'new-id' })
		})

		it('updateTaskInPath', async () => {
			await firebaseService.updateTaskInPath('todo', 'task1', { completed: true })

			expect(ref).toHaveBeenCalledWith(db, 'users/test-user/todo/task1')
			expect(update).toHaveBeenCalledWith(expect.anything(), { completed: true })
		})

		it('deleteTaskFromPath', async () => {
			await firebaseService.deleteTaskFromPath('todo', 'task1')

			expect(ref).toHaveBeenCalledWith(db, 'users/test-user/todo/task1')
			expect(remove).toHaveBeenCalled()
		})
	})

	describe('Complex Operations', () => {
		it('moveTask', async () => {
			const task = { id: 'task1', text: 'Move Me' } as any
			await firebaseService.moveTask('todo', 'calendar/2024-01-01', task, { startTime: 10 })

			expect(ref).toHaveBeenCalledWith(db, 'users/test-user')

			// Omit id from dataToSave check if needed, but implementation checks it logic.
			// Impl: const { id, ...dataToSave } = newTaskData
			// So id is NOT in the target object.

			const expectedUpdatesWithoutId = {
				'todo/task1': null,
				'calendar/2024-01-01/task1': { text: 'Move Me', startTime: 10 }
			}

			expect(update).toHaveBeenCalledWith(expect.anything(), expectedUpdatesWithoutId)
		})
	})

	describe('Categories', () => {
		it('subscribeToCategories', () => {
			const cb = vi.fn()
			firebaseService.subscribeToCategories(cb)
			expect(ref).toHaveBeenCalledWith(db, 'users/test-user/categories')
		})
	})
})
