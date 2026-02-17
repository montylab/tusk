import { describe, it, expect, beforeAll } from 'vitest'
import { mount, config } from '@vue/test-utils'
import AppCheckbox from '../AppCheckbox.vue'
import Checkbox from 'primevue/checkbox'
import PrimeVue from 'primevue/config'

// Setup global config for all tests in this file
beforeAll(() => {
	config.global.plugins = [PrimeVue]
	config.global.components = { Checkbox }
})

describe('AppCheckbox.vue', () => {
	// Happy Path
	it('renders a checkbox in unchecked state by default', () => {
		const wrapper = mount(AppCheckbox, {
			props: {
				modelValue: false
			}
		})

		expect(wrapper.find('.app-checkbox-wrapper').exists()).toBe(true)
		const checkbox = wrapper.findComponent(Checkbox)
		expect(checkbox.exists()).toBe(true)
		expect(checkbox.props('modelValue')).toBe(false)
	})

	it('renders label and description when provided', () => {
		const label = 'Accept Terms'
		const description = 'Read carefully'
		const wrapper = mount(AppCheckbox, {
			props: {
				modelValue: false,
				label,
				description
			}
		})

		expect(wrapper.find('.app-checkbox-label').text()).toBe(label)
		expect(wrapper.find('.app-checkbox-description').text()).toBe(description)
	})

	it('emits update:modelValue when clicked', async () => {
		const wrapper = mount(AppCheckbox, {
			props: {
				modelValue: false
			}
		})

		// Simulate update from inner PrimeVue Checkbox
		await wrapper.findComponent(Checkbox).vm.$emit('update:modelValue', true)

		expect(wrapper.emitted('update:modelValue')).toBeTruthy()
		expect(wrapper.emitted('update:modelValue')![0]).toEqual([true])
	})

	// Edge Cases
	it('applies disabled style and prop when disabled', () => {
		const wrapper = mount(AppCheckbox, {
			props: {
				modelValue: false,
				disabled: true
			}
		})

		expect(wrapper.find('.app-checkbox-wrapper').classes()).toContain('is-disabled')
		expect(wrapper.findComponent(Checkbox).props('disabled')).toBe(true)
	})

	it('uses custom inputId when provided', () => {
		const inputId = 'my-check'
		const wrapper = mount(AppCheckbox, {
			props: {
				modelValue: false,
				label: 'Label',
				inputId
			}
		})

		expect(wrapper.findComponent(Checkbox).props('inputId')).toBe(inputId)
		expect(wrapper.find('label').attributes('for')).toBe(inputId)
	})

	it('generates an ID if not provided', () => {
		const wrapper = mount(AppCheckbox, {
			props: {
				modelValue: false,
				label: 'Label'
			}
		})

		const generatedId = wrapper.findComponent(Checkbox).props('inputId')
		expect(generatedId).toMatch(/^app-checkbox-/)
		expect(wrapper.find('label').attributes('for')).toBe(generatedId)
	})
})
