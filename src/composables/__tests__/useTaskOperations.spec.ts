import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTaskOperations } from '../useTaskOperations'
import { ref, defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

// Mock useDragState
const mockUseDragState = {
	isOverTrash: ref(false),
	isOverTodo: ref(false),
	isOverShortcut: ref(false),
	isOverCalendar: ref(false),
	isOverAddButton: ref(false),
	updateCollision: vi.fn(),
	resetCollisions: vi.fn(),
	overZone: ref(null)
}

vi.mock('../useDragState', () => ({
	useDragState: () => mockUseDragState
}))

describe('useTaskOperations', () => {
	let tasks = ref<any[]>([])
	const emit = vi.fn()
	const config = {
		startHour: 9,
		endHour: 17,
		hourHeight: 60,
		getContainerRect: vi.fn(),
		getScrollTop: vi.fn().mockReturnValue(0),
		dates: ref(['2024-01-01']),
		onTaskDropped: vi.fn(),
		onDeleteTask: vi.fn(),
		onTaskDroppedOnSidebar: vi.fn(),
		onExternalTaskDropped: vi.fn()
	}

	// Helper component to run the composable
	const TestComponent = defineComponent({
		setup() {
			const ops = useTaskOperations(tasks, emit, config)
			return { ...ops }
		},
		template: '<div></div>'
	})

	beforeEach(() => {
		tasks.value = [{ id: 1, startTime: 10, duration: 60, date: '2024-01-01' }]
		emit.mockClear()
		config.onTaskDropped.mockClear()
		config.onDeleteTask.mockClear()
		config.onTaskDroppedOnSidebar.mockClear()
		config.onExternalTaskDropped.mockClear()
		mockUseDragState.updateCollision.mockClear()
		mockUseDragState.resetCollisions.mockClear()
		mockUseDragState.isOverTrash.value = false
		mockUseDragState.isOverTodo.value = false
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('Start and Complete Internal Drag', async () => {
		const wrapper = mount(TestComponent)
		const { startOperation } = wrapper.vm

		// Start Drag
		const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
		startOperation(startEvent, 1, 'drag')

		expect(wrapper.vm.mode).toBe('none') // Should be none until threshold

		// Move beyond threshold
		const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 150, bubbles: true })
		window.dispatchEvent(moveEvent)
		await nextTick()

		expect(wrapper.vm.mode).toBe('drag')

		// Simulate drop
		const upEvent = new MouseEvent('mouseup', { clientX: 150, clientY: 150, bubbles: true })
		window.dispatchEvent(upEvent)
		await nextTick()

		expect(wrapper.vm.mode).toBe('none')
		expect(mockUseDragState.resetCollisions).toHaveBeenCalled()
	})

	it('External Drag Start and Drop', async () => {
		const wrapper = mount(TestComponent)
		const { startExternalDrag } = wrapper.vm
		const task = { id: 999, startTime: 0, duration: 60, date: '2024-01-01', title: 'New Task' }

		const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
		startExternalDrag(startEvent, task as any)

		// Move to trigger threshold
		const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 200, bubbles: true })
		window.dispatchEvent(moveEvent)
		await nextTick()

		expect(wrapper.vm.mode).toBe('drag')

		// Drop
		const upEvent = new MouseEvent('mouseup', { clientX: 200, clientY: 200, bubbles: true })
		window.dispatchEvent(upEvent)
		await nextTick()

		expect(wrapper.vm.mode).toBe('none')
	})

	it('Resize Task Duration (Bottom)', async () => {
		const wrapper = mount(TestComponent)
		const { startOperation } = wrapper.vm

		const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
		startOperation(startEvent, 1, 'resize-bottom')

		// Move to trigger threshold + delta
		const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 170, bubbles: true })
		window.dispatchEvent(moveEvent)
		await nextTick()

		expect(wrapper.vm.mode).toBe('resize-bottom')
		expect(wrapper.vm.currentDuration).toBeGreaterThan(60)

		const upEvent = new MouseEvent('mouseup', { bubbles: true })
		window.dispatchEvent(upEvent)
		await nextTick()

		expect(config.onTaskDropped).toHaveBeenCalled()
		const call = config.onTaskDropped.mock.calls[0][0]
		expect(call.duration).toBeGreaterThan(60)
	})

	it('Drag to Trash', async () => {
		const wrapper = mount(TestComponent)
		const { startOperation } = wrapper.vm
		const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
		startOperation(startEvent, 1, 'drag')

		// Move
		window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 150, bubbles: true }))
		await nextTick()

		// Set Mock Trash
		mockUseDragState.isOverTrash.value = true

		// Drop
		window.dispatchEvent(new MouseEvent('mouseup', { clientX: 150, clientY: 150, bubbles: true }))
		await nextTick()

		expect(config.onDeleteTask).toHaveBeenCalled()
	})

	it('Handle Slot Click', () => {
		const wrapper = mount(TestComponent)
		const { handleSlotClick } = wrapper.vm
		handleSlotClick(10, 2, '2024-01-01') // 10:30

		expect(emit).toHaveBeenCalledWith('create-task', { startTime: 10.5, date: '2024-01-01' })
	})

	it('Unmount Cleanup', async () => {
		const addSpy = vi.spyOn(window, 'addEventListener')
		const removeSpy = vi.spyOn(window, 'removeEventListener')

		const wrapper = mount(TestComponent)
		const { startOperation } = wrapper.vm
		const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
		startOperation(startEvent, 1, 'drag')

		expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))

		// Trigger unmount
		wrapper.unmount()

		expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
	})
})
