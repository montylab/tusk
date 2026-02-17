import { describe, it, expect, vi } from 'vitest'
import {
	formatDate,
	isToday,
	getNextDay,
	getMonday,
	getWeekDays,
	getMonthCalendarGrid,
	formatTime,
	formatDuration,
	isTimePast,
	getTimeSnapped
} from '../dateUtils'

describe('dateUtils.ts', () => {
	it('formatDate formats correctly', () => {
		const d = new Date(2023, 0, 1) // Jan 1 2023
		expect(formatDate(d)).toBe('2023-01-01')
	})

	it('isToday checks user system date', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(2023, 0, 1))
		expect(isToday('2023-01-01')).toBe(true)
		expect(isToday('2023-01-02')).toBe(false)
		vi.useRealTimers()
	})

	it('getNextDay increments date', () => {
		expect(getNextDay('2023-01-31')).toBe('2023-02-01')
	})

	it('getMonday returns previous Monday', () => {
		// Jan 4 2023 is Wednesday. Monday was Jan 2.
		const d = new Date(2023, 0, 4)
		const mon = getMonday(d)
		expect(formatDate(mon)).toBe('2023-01-02')
	})

	it('getWeekDays returns 7 days', () => {
		const mon = new Date(2023, 0, 2)
		const days = getWeekDays(mon)
		expect(days).toHaveLength(7)
		expect(days[0]).toBe('2023-01-02')
		expect(days[6]).toBe('2023-01-08')
	})

	it('getMonthCalendarGrid returns correct grid structure', () => {
		// Jan 2023 starts on Sunday.
		// Logic: Monday start. Sunday is index 6.
		// Start day of week: Sunday(0) - 1 = -1 -> 6.
		// So first day of grid is 6 days before Jan 1.
		// Jan 1 - 6 days = Dec 26 2022.

		const grid = getMonthCalendarGrid(2023, 0) // Jan 2023
		expect(grid.length).toBeGreaterThanOrEqual(5)
		expect(grid[0][0]).toBe('2022-12-26')
		expect(grid[0][6]).toBe('2023-01-01')
	})

	it('getTimeSnapped snaps to interval', () => {
		const d = new Date(2023, 0, 1, 10, 7) // 10:07
		// 10*60 + 7 = 607 min. / 15 = 40.46 -> 40 * 15 = 600 min = 10:00.
		// 40.46 rounds to 40.
		// Wait, 7 is closer to 0 than 15.
		// If 10:08 (608), 608/15=40.53 -> 41 * 15 = 615 = 10:15.
		expect(getTimeSnapped(d, 15)).toBe(10) // 10.0

		const d2 = new Date(2023, 0, 1, 10, 8)
		expect(getTimeSnapped(d2, 15)).toBe(10.25) // 10:15
	})

	it('formatTime formats decimal hours', () => {
		expect(formatTime(10.5)).toBe('10:30')
		expect(formatTime(0)).toBe('0:00')
		expect(formatTime(23.75)).toBe('23:45')
	})

	it('formatDuration formats minutes', () => {
		expect(formatDuration(90)).toBe('1h 30m')
		expect(formatDuration(60)).toBe('1h')
		expect(formatDuration(45)).toBe('45m')
		expect(formatDuration(0)).toBe('0m')
	})

	it('isTimePast checks against current time', () => {
		vi.useFakeTimers()
		const now = new Date(2023, 0, 1, 12, 0)
		vi.setSystemTime(now)

		// Same day, past hour
		expect(isTimePast('2023-01-01', 11, now)).toBe(true)
		// Same day, future hour
		expect(isTimePast('2023-01-01', 13, now)).toBe(false)
		// Past day
		expect(isTimePast('2022-12-31', 13, now)).toBe(true)
		// Future day
		expect(isTimePast('2023-01-02', 10, now)).toBe(false)

		vi.useRealTimers()
	})
})
