import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTimeStore } from '../time'
import { nerve, NERVE_EVENTS } from '../../services/nerve'

// ── Mocks ──────────────────────────────────────────────────────────
vi.mock('../../services/nerve', () => ({
	nerve: {
		emit: vi.fn(),
		on: vi.fn(),
		off: vi.fn()
	},
	NERVE_EVENTS: {
		MINUTE_TICK: 'minute-tick'
	}
}))

// ── Tests ──────────────────────────────────────────────────────────
describe('time.ts', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
		vi.useFakeTimers()
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe('Happy Path', () => {
		it('initializes with current time', () => {
			const now = new Date(2023, 0, 1, 12, 0, 0)
			vi.setSystemTime(now)
			const store = useTimeStore()
			expect(store.currentTime.valueOf()).toBe(now.valueOf())
			expect(store.hoveredTimeRange).toBeNull()
		})

		it('sets hovered time range', () => {
			const store = useTimeStore()
			const range = { start: 100, duration: 60 }
			store.setHoveredTimeRange(range)
			expect(store.hoveredTimeRange).toEqual(range)
		})

		it('starts ticking (immediate update)', () => {
			const store = useTimeStore()
			store.startTicking()
			expect(nerve.emit).toHaveBeenCalledWith(NERVE_EVENTS.MINUTE_TICK, {
				date: expect.any(Date)
			})
		})

		it('schedules next tick at start of next minute', async () => {
			// Set time to 10:00:30
			const now = new Date(2023, 0, 1, 10, 0, 30)
			vi.setSystemTime(now)
			const store = useTimeStore()

			store.startTicking()
			// Immediate emit
			expect(nerve.emit).toHaveBeenCalledTimes(1)

			// Advance by 30s (to 10:01:00)
			await vi.advanceTimersByTimeAsync(30000)

			expect(nerve.emit).toHaveBeenCalledTimes(2)
			expect(nerve.emit).toHaveBeenLastCalledWith(NERVE_EVENTS.MINUTE_TICK, {
				date: expect.any(Date)
			})
			expect(new Date().getMinutes()).toBe(1)
		})

		it('continues ticking every minute', async () => {
			// Set time to 10:00:30
			const now = new Date(2023, 0, 1, 10, 0, 30)
			vi.setSystemTime(now)
			const store = useTimeStore()
			store.startTicking()

			// To 10:01:00
			await vi.advanceTimersByTimeAsync(30000)
			// To 10:02:00
			await vi.advanceTimersByTimeAsync(60000)

			expect(nerve.emit).toHaveBeenCalledTimes(3) // Init, Kickstart, Interval 1
		})

		it('stops ticking', async () => {
			const store = useTimeStore()
			store.startTicking()
			store.stopTicking()

			vi.clearAllMocks()
			await vi.advanceTimersByTimeAsync(60000)
			expect(nerve.emit).not.toHaveBeenCalled()
		})
	})
})
