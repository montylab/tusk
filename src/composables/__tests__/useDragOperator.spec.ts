import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useDragOperator } from '../useDragOperator'
import { manageTaskRelocation } from '../../logic/taskRelocation'

vi.mock('../../logic/taskRelocation', () => ({
	manageTaskRelocation: vi.fn()
}))

describe('useDragOperator', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.clearAllMocks()
		const op = useDragOperator()
		op.cancelDrag()
		op.__clearZonesForTesting()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	const mockTask = { id: '1', text: 'Task 1', category: 'Work' } as any

	it('registers and unregisters zones', () => {
		const { registerZone, unregisterZone, startDrag, currentZone } = useDragOperator()
		const bounds = { left: 0, top: 0, right: 100, bottom: 100 } as DOMRect

		registerZone('test-zone', bounds)

		startDrag(mockTask, 'source')
		vi.advanceTimersByTime(150)

		// Simulate mouse move into zone
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }))
		expect(currentZone.value).toBe('test-zone')

		unregisterZone('test-zone')
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }))
		expect(currentZone.value).toBeNull()
	})

	it('starts dragging after 150ms delay', () => {
		const { startDrag, isDragging } = useDragOperator()
		startDrag(mockTask, 'source')

		expect(isDragging.value).toBe(false)
		vi.advanceTimersByTime(100)
		expect(isDragging.value).toBe(false)

		vi.advanceTimersByTime(50)
		expect(isDragging.value).toBe(true)
	})

	it('cancels drag if mouseup before delay', () => {
		const { startDrag, isDragging } = useDragOperator()
		startDrag(mockTask, 'source')

		vi.advanceTimersByTime(100)
		document.dispatchEvent(new MouseEvent('mouseup'))

		vi.advanceTimersByTime(100)
		expect(isDragging.value).toBe(false)
	})

	it('updates ghost position on move', () => {
		const { startDrag, ghostPosition } = useDragOperator()
		startDrag(mockTask, 'source')
		vi.advanceTimersByTime(150)

		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 400 }))
		expect(ghostPosition.value).toEqual({ x: 300, y: 400 })
	})

	it('calculates drop data if zone provided a calculator', () => {
		const { registerZone, startDrag, dropData } = useDragOperator()
		const calc = vi.fn((_x, y) => ({ row: Math.floor(y / 10) }))
		registerZone('grid-zone', { left: 0, top: 0, right: 200, bottom: 200 } as DOMRect, {
			calculateDropData: calc
		})

		startDrag(mockTask, 'source')
		vi.advanceTimersByTime(150)

		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 55 }))
		expect(calc).toHaveBeenCalled()
		expect(dropData.value).toEqual({ row: 5 })
	})

	it('calls manageTaskRelocation on drop', async () => {
		const { registerZone, startDrag } = useDragOperator()
		registerZone('target-zone', { left: 100, top: 100, right: 200, bottom: 200 } as DOMRect)

		startDrag(mockTask, 'source-zone')
		vi.advanceTimersByTime(150)

		document.dispatchEvent(new MouseEvent('mouseup', { clientX: 150, clientY: 150 }))

		await nextTick()

		expect(manageTaskRelocation).toHaveBeenCalledWith('source-zone', 'target-zone', expect.anything(), null)
		const calledTask = vi.mocked(manageTaskRelocation).mock.calls[0][2] as any
		expect(calledTask.id).toBe(mockTask.id)
	})

	it('cancels drag on Escape key', () => {
		const { startDrag, isDragging } = useDragOperator()
		startDrag(mockTask, 'source')
		vi.advanceTimersByTime(150)
		expect(isDragging.value).toBe(true)

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
		expect(isDragging.value).toBe(false)
	})

	it('triggers trash relocation on Delete key', () => {
		const { startDrag, isDestroying } = useDragOperator()
		startDrag(mockTask, 'source-zone')
		vi.advanceTimersByTime(150)

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }))
		expect(isDestroying.value).toBe(true)
		expect(manageTaskRelocation).toHaveBeenCalledWith('source-zone', 'trash', expect.anything(), null)
	})
})
