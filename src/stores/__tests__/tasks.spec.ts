import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTasksStore } from '../tasks'
import { useUserStore } from '../user'
import * as firebaseService from '../../services/firebaseService'
import * as taskService from '../../services/taskService'
import { nerve, NERVE_EVENTS } from '../../services/nerve'

// Mock firebaseService (still needed for subscriptions)
vi.mock('../../services/firebaseService', () => ({
	subscribeToDate: vi.fn(() => vi.fn()),
	subscribeToList: vi.fn(() => vi.fn()),
	createTaskInPath: vi.fn(),
	updateTaskInPath: vi.fn(),
	deleteTaskFromPath: vi.fn(),
	moveTask: vi.fn(),
	resolveDocRef: vi.fn(),
	generateId: vi.fn(() => 'mock-id'),
	getUserRoot: vi.fn(() => 'users/test-uid')
}))

// Mock taskService (all mutations go through here now)
vi.mock('../../services/taskService', () => ({
	createTodo: vi.fn().mockResolvedValue({ id: 'new-id' }),
	createShortcut: vi.fn().mockResolvedValue({ id: 'new-id' }),
	createScheduledTask: vi.fn().mockResolvedValue({ id: 'new-id' }),
	updateTodo: vi.fn().mockResolvedValue(undefined),
	updateShortcut: vi.fn().mockResolvedValue(undefined),
	updateScheduledTask: vi.fn().mockResolvedValue(undefined),
	deleteTodo: vi.fn().mockResolvedValue(undefined),
	deleteShortcut: vi.fn().mockResolvedValue(undefined),
	deleteScheduledTask: vi.fn().mockResolvedValue(undefined),
	moveTodoToCalendar: vi.fn().mockResolvedValue(undefined),
	moveCalendarToTodo: vi.fn().mockResolvedValue(undefined),
	moveTodoToShortcut: vi.fn().mockResolvedValue(undefined),
	moveCalendarToShortcut: vi.fn().mockResolvedValue(undefined),
	moveScheduledTask: vi.fn().mockResolvedValue(undefined),
	copyShortcutToTodo: vi.fn().mockResolvedValue({ id: 'new-id' }),
	copyShortcutToCalendar: vi.fn().mockResolvedValue({ id: 'new-id' })
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
			expect(firebaseService.subscribeToDate).toHaveBeenCalled()
			expect(firebaseService.subscribeToList).toHaveBeenCalledWith('todo', expect.any(Function))
			expect(firebaseService.subscribeToList).toHaveBeenCalledWith('shortcuts', expect.any(Function))
		})

		it('clears state when user logs out', () => {
			userStore.user = null
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
			const unsubMock = vi.fn()
			;(firebaseService.subscribeToDate as any).mockReturnValue(unsubMock)

			store.addDate('2025-01-01')
			store.removeDate('2025-01-01')

			expect(unsubMock).toHaveBeenCalled()
			expect(store.currentDates).not.toContain('2025-01-01')
		})
	})

	describe('CRUD Operations', () => {
		it('createTodo delegates to taskService', async () => {
			await store.createTodo({ text: 'New Todo' })
			expect(taskService.createTodo).toHaveBeenCalledWith(expect.objectContaining({ text: 'New Todo' }))
		})

		it('createScheduledTask delegates to taskService', async () => {
			const today = store.currentDates[0]
			await store.createScheduledTask({ text: 'Event' })
			expect(taskService.createScheduledTask).toHaveBeenCalledWith(expect.objectContaining({ text: 'Event' }), today)
		})

		it('updateTodo delegates to taskService', async () => {
			await store.updateTodo('task-1', { completed: true })
			expect(taskService.updateTodo).toHaveBeenCalledWith('task-1', { completed: true })
		})

		it('updateScheduledTask delegates with existing task', async () => {
			// Populate calendar state
			const today = store.currentDates[0]
			const subscribeCallback = (firebaseService.subscribeToDate as Mock).mock.calls.find((c) => c[0] === today)[1]
			subscribeCallback([{ id: 'task-1', text: 'Event', duration: 60, category: 'Work' }])

			await store.updateScheduledTask('task-1', today, { completed: true })
			expect(taskService.updateScheduledTask).toHaveBeenCalledWith(
				'task-1',
				today,
				{ completed: true },
				expect.objectContaining({ id: 'task-1' })
			)
		})

		it('deleteTodo delegates to taskService', async () => {
			await store.deleteTodo('task-1')
			expect(taskService.deleteTodo).toHaveBeenCalledWith('task-1')
		})

		it('deleteScheduledTask delegates with existing task', async () => {
			const today = store.currentDates[0]
			const subscribeCallback = (firebaseService.subscribeToDate as Mock).mock.calls.find((c) => c[0] === today)[1]
			subscribeCallback([{ id: 'task-1', text: 'Event', duration: 60, category: 'Work' }])

			await store.deleteScheduledTask('task-1', today)
			expect(taskService.deleteScheduledTask).toHaveBeenCalledWith('task-1', today, expect.objectContaining({ id: 'task-1' }))
		})
	})

	describe('Move Operations', () => {
		it('moveTodoToCalendar delegates to taskService', async () => {
			const subscribeCallback = (firebaseService.subscribeToList as Mock).mock.calls.find((c) => c[0] === 'todo')[1]
			subscribeCallback([{ id: 'task-1', text: 'Todo 1' }])

			await store.moveTodoToCalendar('task-1', '2025-01-01', 10, 60)

			expect(taskService.moveTodoToCalendar).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }), '2025-01-01', 10, 60)
		})

		it('moveScheduledTask delegates to taskService', async () => {
			const today = store.currentDates[0]
			const subscribeCallback = (firebaseService.subscribeToDate as Mock).mock.calls.find((c) => c[0] === today)[1]
			subscribeCallback([{ id: 'task-cal-1', text: 'Event 1' }])

			await store.moveScheduledTask('task-cal-1', today, '2025-12-31', { startTime: 12 })

			expect(taskService.moveScheduledTask).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-cal-1' }), today, '2025-12-31', {
				startTime: 12
			})
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
