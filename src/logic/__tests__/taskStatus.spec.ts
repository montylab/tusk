import { describe, it, expect } from 'vitest'
import { getTaskStatus } from '../taskStatus'

describe('getTaskStatus', () => {
	// Helper to create a date object fro a specific time string YYYY-MM-DD HH:mm
	const createDate = (str: string) => new Date(str)

	it('Missing Data', () => {
		expect(getTaskStatus({})).toBeNull()
		expect(getTaskStatus({ startTime: 10 })).toBeNull() // Missing date
		expect(getTaskStatus({ date: '2024-01-01' })).toBeNull() // Missing startTime
	})

	it('Past Task (Previous Day)', () => {
		const result = getTaskStatus({ date: '2024-01-01', startTime: 10, duration: 60 }, createDate('2024-01-02T10:00:00'))
		expect(result).toBe('past')
	})

	it('Past Task (Same Day)', () => {
		// Task: 9:00 - 10:00
		// Now: 10:01
		const result = getTaskStatus({ date: '2024-01-02', startTime: 9, duration: 60 }, createDate('2024-01-02T10:01:00'))
		expect(result).toBe('past')
	})

	it('On-Air Task', () => {
		// Task: 10:00 - 11:00
		// Now: 10:30
		const result = getTaskStatus({ date: '2024-01-02', startTime: 10, duration: 60 }, createDate('2024-01-02T10:30:00'))
		expect(result).toBe('on-air')
	})

	it('On-Air Task (Just Started)', () => {
		// Task: 10:00 - 11:00
		// Now: 10:00
		const result = getTaskStatus({ date: '2024-01-02', startTime: 10, duration: 60 }, createDate('2024-01-02T10:00:00'))
		expect(result).toBe('on-air')
	})

	it('Future Task (Same Day)', () => {
		// Task: 12:00 - 13:00
		// Now: 10:00
		const result = getTaskStatus({ date: '2024-01-02', startTime: 12, duration: 60 }, createDate('2024-01-02T10:00:00'))
		expect(result).toBe('future')
	})

	it('Future Task (Next Day)', () => {
		const result = getTaskStatus({ date: '2024-01-03', startTime: 10, duration: 60 }, createDate('2024-01-02T10:00:00'))
		expect(result).toBe('future')
	})

	it('Edge Case: Zero Duration', () => {
		// Task: 10:00 - 10:00
		// Now: 10:01
		const result = getTaskStatus({ date: '2024-01-02', startTime: 10, duration: 0 }, createDate('2024-01-02T10:01:00'))
		expect(result).toBe('past')
	})
})
