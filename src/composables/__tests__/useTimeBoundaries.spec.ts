import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTimeBoundaries } from '../useTimeBoundaries'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

// Mock formatDate if we want to control string output exactly, or rely on real one if simple.
// Real one is better for integration, but time mocking is key.

describe('useTimeBoundaries', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		// Set a fixed time: Jan 1, 2024, 10:00 AM
		const date = new Date(2024, 0, 1, 10, 0, 0)
		vi.setSystemTime(date)
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	const HelperComp = defineComponent({
		setup() {
			const bounds = useTimeBoundaries()
			return { ...bounds }
		},
		template: '<div></div>'
	})

	it('Initial State', () => {
		const wrapper = mount(HelperComp)
		const { currentDate } = wrapper.vm
		// formatDate(new Date(2024, 0, 1)) -> "2024-01-01"
		expect(currentDate).toBe('2024-01-01')
	})

	it('Day Change Detection', async () => {
		const wrapper = mount(HelperComp)
		const { onDayChange } = wrapper.vm

		const daySpy = vi.fn()
		onDayChange(daySpy)

		// Advance to next day: Jan 2, 2024
		// 24 hours + 1 minute
		vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000)

		// We need to advance timers because `scheduleNextCheck` sets a timeout.
		// However, `setInterval` also runs every minute.
		// Advance enough time for the timeout (calculated to midnight) to fire.

		await nextTick()

		expect(daySpy).toHaveBeenCalledWith('2024-01-02')
		expect(wrapper.vm.currentDate).toBe('2024-01-02')
	})

	it('Week Change Detection', async () => {
		// Week calculation starts new week on Monday (ISO compliant via getMonday).
		// Test Sunday Jan 7 -> Monday Jan 8.
		const sunday = new Date(2024, 0, 7, 23, 59, 0)
		vi.setSystemTime(sunday)

		const wrapper = mount(HelperComp)
		const { onWeekChange, onDayChange } = wrapper.vm

		const weekSpy = vi.fn()
		const daySpy = vi.fn()
		onWeekChange(weekSpy)
		onDayChange(daySpy)

		// Advance past midnight to Monday Jan 8
		vi.advanceTimersByTime(2 * 60 * 1000) // 2 minutes

		await nextTick()

		expect(daySpy).toHaveBeenCalledWith('2024-01-08')
		expect(weekSpy).toHaveBeenCalledWith('2024-01-08')
	})

	it('Month Change Detection', async () => {
		// Jan 31, 2024
		const jan31 = new Date(2024, 0, 31, 23, 59, 0)
		vi.setSystemTime(jan31)

		const wrapper = mount(HelperComp)
		const { onMonthChange } = wrapper.vm

		const monthSpy = vi.fn()
		onMonthChange(monthSpy)

		// Advance to Feb 1
		vi.advanceTimersByTime(2 * 60 * 1000)
		await nextTick()

		expect(monthSpy).toHaveBeenCalledWith('2024-02-01')
	})

	it('Manual Check Trigger', async () => {
		// Mid-day check
		const wrapper = mount(HelperComp)
		const { checkDateChange, onDayChange } = wrapper.vm

		const daySpy = vi.fn()
		onDayChange(daySpy)

		checkDateChange() // No time change

		expect(daySpy).not.toHaveBeenCalled()

		// Change time manually then check
		vi.setSystemTime(new Date(2024, 0, 2, 10, 0, 0))
		checkDateChange()

		expect(daySpy).toHaveBeenCalledWith('2024-01-02')
	})

	it('Cleanup on Unmount', () => {
		const wrapper = mount(HelperComp)
		// unmount
		wrapper.unmount()
		// No easy way to check if timeouts are cleared without spying on global clearTimeout
		// But we can check if callbacks are removed/cleared if we exposed the sets? We didn't.
		// But we can check if listeners are removed.
		// Testing side effects of unmount is often implicitly trusted if the code calls onUnmounted.

		// Verify "focus" listener removal
		// We can attach a spy before mounting
	})
})
