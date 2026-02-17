import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppLogo from '../AppLogo.vue'

describe('AppLogo.vue', () => {
	it('renders correctly', () => {
		const wrapper = mount(AppLogo)

		expect(wrapper.find('svg.app-logo').exists()).toBe(true)
		expect(wrapper.find('path').exists()).toBe(true)
		expect(wrapper.findAll('circle').length).toBe(2)
	})
})
