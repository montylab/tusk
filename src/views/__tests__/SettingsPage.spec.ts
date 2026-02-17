import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { mount, config } from '@vue/test-utils'
import SettingsPage from '../SettingsPage.vue'
import Checkbox from 'primevue/checkbox'
import PrimeVue from 'primevue/config'

// Mock CategoriesManager as a stub
vi.mock('../../components/CategoriesManager.vue', () => ({
	default: { template: '<div class="categories-manager-stub" />' }
}))

// Mock stores
const mockUpdateSettings = vi.fn()
const mockStartThemeTransition = vi.fn()

vi.mock('../../stores/settings', () => ({
	useSettingsStore: () => ({
		settings: {
			defaultStartHour: 9,
			snapMinutes: 15,
			notifications: {
				enabled: false,
				taskStarted: false,
				taskEnded: false
			},
			sounds: {
				enabled: false,
				taskStarted: false,
				taskEnded: false,
				taskDeleted: false
			}
		},
		updateSettings: mockUpdateSettings
	})
}))

vi.mock('../../stores/appearance', () => ({
	useAppearanceStore: () => ({
		theme: 'dark',
		interfaceScale: 100
	}),
	ThemeType: {}
}))

vi.mock('../../stores/ui', () => ({
	useUIStore: () => ({
		startThemeTransition: mockStartThemeTransition
	})
}))

// We need pinia for storeToRefs to work, but since we mock the stores,
// we provide a real pinia so storeToRefs doesn't fail.
vi.mock('pinia', async (importOriginal) => {
	const actual = (await importOriginal()) as any
	return {
		...actual,
		storeToRefs: (store: any) => {
			const { ref } = require('vue')
			const refs: Record<string, any> = {}
			for (const key in store) {
				if (typeof store[key] !== 'function') {
					refs[key] = ref(store[key])
				}
			}
			return refs
		}
	}
})

beforeAll(() => {
	config.global.plugins = [PrimeVue]
	config.global.components = { Checkbox }
})

describe('SettingsPage.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	function mountPage() {
		return mount(SettingsPage, {
			global: {
				stubs: {
					CategoriesManager: { template: '<div class="categories-manager-stub" />' }
				}
			}
		})
	}

	// --- Happy Path ---

	it('renders all settings sections', () => {
		const wrapper = mountPage()

		expect(wrapper.find('.settings-page').exists()).toBe(true)
		expect(wrapper.text()).toContain('Calendar Settings')
		expect(wrapper.text()).toContain('Appearance & Interface')
		expect(wrapper.text()).toContain('Notifications & Sounds')
	})

	it('renders Default Day Start Hour input with correct value', () => {
		const wrapper = mountPage()
		const input = wrapper.find('#start-hour')

		expect(input.exists()).toBe(true)
		expect((input.element as HTMLInputElement).value).toBe('9')
	})

	it('updates Default Start Hour on valid change', async () => {
		const wrapper = mountPage()
		const input = wrapper.find('#start-hour')

		await input.setValue('7')
		await input.trigger('change')

		expect(mockUpdateSettings).toHaveBeenCalledWith({ defaultStartHour: 7 })
	})

	it('renders theme select with current value', () => {
		const wrapper = mountPage()
		const select = wrapper.find('#theme')

		expect(select.exists()).toBe(true)
		expect((select.element as HTMLSelectElement).value).toBe('dark')
	})

	it('calls startThemeTransition on theme change', async () => {
		const wrapper = mountPage()
		const select = wrapper.find('#theme')

		await select.setValue('light')
		await select.trigger('change')

		expect(mockStartThemeTransition).toHaveBeenCalled()
		const args = mockStartThemeTransition.mock.calls[0]
		expect(args[2]).toBe('light')
	})

	it('renders interface scale select', () => {
		const wrapper = mountPage()
		const select = wrapper.find('#interface-scale')

		expect(select.exists()).toBe(true)
		expect((select.element as HTMLSelectElement).value).toBe('100')
	})

	it('renders CategoriesManager component', () => {
		const wrapper = mountPage()
		expect(wrapper.find('.categories-manager-stub').exists()).toBe(true)
	})

	// --- Edge Cases ---

	it('does not call updateSettings for invalid start hour (negative)', async () => {
		const wrapper = mountPage()
		const input = wrapper.find('#start-hour')

		// Set value directly on element to bypass HTML min constraint
		;(input.element as HTMLInputElement).value = '-1'
		await input.trigger('change')

		expect(mockUpdateSettings).not.toHaveBeenCalled()
	})

	it('does not call updateSettings for invalid start hour (>23)', async () => {
		const wrapper = mountPage()
		const input = wrapper.find('#start-hour')

		;(input.element as HTMLInputElement).value = '24'
		await input.trigger('change')

		expect(mockUpdateSettings).not.toHaveBeenCalled()
	})

	it('hides granular notification settings when notifications disabled', () => {
		const wrapper = mountPage()

		// With notifications.enabled = false (default in our mock),
		// granular settings should not be rendered
		const notificationGroup = wrapper.findAll('.settings-sub-group')[0]
		expect(notificationGroup.find('.granular-settings').exists()).toBe(false)
	})

	it('hides granular sound settings when sounds disabled', () => {
		const wrapper = mountPage()

		// With sounds.enabled = false (default in our mock),
		// granular settings should not be rendered
		const soundGroup = wrapper.findAll('.settings-sub-group')[1]
		expect(soundGroup.find('.granular-settings').exists()).toBe(false)
	})
})
