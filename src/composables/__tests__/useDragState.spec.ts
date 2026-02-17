import { describe, it, expect, beforeEach } from 'vitest'
import { useDragState } from '../useDragState'

describe('useDragState', () => {
	const { trashBounds, todoBounds, overZone, updateCollision, resetCollisions, isOverTrash } = useDragState()

	beforeEach(() => {
		trashBounds.value = null
		todoBounds.value = null
		resetCollisions()
	})

	it('initializes with null state', () => {
		expect(overZone.value).toBeNull()
		expect(isOverTrash.value).toBe(false)
	})

	it('detects collision with trash zone', () => {
		trashBounds.value = { left: 10, top: 10, right: 100, bottom: 100 } as DOMRect

		updateCollision(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }))
		expect(overZone.value).toBe('trash')
		expect(isOverTrash.value).toBe(true)
	})

	it('resets collisions', () => {
		trashBounds.value = { left: 10, top: 10, right: 100, bottom: 100 } as DOMRect
		updateCollision(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }))
		expect(overZone.value).toBe('trash')

		resetCollisions()
		expect(overZone.value).toBeNull()
	})

	it('handles multiple zones with priority (trash first)', () => {
		trashBounds.value = { left: 10, top: 10, right: 100, bottom: 100 } as DOMRect
		todoBounds.value = { left: 0, top: 0, right: 200, bottom: 200 } as DOMRect

		// Point is in both, but trash is checked first in updateCollision
		updateCollision(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }))
		expect(overZone.value).toBe('trash')
	})

	it('sets overZone to null if no collision', () => {
		trashBounds.value = { left: 10, top: 10, right: 100, bottom: 100 } as DOMRect
		updateCollision(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }))
		expect(overZone.value).toBeNull()
	})
})
