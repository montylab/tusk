import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import ColorPickerInput from '../ColorPickerInput.vue'
import { useSettingsStore } from '../../stores/settings'

// Mock PrimeVue ColorPicker
const ColorPickerStub = {
	name: 'ColorPicker',
	template: '<div class="color-picker-stub"></div>',
	props: ['modelValue', 'inline'],
	emits: ['update:modelValue']
}

vi.mock('primevue/colorpicker', () => ({ default: ColorPickerStub }))

// Mock firebase
vi.mock('../../services/firebaseService', () => ({
	subscribeToCategories: vi.fn(),
	subscribeToSettings: vi.fn((cb) => {
		cb({ categoryColors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'] })
		return vi.fn()
	}),
	updateSettings: vi.fn()
}))

const defaultPresets = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

describe('ColorPickerInput.vue', () => {
	const mountComponent = async (props: { modelValue?: string; disabled?: boolean } = {}) => {
		const wrapper = mount(ColorPickerInput, {
			props: {
				modelValue: props.modelValue ?? '#ef4444',
				disabled: props.disabled ?? false
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							settings: {},
							user: {
								user: { uid: 'test-user', email: 'test@example.com' }
							}
						}
					})
				],
				components: {
					ColorPicker: ColorPickerStub
				}
			}
		})

		const settingsStore = useSettingsStore()

		// Use $patch to update the state reactively
		settingsStore.$patch({
			settingsData: {
				categoryColors: defaultPresets,
				snapMinutes: 15,
				defaultStartHour: 9
			}
		})

		// Force override the computed property if the patch doesn't trigger it in the mock environment
		// This ensures the component receives the correct data regardless of store internal reactivity
		Object.defineProperty(settingsStore, 'settings', {
			get: () => ({
				categoryColors: defaultPresets,
				snapMinutes: 15,
				defaultStartHour: 9
			})
		})

		settingsStore.getRandomCategoryColor = vi.fn().mockReturnValue('#abcdef')

		await nextTick()
		return wrapper
	}

	// --- Happy Path ---

	it('renders preset color swatches', async () => {
		const wrapper = await mountComponent()
		const swatches = wrapper.findAll('.color-swatch:not(.custom-swatch)')
		expect(swatches.length).toBe(defaultPresets.length)
	})

	it('selecting a preset swatch emits update:modelValue', async () => {
		const wrapper = await mountComponent()
		const swatches = wrapper.findAll('.color-swatch:not(.custom-swatch)')
		await swatches[2].trigger('click')

		const emissions = wrapper.emitted('update:modelValue')
		expect(emissions).toBeTruthy()
		// Last emission should be the clicked color
		expect(emissions![emissions!.length - 1]).toEqual([defaultPresets[2]])
	})

	it('active swatch shows checkmark', async () => {
		const wrapper = await mountComponent({ modelValue: '#ef4444' })
		const firstSwatch = wrapper.findAll('.color-swatch:not(.custom-swatch)')[0]
		expect(firstSwatch.classes()).toContain('active')
		expect(firstSwatch.find('.check-icon').exists()).toBe(true)
	})

	it('toggling custom picker button shows popup', async () => {
		const wrapper = await mountComponent()
		const customBtn = wrapper.find('.custom-swatch')

		expect(wrapper.find('.custom-picker-popup').exists()).toBe(false)

		await customBtn.trigger('click')
		await nextTick()

		expect(wrapper.find('.custom-picker-popup').exists()).toBe(true)
	})

	it('toggling custom picker again hides popup', async () => {
		const wrapper = await mountComponent()
		const customBtn = wrapper.find('.custom-swatch')

		await customBtn.trigger('click')
		await nextTick()
		expect(wrapper.find('.custom-picker-popup').exists()).toBe(true)

		await customBtn.trigger('click')
		await nextTick()
		expect(wrapper.find('.custom-picker-popup').exists()).toBe(false)
	})

	it('custom color update emits with # prefix', async () => {
		const wrapper = await mountComponent()
		const customBtn = wrapper.find('.custom-swatch')
		await customBtn.trigger('click')
		await nextTick()

		const picker = wrapper.findComponent(ColorPickerStub)
		await picker.vm.$emit('update:modelValue', 'aabb00')
		await nextTick()

		const emissions = wrapper.emitted('update:modelValue')
		expect(emissions).toBeTruthy()
		expect(emissions![emissions!.length - 1]).toEqual(['#aabb00'])
	})

	// --- Edge Cases ---

	it('empty modelValue emits random color on mount', async () => {
		const wrapper = mount(ColorPickerInput, {
			props: { modelValue: '' },
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							settings: {
								settings: { categoryColors: defaultPresets }
							}
						}
					})
				],
				components: { ColorPicker: ColorPickerStub }
			}
		})
		await nextTick()

		const emissions = wrapper.emitted('update:modelValue')
		expect(emissions).toBeTruthy()
		expect(emissions!.length).toBeGreaterThanOrEqual(1)
		// Should have a valid color
		expect(emissions![0][0]).toMatch(/^#[0-9a-fA-F]{6}$/)
	})

	it('disabled state prevents selection', async () => {
		const wrapper = await mountComponent({ disabled: true })
		const swatches = wrapper.findAll('.color-swatch:not(.custom-swatch)')
		await swatches[1].trigger('click')

		// Should NOT have any new emissions (the component checks props.disabled)
		const emissions = wrapper.emitted('update:modelValue')
		expect(emissions).toBeFalsy()
	})

	it('prop change updates internal localColor', async () => {
		const wrapper = await mountComponent({ modelValue: '#ef4444' })
		await wrapper.setProps({ modelValue: '#22c55e' })
		await nextTick()

		// The green swatch should now be active
		const swatches = wrapper.findAll('.color-swatch:not(.custom-swatch)')
		const greenIndex = defaultPresets.indexOf('#22c55e')
		expect(swatches[greenIndex].classes()).toContain('active')
	})

	it('selecting preset closes custom picker if open', async () => {
		const wrapper = await mountComponent()

		// Open custom picker
		await wrapper.find('.custom-swatch').trigger('click')
		await nextTick()
		expect(wrapper.find('.custom-picker-popup').exists()).toBe(true)

		// Select a preset
		const swatches = wrapper.findAll('.color-swatch:not(.custom-swatch)')
		await swatches[0].trigger('click')
		await nextTick()

		expect(wrapper.find('.custom-picker-popup').exists()).toBe(false)
	})
})
