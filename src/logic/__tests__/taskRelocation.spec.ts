import { describe, it, expect, vi, beforeEach } from 'vitest'
import { manageTaskRelocation } from '../taskRelocation'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useTasksStore } from '../../stores/tasks'

describe('manageTaskRelocation', () => {
	let store: any

	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				createSpy: vi.fn,
				stubActions: true
			})
		)
		store = useTasksStore()
	})

	// --- Dest: Trash ---

	it('Delete Scheduled Task', async () => {
		const task = { id: 1 } as any
		await manageTaskRelocation('calendar-day-2024-01-01', 'trash', task, {})
		expect(store.deleteScheduledTask).toHaveBeenCalledWith(1, '2024-01-01')
	})

	it('Delete Todo', async () => {
		const task = { id: 1 } as any
		await manageTaskRelocation('todo', 'trash', task, {})
		expect(store.deleteTodo).toHaveBeenCalledWith(1)
	})

	it('Delete Shortcut', async () => {
		const task = { id: 1 } as any
		await manageTaskRelocation('shortcut', 'trash', task, {})
		expect(store.deleteShortcut).toHaveBeenCalledWith(1)
	})

	// --- Dest: Calendar ---

	it('Create from Temp Task', async () => {
		const task = { id: 'temp-123', text: 'New', duration: 30 } as any
		const dropData = { time: 10, duration: 60 }

		await manageTaskRelocation('shortcut', 'calendar-day-2024-01-02', task, dropData)

		expect(store.createScheduledTask).toHaveBeenCalledWith(
			expect.objectContaining({
				text: 'New',
				date: '2024-01-02',
				startTime: 10,
				duration: 60,
				isShortcut: false
			})
		)
	})

	it('Move within same day', async () => {
		const task = { id: 1 } as any
		const dropData = { time: 12, duration: 45 }

		await manageTaskRelocation('calendar-day-2024-01-02', 'calendar-day-2024-01-02', task, dropData)

		expect(store.updateScheduledTask).toHaveBeenCalledWith(1, '2024-01-02', { startTime: 12, duration: 45 })
		expect(store.moveScheduledTask).not.toHaveBeenCalled()
	})

	it('Move to different day', async () => {
		const task = { id: 1 } as any
		const dropData = { time: 9 }

		await manageTaskRelocation('calendar-day-2024-01-01', 'calendar-day-2024-01-02', task, dropData)

		expect(store.moveScheduledTask).toHaveBeenCalledWith(1, '2024-01-01', '2024-01-02', expect.objectContaining({ startTime: 9 }))
	})

	it('Todo to Calendar', async () => {
		const task = { id: 1 } as any
		const dropData = { time: 10, duration: 60 }

		await manageTaskRelocation('todo', 'calendar-day-2024-01-02', task, dropData)

		expect(store.moveTodoToCalendar).toHaveBeenCalledWith(1, '2024-01-02', 10, 60)
	})

	it('Shortcut to Calendar', async () => {
		const task = { id: 1 } as any
		const dropData = { time: 11, duration: 30 }

		await manageTaskRelocation('shortcut', 'calendar-day-2024-01-02', task, dropData)

		expect(store.copyShortcutToCalendar).toHaveBeenCalledWith(1, '2024-01-02', 11, 30)
	})

	// --- Dest: Todo ---

	it('Create from Temp Task (Todo)', async () => {
		const task = { id: 'temp-456', text: 'New Todo' } as any
		const dropData = { order: 100 }

		await manageTaskRelocation('todo', 'todo', task, dropData)

		expect(store.createTodo).toHaveBeenCalledWith(
			expect.objectContaining({
				text: 'New Todo',
				order: 100,
				isShortcut: false
			})
		)
	})

	it('Calendar to Todo', async () => {
		const task = { id: 1 } as any
		const dropData = { order: 50 }

		await manageTaskRelocation('calendar-day-2024-01-01', 'todo', task, dropData)

		expect(store.moveCalendarToTodo).toHaveBeenCalledWith(1, '2024-01-01', 50)
	})

	it('Reorder Todo', async () => {
		const task = { id: 1 } as any
		const dropData = { index: 2 }

		// Ensure index is passed
		await manageTaskRelocation('todo', 'todo', task, dropData)

		expect(store.reorderTodo).toHaveBeenCalledWith(1, 2)
	})

	it('Shortcut to Todo', async () => {
		const task = { id: 1 } as any
		const dropData = { order: 10 }

		await manageTaskRelocation('shortcut', 'todo', task, dropData)

		expect(store.copyShortcutToTodo).toHaveBeenCalledWith(1, 10)
	})

	// --- Dest: Shortcut ---

	it('Calendar to Shortcut', async () => {
		const task = { id: 1 } as any

		await manageTaskRelocation('calendar-day-2024-01-01', 'shortcut', task, {})

		expect(store.moveCalendarToShortcut).toHaveBeenCalledWith(1, '2024-01-01', undefined)
	})

	it('Todo to Shortcut', async () => {
		const task = { id: 1 } as any

		await manageTaskRelocation('todo', 'shortcut', task, {})

		expect(store.moveTodoToShortcut).toHaveBeenCalledWith(1, undefined)
	})

	it('Reorder Shortcut', async () => {
		const task = { id: 1 } as any
		const dropData = { index: 5 }

		await manageTaskRelocation('shortcut', 'shortcut', task, dropData)

		expect(store.reorderShortcut).toHaveBeenCalledWith(1, 5)
	})

	// --- Edge Cases ---

	it('Invalid Destination', async () => {
		const task = { id: 1 } as any
		await manageTaskRelocation('todo', '', task, {})

		// No checks needed, just ensure it doesn't crash or call random things.
		// We can check one random method is NOT called
		expect(store.deleteTodo).not.toHaveBeenCalled()
	})
})
