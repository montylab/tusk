import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppIcon from '../AppIcon.vue'

describe('AppIcon.vue', () => {
	// Happy Path
	it('renders correctly with name prop', () => {
		const wrapper = mount(AppIcon, {
			props: {
				name: 'trash'
			}
		})

		expect(wrapper.find('.app-icon').exists()).toBe(true)
		const style = wrapper.find('.app-icon').attributes('style')
		// Check for mask-image path, handling potential quotes/spaces, and webkit prefix
		expect(style).toMatch(/(-webkit-)?mask-image:\s*url\(["']?\/assets\/icons\/trash\.svg["']?\)/i)
	})

	it('applies custom color', () => {
		const wrapper = mount(AppIcon, {
			props: {
				name: 'trash',
				color: 'red'
			}
		})

		const style = wrapper.find('.app-icon').attributes('style')
		expect(style).toContain('background-color: red')
	})

	it('applies custom size', () => {
		const wrapper = mount(AppIcon, {
			props: {
				name: 'trash',
				size: '24px'
			}
		})

		const style = wrapper.find('.app-icon').attributes('style')
		expect(style).toContain('width: 24px')
		expect(style).toContain('height: 24px')
	})

	// Edge Cases
	it('uses default values when optional props are missing', () => {
		const wrapper = mount(AppIcon, {
			props: {
				name: 'trash'
			}
		})

		const style = wrapper.find('.app-icon').attributes('style') || ''
		expect(style).toMatch(/width:\s*1rem/)
		expect(style).toMatch(/height:\s*1rem/)
		expect(style.toLowerCase()).toContain('background-color: currentcolor')
	})
})
