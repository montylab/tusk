import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nerve, NERVE_EVENTS } from '../nerve'

describe('nerve (Event Bus)', () => {
	beforeEach(() => {
		nerve.all.clear()
	})

	describe('Constants', () => {
		it('has expected event constants', () => {
			expect(NERVE_EVENTS.TASK_CREATED).toBe('TASK_CREATED')
			expect(NERVE_EVENTS.MINUTE_TICK).toBe('MINUTE_TICK')
			expect(NERVE_EVENTS.APP_ERROR).toBe('APP_ERROR')
		})
	})

	describe('Functionality', () => {
		it('emits and listens to events', () => {
			const handler = vi.fn()
			nerve.on(NERVE_EVENTS.TASK_CREATED, handler)

			nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: '123' })
			expect(handler).toHaveBeenCalledWith({ taskId: '123' })
		})

		it('handles void events', () => {
			const handler = vi.fn()
			nerve.on(NERVE_EVENTS.TASK_MOVED, handler)

			nerve.emit(NERVE_EVENTS.TASK_MOVED)
			expect(handler).toHaveBeenCalled()
		})

		it('unsubscribes correctly', () => {
			const handler = vi.fn()
			nerve.on(NERVE_EVENTS.TASK_CREATED, handler)
			nerve.off(NERVE_EVENTS.TASK_CREATED, handler)

			nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: '123' })
			expect(handler).not.toHaveBeenCalled()
		})

		it('clears all listeners', () => {
			const h1 = vi.fn()
			const h2 = vi.fn()

			nerve.on(NERVE_EVENTS.TASK_CREATED, h1)
			nerve.on(NERVE_EVENTS.MINUTE_TICK, h2)

			nerve.all.clear()

			nerve.emit(NERVE_EVENTS.TASK_CREATED, { taskId: '1' })
			nerve.emit(NERVE_EVENTS.MINUTE_TICK, { date: new Date() })

			expect(h1).not.toHaveBeenCalled()
			expect(h2).not.toHaveBeenCalled()
		})

		it('handles multiple listeners', () => {
			const h1 = vi.fn()
			const h2 = vi.fn()

			nerve.on(NERVE_EVENTS.APP_ERROR, h1)
			nerve.on(NERVE_EVENTS.APP_ERROR, h2)

			nerve.emit(NERVE_EVENTS.APP_ERROR, { message: 'oops' })

			expect(h1).toHaveBeenCalledWith({ message: 'oops' })
			expect(h2).toHaveBeenCalledWith({ message: 'oops' })
		})
	})
})
