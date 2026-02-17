import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGlobalShortcuts } from '../useGlobalShortcuts'
import { createTestingPinia } from '@pinia/testing'
import { useAppearanceStore } from '../../stores/appearance'
import { useTasksStore } from '../../stores/tasks'
import { useDragOperator } from '../useDragOperator'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

// Mock useDragOperator
const startDragMock = vi.fn()
vi.mock('../useDragOperator', () => ({
	useDragOperator: vi.fn(() => ({
		startDrag: startDragMock
	}))
}))

describe('useGlobalShortcuts', () => {
	let appearanceStore: any
	let tasksStore: any

	// We need a component to host the composable since it uses onMounted/onUnmounted
	const TestComponent = defineComponent({
		setup() {
			useGlobalShortcuts()
			return {}
		},
		template: '<div></div>'
	})

	beforeEach(() => {
		createTestingPinia({ createSpy: vi.fn })
		appearanceStore = useAppearanceStore()
		tasksStore = useTasksStore()
		mount(TestComponent)
	})

	it('changes interface scale on Alt + 1/2/3', () => {
		window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: '2' }))
		expect(appearanceStore.interfaceScale).toBe(150)

		window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: '3' }))
		expect(appearanceStore.interfaceScale).toBe(200)
	})

	it('cycles theme on Alt + Backquote', () => {
		appearanceStore.theme = 'light'
		window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, code: 'Backquote' }))
		// themes: ['dark', 'light', 'pinky', 'vivid']
		// currentIndex of light is 1, next is 2 (pinky)
		expect(appearanceStore.theme).toBe('pinky')

		window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, code: 'Backquote' }))
		expect(appearanceStore.theme).toBe('vivid')
	})

	it('starts drag for shortcut task on Ctrl + 1-9', () => {
		const mockTask = { id: 's1', text: 'Shortcut 1', duration: 30 }
		tasksStore.shortcutTasks = [mockTask]
		tasksStore.generateTempId.mockReturnValue('temp-1')

		window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: '1' }))

		expect(startDragMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'temp-1',
				text: 'Shortcut 1',
				isShortcut: false
			}),
			'shortcut'
		)
	})

	it('ignores shortcuts when typing in INPUT', () => {
		const input = document.createElement('input')
		document.body.appendChild(input)
		input.focus()

		appearanceStore.interfaceScale = 100
		input.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: '2', bubbles: true }))

		expect(appearanceStore.interfaceScale).toBe(100)

		document.body.removeChild(input)
	})
})
