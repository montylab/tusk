import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ColorSchemeDebug from '../ColorSchemeDebug.vue'
import { createTestingPinia } from '@pinia/testing'
import { useCategoriesStore } from '../../stores/categories'

// Mock DayColumn to avoid deep rendering
const DayColumnStub = {
	template: '<div class="day-column-stub"></div>',
	props: ['tasks', 'date']
}

describe('ColorSchemeDebug.vue', () => {
	let wrapper: any
	let categoriesStore: any

	beforeEach(() => {
		wrapper = mount(ColorSchemeDebug, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						initialState: {
							categories: {
								categoriesMap: {
									'1': { id: '1', name: 'Work', color: 'red' },
									'2': { id: '2', name: 'Personal', color: 'blue' }
								}
							}
						}
					})
				],
				stubs: {
					DayColumn: DayColumnStub
				}
			}
		})
		categoriesStore = useCategoriesStore()
	})

	it('Initial Rendering', () => {
		expect(wrapper.find('h1').text()).toBe('Color Scheme Debug')

		// Check buttons
		const buttons = wrapper.findAll('.control-btn')
		expect(buttons.length).toBe(4)
		expect(buttons[0].text()).toBe('Default')
		expect(buttons[1].text()).toBe('Tailwind')

		// Check Columns
		const columns = wrapper.findAll('.debug-col')
		// 3 fixed (Past, Active, Future) + 2 categories + 6 random schedules = 11
		expect(columns.length).toBe(11)

		expect(columns[0].find('h3').text()).toBe('All Past')
		expect(columns[1].find('h3').text()).toBe('All Active')
		expect(columns[2].find('h3').text()).toBe('All Future')
		expect(columns[3].find('h3').text()).toBe('Work')
		expect(columns[4].find('h3').text()).toBe('Personal')
	})

	it('Remap Palette Interaction', async () => {
		const buttons = wrapper.findAll('.control-btn')

		// Click Tailwind (index 1)
		await buttons[1].trigger('click')

		expect(categoriesStore.remapCategoriesToPalette).toHaveBeenCalled()
	})

	it('Data Generation Verification', () => {
		// Check props passed to DayColumn stubs
		const stubs = wrapper.findAllComponents(DayColumnStub)

		// Stub 0: All Past
		const pastProps = stubs[0].props()
		expect(pastProps.tasks).toHaveLength(2) // Work, Personal
		expect(pastProps.tasks[0].id).toContain('past-')

		// Stub 3: Work Category
		const workProps = stubs[3].props()
		expect(workProps.tasks).toHaveLength(3) // Past, On-Air, Future tasks for this category

		console.log(workProps.tasks)
	})

	it('Empty Categories Edge Case', () => {
		const emptyWrapper = mount(ColorSchemeDebug, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						initialState: {
							categories: {
								categoriesMap: {}
							}
						}
					})
				],
				stubs: {
					DayColumn: DayColumnStub
				}
			}
		})

		const columns = emptyWrapper.findAll('.debug-col')
		// 3 fixed + 0 category + 0 schedules (mockSchedules returns empty if no categories)
		expect(columns.length).toBe(3)
	})
})
