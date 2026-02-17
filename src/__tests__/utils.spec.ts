import { describe, it, expect } from 'vitest'
import { getRandomCategory } from '../utils'

describe('utils.ts', () => {
	it('getRandomCategory returns one of the predefined categories', () => {
		const validCategories = ['Work', 'Personal', 'Urgent', 'Learning']

		for (let i = 0; i < 20; i++) {
			const result = getRandomCategory()
			expect(validCategories).toContain(result)
		}
	})

	it('getRandomCategory returns a string', () => {
		const result = getRandomCategory()
		expect(typeof result).toBe('string')
	})
})
