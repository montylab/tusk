import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useExternalDrag } from '../useExternalDrag'
import { createTestingPinia } from '@pinia/testing'
import { useTasksStore } from '../../stores/tasks'

describe('useExternalDrag', () => {
	let tasksStore: any
	const mockDayView = {
		value: {
			startExternalDrag: vi.fn((_event, _task, callback) => callback())
		}
	}

	beforeEach(() => {
		createTestingPinia({ createSpy: vi.fn })
		tasksStore = useTasksStore()
	})

	const mockTask = { id: '1', text: 'T1', duration: 30 } as any

	it('sets activeExternalTask on drag start', () => {
		const { handleExternalDragStart, activeExternalTask } = useExternalDrag(mockDayView)

		handleExternalDragStart('todo', mockTask, new MouseEvent('mousedown'))

		expect(mockDayView.value.startExternalDrag).toHaveBeenCalled()
		expect(activeExternalTask.value).toEqual({ source: 'todo', task: mockTask })
	})

	it('moves todo to calendar on drop', () => {
		const { handleExternalDragStart, handleExternalTaskDropped } = useExternalDrag(mockDayView)
		handleExternalDragStart('todo', mockTask, new MouseEvent('mousedown'))

		handleExternalTaskDropped({
			taskId: '1',
			date: '2025-01-01',
			startTime: 10,
			duration: 45
		})

		expect(tasksStore.moveTodoToCalendar).toHaveBeenCalledWith('1', '2025-01-01', 10, 45)
	})

	it('copies shortcut to calendar on drop', () => {
		const { handleExternalDragStart, handleExternalTaskDropped } = useExternalDrag(mockDayView)
		handleExternalDragStart('shortcut', mockTask, new MouseEvent('mousedown'))

		handleExternalTaskDropped({
			taskId: '1',
			date: '2025-01-01',
			startTime: 10
		})

		// fallback to task duration if payload doesn't provide it
		expect(tasksStore.copyShortcutToCalendar).toHaveBeenCalledWith('1', '2025-01-01', 10, 30)
	})

	it('deletes todo when handleExternalTaskDeleted is called', () => {
		const { handleExternalDragStart, handleExternalTaskDeleted, activeExternalTask } = useExternalDrag(mockDayView)
		handleExternalDragStart('todo', mockTask, new MouseEvent('mousedown'))

		handleExternalTaskDeleted()

		expect(tasksStore.deleteTodo).toHaveBeenCalledWith('1')
		expect(activeExternalTask.value).toBeNull()
	})

	it('deletes shortcut when handleExternalTaskDeleted is called', () => {
		const { handleExternalDragStart, handleExternalTaskDeleted } = useExternalDrag(mockDayView)
		handleExternalDragStart('shortcut', mockTask, new MouseEvent('mousedown'))

		handleExternalTaskDeleted()

		expect(tasksStore.deleteShortcut).toHaveBeenCalledWith('1')
	})
})
