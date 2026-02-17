import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTaskEditor } from '../useTaskEditor'
import { createTestingPinia } from '@pinia/testing'
import { useTasksStore } from '../../stores/tasks'
import { useUIStore } from '../../stores/ui'
import { nextTick } from 'vue'

describe('useTaskEditor', () => {
	let tasksStore: any
	let uiStore: any

	beforeEach(() => {
		createTestingPinia({ createSpy: vi.fn })
		tasksStore = useTasksStore()
		uiStore = useUIStore()
	})

	it('opens create popup with default values', () => {
		const { showEditorPopup, initialStartTime, popupTargetDate, handleOpenCreatePopup } = useTaskEditor()

		handleOpenCreatePopup({ startTime: 120, date: '2025-01-01' })

		expect(showEditorPopup.value).toBe(true)
		expect(initialStartTime.value).toBe(120)
		expect(popupTargetDate.value).toBe('2025-01-01')
	})

	it('opens edit popup for scheduled task', () => {
		const { showEditorPopup, taskToEdit, popupTaskType, handleEditTask } = useTaskEditor()
		const mockTask = { id: '1', text: 'Task 1', startTime: 60, date: '2025-01-02' } as any

		handleEditTask(mockTask)

		expect(showEditorPopup.value).toBe(true)
		expect(taskToEdit.value).toEqual(mockTask)
		expect(popupTaskType.value).toBe('scheduled')
	})

	it('opens edit popup for shortcut task', () => {
		const { popupTaskType, handleEditTask } = useTaskEditor()
		const mockTask = { id: '1', text: 'Task 1', isShortcut: true } as any

		handleEditTask(mockTask)
		expect(popupTaskType.value).toBe('shortcut')
	})

	it('opens edit popup for todo task', () => {
		const { popupTaskType, handleEditTask } = useTaskEditor()
		const mockTask = { id: '1', text: 'Task 1' } as any // Not scheduled, not shortcut

		handleEditTask(mockTask)
		expect(popupTaskType.value).toBe('todo')
	})

	it('calls createScheduledTask on handleTaskCreate', () => {
		const { handleTaskCreate, showEditorPopup } = useTaskEditor()

		handleTaskCreate({
			text: 'New Task',
			description: 'Desc',
			category: 'Work',
			isDeepWork: false,
			startTime: 180,
			date: '2025-01-03'
		})

		expect(tasksStore.createScheduledTask).toHaveBeenCalledWith(
			expect.objectContaining({
				text: 'New Task',
				startTime: 180,
				date: '2025-01-03'
			})
		)
		expect(showEditorPopup.value).toBe(false)
	})

	it('calls update actions on handleTaskUpdate', () => {
		const { handleTaskUpdate } = useTaskEditor()
		const mockTask = { id: '1', text: 'Old', startTime: 60, date: '2025-01-01' }
		// Ensure action is mocked
		tasksStore.getTaskById = vi.fn().mockReturnValue(mockTask)

		handleTaskUpdate({ id: '1', updates: { text: 'New' } })

		expect(tasksStore.updateScheduledTask).toHaveBeenCalledWith('1', '2025-01-01', { text: 'New' })
	})

	it('closes popup on handlePopupClose', () => {
		const { handlePopupClose, showEditorPopup, handleOpenCreatePopup } = useTaskEditor()

		handleOpenCreatePopup()
		expect(showEditorPopup.value).toBe(true)

		handlePopupClose()
		expect(showEditorPopup.value).toBe(false)
	})

	it('watches uiStore.createTaskTrigger and opens popup', async () => {
		useTaskEditor()

		uiStore.createTaskTrigger++
		await nextTick()

		// This is tricky to test return values from a watch in a composable
		// without returning them or checking side effects.
		// But since useTaskEditor is called, we can check its state IF we have access to it.
		// Wait, useTaskEditor returns local ref state.
		// If I call it twice, I get different state.

		const editor = useTaskEditor()
		uiStore.createTaskTrigger++
		await nextTick()
		expect(editor.showEditorPopup.value).toBe(true)
	})
})
