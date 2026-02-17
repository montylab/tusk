import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AddDayZone from '../AddDayZone.vue'
import { useDragOperator } from '../../composables/useDragOperator'

// Mock useDragOperator
vi.mock('../../composables/useDragOperator', () => ({
	useDragOperator: vi.fn()
}))

// Mock ResizeObserver
class ResizeObserverMock {
	observe = vi.fn()
	unobserve = vi.fn()
	disconnect = vi.fn()
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

describe('AddDayZone.vue', () => {
	const mockDragOperator = {
		isDragging: ref(false),
		currentZone: ref<string | null>(null),
		registerZone: vi.fn(),
		unregisterZone: vi.fn(),
		updateZoneBounds: vi.fn()
	}

	beforeEach(() => {
		vi.clearAllMocks()
		vi.useFakeTimers()
		// Reset mock values
		mockDragOperator.isDragging.value = false
		mockDragOperator.currentZone.value = null
		;(useDragOperator as any).mockReturnValue(mockDragOperator)
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('renders and emits add-day on click', async () => {
		const wrapper = mount(AddDayZone, {
			props: { label: 'New Day' }
		})

		expect(wrapper.text()).toContain('Add New Day')

		await wrapper.find('.add-day-zone').trigger('click')
		expect(wrapper.emitted('add-day')).toBeTruthy()
	})

	it('registers zone on mount and unregisters on unmount', () => {
		const wrapper = mount(AddDayZone, { props: { label: 'Test' } })
		expect(mockDragOperator.registerZone).toHaveBeenCalledWith('add-day-zone', expect.any(Object))

		wrapper.unmount()
		expect(mockDragOperator.unregisterZone).toHaveBeenCalledWith('add-day-zone')
	})

	it('starts countdown when dragging and hovering', async () => {
		mockDragOperator.isDragging.value = true
		const wrapper = mount(AddDayZone, { props: { label: 'Test' } })

		// Simulate hover state via currentZone
		mockDragOperator.currentZone.value = 'add-day-zone'
		await wrapper.vm.$nextTick()

		// Countdown starts? (Check text or class)
		// The component watches isHovered.

		// Advance timer by 1s
		vi.advanceTimersByTime(1000)
		await wrapper.vm.$nextTick()
		// Should verify countdown state if possible, or wait full time

		// Advance full 3s (actually slightly less to verify progression, then full)
		vi.advanceTimersByTime(2500) // Total 3.5s > 3s
		await wrapper.vm.$nextTick()

		expect(wrapper.emitted('add-day')).toBeTruthy()
	})

	it('cancels countdown on drag leave', async () => {
		mockDragOperator.isDragging.value = true
		const wrapper = mount(AddDayZone, { props: { label: 'Test' } })

		// Enter
		mockDragOperator.currentZone.value = 'add-day-zone'
		await wrapper.vm.$nextTick()

		vi.advanceTimersByTime(1000)

		// Leave
		mockDragOperator.currentZone.value = null
		await wrapper.vm.$nextTick()

		vi.advanceTimersByTime(3000)

		expect(wrapper.emitted('add-day')).toBeFalsy()
	})

	it('cancels countdown on drag end', async () => {
		mockDragOperator.isDragging.value = true
		const wrapper = mount(AddDayZone, { props: { label: 'Test' } })

		// Enter
		mockDragOperator.currentZone.value = 'add-day-zone'
		await wrapper.vm.$nextTick()

		vi.advanceTimersByTime(1000)

		// Drag End
		mockDragOperator.isDragging.value = false
		await wrapper.vm.$nextTick()

		vi.advanceTimersByTime(3000)
		expect(wrapper.emitted('add-day')).toBeFalsy()
	})
})
