import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as firebaseService from '../firebaseService'
import { auth, db } from '../../firebase'
import { doc, onSnapshot, setDoc, updateDoc, deleteField, writeBatch, collection } from 'firebase/firestore'

// Mock Firebase
vi.mock('../../firebase', () => ({
	auth: { currentUser: null },
	db: {}
}))

vi.mock('firebase/firestore', () => ({
	doc: vi.fn((...args: any[]) => {
		// Return a ref-like object that encodes the path for assertions
		const pathParts = args.slice(1)
		return { __path: pathParts.join('/'), id: 'mock-generated-id' }
	}),
	collection: vi.fn((...args: any[]) => ({ __collection: args.slice(1).join('/') })),
	onSnapshot: vi.fn(),
	setDoc: vi.fn(),
	updateDoc: vi.fn(),
	deleteField: vi.fn(() => '__DELETE_FIELD__'),
	writeBatch: vi.fn(() => ({
		update: vi.fn(),
		set: vi.fn(),
		commit: vi.fn()
	}))
}))

describe('firebaseService (Firestore)', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		;(auth as any).currentUser = { uid: 'test-user' }
	})

	describe('getUserRoot', () => {
		it('throws if no user', () => {
			;(auth as any).currentUser = null
			expect(() => firebaseService.subscribeToDate('2024-01-01', () => {})).toThrow('User must be logged in')
		})
	})

	describe('Subscriptions', () => {
		it('subscribeToDate creates onSnapshot on calendar/{date} doc', () => {
			const cb = vi.fn()
			firebaseService.subscribeToDate('2024-01-01', cb)

			expect(doc).toHaveBeenCalledWith(db, 'users/test-user', 'calendar', '2024-01-01')
			expect(onSnapshot).toHaveBeenCalled()

			// Simulate snapshot callback
			const snapshotCb = (onSnapshot as any).mock.calls[0][1]
			snapshotCb({
				data: () => ({
					tasks: {
						task1: { text: 't1' }
					}
				})
			})

			expect(cb).toHaveBeenCalledWith([{ text: 't1', id: 'task1', date: '2024-01-01' }])
		})

		it('subscribeToDate returns empty array when doc has no data', () => {
			const cb = vi.fn()
			firebaseService.subscribeToDate('2024-01-01', cb)

			const snapshotCb = (onSnapshot as any).mock.calls[0][1]
			snapshotCb({ data: () => undefined })

			expect(cb).toHaveBeenCalledWith([])
		})

		it('subscribeToList calls onSnapshot on lists/{name} doc', () => {
			const cb = vi.fn()
			firebaseService.subscribeToList('todo', cb)

			expect(doc).toHaveBeenCalledWith(db, 'users/test-user', 'lists', 'todo')

			// Simulate empty
			const snapshotCb = (onSnapshot as any).mock.calls[0][1]
			snapshotCb({ data: () => null })

			expect(cb).toHaveBeenCalledWith([])
		})
	})

	describe('CRUD', () => {
		it('createTaskInPath generates ID and calls setDoc with nested object', async () => {
			const task = { text: 'New Task' } as any
			const result = await firebaseService.createTaskInPath('todo', task)

			expect(setDoc).toHaveBeenCalledWith(expect.anything(), { tasks: { 'mock-generated-id': task } }, { merge: true })
			expect(result).toEqual({ ...task, id: 'mock-generated-id' })
		})

		it('updateTaskInPath uses dot-notation via updateDoc', async () => {
			await firebaseService.updateTaskInPath('todo', 'task1', { completed: true })

			expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
				'tasks.task1.completed': true
			})
		})

		it('updateTaskInPath strips id field from updates', async () => {
			await firebaseService.updateTaskInPath('todo', 'task1', { id: 'task1', text: 'Updated' } as any)

			expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
				'tasks.task1.text': 'Updated'
			})
		})

		it('deleteTaskFromPath calls updateDoc with deleteField', async () => {
			await firebaseService.deleteTaskFromPath('todo', 'task1')

			expect(deleteField).toHaveBeenCalled()
			expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
				'tasks.task1': '__DELETE_FIELD__'
			})
		})
	})

	describe('Complex Operations', () => {
		it('moveTask uses writeBatch for atomic move', async () => {
			const mockBatch = {
				update: vi.fn(),
				set: vi.fn(),
				commit: vi.fn()
			}
			;(writeBatch as any).mockReturnValue(mockBatch)

			const task = { id: 'task1', text: 'Move Me' } as any
			await firebaseService.moveTask('todo', 'calendar/2024-01-01', task, { startTime: 10 })

			expect(writeBatch).toHaveBeenCalledWith(db)

			// Delete from source
			expect(mockBatch.update).toHaveBeenCalledWith(expect.anything(), {
				'tasks.task1': '__DELETE_FIELD__'
			})

			// Add to target
			expect(mockBatch.set).toHaveBeenCalledWith(
				expect.anything(),
				{ tasks: { task1: { text: 'Move Me', startTime: 10 } } },
				{ merge: true }
			)

			expect(mockBatch.commit).toHaveBeenCalled()
		})
	})

	describe('Categories', () => {
		it('subscribeToCategories listens to meta/categories doc', () => {
			const cb = vi.fn()
			firebaseService.subscribeToCategories(cb)
			expect(doc).toHaveBeenCalledWith(db, 'users/test-user', 'meta', 'categories')

			const snapshotCb = (onSnapshot as any).mock.calls[0][1]
			snapshotCb({
				data: () => ({
					items: {
						cat1: { name: 'Work', color: '#ff0000', order: 0 }
					}
				})
			})

			expect(cb).toHaveBeenCalledWith([{ id: 'cat1', name: 'Work', color: '#ff0000', order: 0 }])
		})

		it('subscribeToCategories returns empty array when no items', () => {
			const cb = vi.fn()
			firebaseService.subscribeToCategories(cb)

			const snapshotCb = (onSnapshot as any).mock.calls[0][1]
			snapshotCb({ data: () => undefined })

			expect(cb).toHaveBeenCalledWith([])
		})
	})

	describe('Settings', () => {
		it('subscribeToSettings listens to meta/settings doc', () => {
			const cb = vi.fn()
			firebaseService.subscribeToSettings(cb)
			expect(doc).toHaveBeenCalledWith(db, 'users/test-user', 'meta', 'settings')

			const snapshotCb = (onSnapshot as any).mock.calls[0][1]
			snapshotCb({ data: () => ({ snapMinutes: 15 }) })

			expect(cb).toHaveBeenCalledWith({ snapMinutes: 15 })
		})

		it('updateSettings calls setDoc with merge', async () => {
			await firebaseService.updateSettings({ snapMinutes: 30 })

			expect(setDoc).toHaveBeenCalledWith(expect.anything(), { snapMinutes: 30 }, { merge: true })
		})
	})
})
