import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTasksStore } from '../tasks'
import { useUserStore } from '../user'
import * as firebaseService from '../../services/firebaseService'
import { nerve, NERVE_EVENTS } from '../../services/nerve'

// Mock dependencies
vi.mock('../../services/firebaseService', () => ({
	subscribeToDate: vi.fn(() => vi.fn()),
	subscribeToList: vi.fn(() => vi.fn()),
	createTaskInPath: vi.fn(),
	updateTaskInPath: vi.fn(),
	deleteTaskFromPath: vi.fn(),
	moveTask: vi.fn()
}))

vi.mock('../../services/nerve', () => ({
	nerve: { emit: vi.fn() },
	NERVE_EVENTS: {
		TASK_CREATED: 'TASK_CREATED',
		TASK_DELETED: 'TASK_DELETED',
		TASK_MOVED: 'TASK_MOVED',
		TASK_COMPLETED: 'TASK_COMPLETED',
		TASK_UNCOMPLETED: 'TASK_UNCOMPLETED'
	}
}))

describe('useTasksStore', () => {
	let store: ReturnType<typeof useTasksStore>
	let userStore: ReturnType<typeof useUserStore>

	beforeEach(() => {
		vi.clearAllMocks()
		setActivePinia(createPinia())
		userStore = useUserStore()
		userStore.user = { uid: 'test-uid', email: 'test@test.com' } as any
		store = useTasksStore()
	})

	describe('Initialization & Sync', () => {
		it('initializes and subscribes when user is present', () => {
			// Should subscribe to today (default in currentDates) + todo + shortcuts
			expect(firebaseService.subscribeToDate).toHaveBeenCalled()
			expect(firebaseService.subscribeToList).toHaveBeenCalledWith('todo', expect.any(Function))
			expect(firebaseService.subscribeToList).toHaveBeenCalledWith('shortcuts', expect.any(Function))
		})

		it('clears state when user logs out', () => {
			userStore.user = null
			// Check internal state is cleared (indirectly via public getters or length)
			expect(store.todoTasks).toEqual([])
			expect(store.shortcutTasks).toEqual([])
		})
	})

	describe('Date Management', () => {
		it('addDate subscribes to new date', () => {
			store.addDate('2025-01-01')
			expect(firebaseService.subscribeToDate).toHaveBeenCalledWith('2025-01-01', expect.any(Function))
			expect(store.currentDates).toContain('2025-01-01')
		})

		it('removeDate unsubscribes (mock cleanup check)', () => {
			// Mock return value of subscribe to be an unsub function
			const unsubMock = vi.fn()
			;(firebaseService.subscribeToDate as any).mockReturnValue(unsubMock)

			store.addDate('2025-01-01')
			store.removeDate('2025-01-01')

			expect(unsubMock).toHaveBeenCalled()
			expect(store.currentDates).not.toContain('2025-01-01')
		})
	})

	describe('CRUD Operations', () => {
		it('createTodo calls service and emits event', async () => {
			;(firebaseService.createTaskInPath as any).mockResolvedValue({ id: 'new-id' })
			await store.createTodo({ text: 'New Todo' })

			expect(firebaseService.createTaskInPath).toHaveBeenCalledWith('todo', expect.objectContaining({ text: 'New Todo' }))
			expect(nerve.emit).toHaveBeenCalledWith(NERVE_EVENTS.TASK_CREATED, { taskId: 'new-id' })
		})

		it('updateTodo calls service', async () => {
			await store.updateTodo('task-1', { completed: true })
			expect(firebaseService.updateTaskInPath).toHaveBeenCalledWith('todo', 'task-1', { completed: true })
		})

		it('deleteTodo calls service and emits event', async () => {
			await store.deleteTodo('task-1')
			expect(firebaseService.deleteTaskFromPath).toHaveBeenCalledWith('todo', 'task-1')
			expect(nerve.emit).toHaveBeenCalledWith(NERVE_EVENTS.TASK_DELETED)
		})

		it('updateScheduledTask emits completion events', async () => {
			await store.updateScheduledTask('task-1', '2025-01-01', { completed: true })
			expect(nerve.emit).toHaveBeenCalledWith(NERVE_EVENTS.TASK_COMPLETED, { taskId: 'task-1' })

			await store.updateScheduledTask('task-1', '2025-01-01', { completed: false })
			expect(nerve.emit).toHaveBeenCalledWith(NERVE_EVENTS.TASK_UNCOMPLETED, { taskId: 'task-1' })
		})
	})

	describe('Move Operations', () => {
		it('moveTodoToCalendar calls moveTask', async () => {
			// Need to mock state finding the task,
			// but store state is populated via via callbacks which we mocked.
			// We need to simulate data population first.
			const subscribeCallback = (firebaseService.subscribeToList as Mock).mock.calls.find((c) => c[0] === 'todo')[1]
			subscribeCallback([{ id: 'task-1', text: 'Todo 1' }])

			await store.moveTodoToCalendar('task-1', '2025-01-01', 10, 60)

			expect(firebaseService.moveTask).toHaveBeenCalledWith(
				'todo',
				'calendar/2025-01-01',
				expect.objectContaining({ id: 'task-1' }),
				expect.objectContaining({ startTime: 10, date: '2025-01-01' })
			)
			expect(nerve.emit).toHaveBeenCalledWith(NERVE_EVENTS.TASK_MOVED)
		})

		it('moveScheduledTask calls moveTask', async () => {
			// Simulate calendar data
			const today = store.currentDates[0]
			const subscribeCallback = (firebaseService.subscribeToDate as Mock).mock.calls.find((c) => c[0] === today)[1]
			subscribeCallback([{ id: 'task-cal-1', text: 'Event 1' }])

			await store.moveScheduledTask('task-cal-1', today, '2025-12-31', { startTime: 12 })

			expect(firebaseService.moveTask).toHaveBeenCalledWith(
				`calendar/${today}`,
				`calendar/2025-12-31`,
				expect.objectContaining({ id: 'task-cal-1' }),
				expect.objectContaining({ date: '2025-12-31', startTime: 12 })
			)
		})
	})

	describe('Getters', () => {
		it('getTaskById finds task in any list', () => {
			const subscribeTodo = (firebaseService.subscribeToList as Mock).mock.calls.find((c) => c[0] === 'todo')[1]
			subscribeTodo([{ id: 'todo-1', text: 'T1' }])

			const task = store.getTaskById('todo-1')
			expect(task).toBeDefined()
			expect(task?.id).toBe('todo-1')
		})
	})
})
