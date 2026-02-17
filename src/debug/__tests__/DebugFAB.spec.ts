import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DebugFAB from '../DebugFAB.vue'
import { nextTick } from 'vue'

// Mock AppIcon
const AppIconStub = {
	template: '<span class="app-icon-stub"><slot /></span>',
	props: ['name', 'size']
}

// Mock Router
const pushMock = vi.fn()
const RouterLinkStub = {
	template: '<a @click="navigate"><slot /></a>',
	props: ['to'],
	setup(props: any) {
		return {
			navigate: () => pushMock(props.to)
		}
	}
}

describe('DebugFAB.vue', () => {
	let wrapper: any

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks()

		// We can't easily mock import.meta.env.DEV in Vitest without special setup or using `vi.stubGlobal` if it was a global.
		// However, `import.meta` is special.
		// Often components using `import.meta.env` are hard to test for both states without build-time configuration.
		// For this test, we assume the test environment (Vitest) sets DEV=true by default or we might need to rely on that.
		// Alternatively, we can rely on `vi.stubEnv` if it supports it, but `import.meta` is tricky.
		// Let's assume DEV is true for now (standard test env).

		wrapper = mount(DebugFAB, {
			global: {
				stubs: {
					AppIcon: AppIconStub,
					RouterLink: RouterLinkStub,
					Transition: true // Stub transition to avoid async issues
				}
			}
		})
	})

	it('Component Rendering (Dev Mode)', () => {
		// Check FAB button
		const fab = wrapper.find('.debug-fab')
		expect(fab.exists()).toBe(true)

		// Check initial state
		expect(wrapper.vm.isOpen).toBe(false)
		expect(wrapper.find('.debug-popover').exists()).toBe(false)
	})

	it('Toggle Menu', async () => {
		const fab = wrapper.find('.debug-fab')

		// Click to open
		await fab.trigger('click')
		expect(wrapper.vm.isOpen).toBe(true)
		expect(wrapper.find('.debug-popover').exists()).toBe(true)

		// Click to close
		await fab.trigger('click')
		expect(wrapper.vm.isOpen).toBe(false)
		expect(wrapper.find('.debug-popover').exists()).toBe(false)
	})

	it('Navigation Links', async () => {
		// Open menu
		const fab = wrapper.find('.debug-fab')
		await fab.trigger('click')

		// Check links
		const links = wrapper.findAllComponents(RouterLinkStub)
		expect(links.length).toBeGreaterThan(0)

		// Click a link
		await links[0].trigger('click')

		// Verify navigation (via router link stub behavior mock)
		// Note: RouterLinkStub logic above calls pushMock.
		// In real app router-link handles it.
		// We verify that isOpen becomes false.
		expect(wrapper.vm.isOpen).toBe(false)
	})

	it('Click Outside to Close', async () => {
		// Open menu
		const fab = wrapper.find('.debug-fab')
		await fab.trigger('click')
		expect(wrapper.vm.isOpen).toBe(true)

		// Create a click event on document body
		// We need to verify `handleClickOutside` logic.
		// It checks `fabRef.contains(event.target)`.

		// Simulate click on document
		const event = new MouseEvent('mousedown', { bubbles: true })
		document.dispatchEvent(event)
		await nextTick()

		expect(wrapper.vm.isOpen).toBe(false)

		// Verify click INSIDE doesn't close (except toggle button which is handled by click).
		// The mousedown listener is creating the "click outside" behavior.

		// Re-open
		await fab.trigger('click')
		await nextTick()

		// Click inside popover
		const popover = wrapper.find('.debug-popover')
		// We need to mock event target.
		// Dispatching event on the element itself:
		popover.element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
		await nextTick()

		expect(wrapper.vm.isOpen).toBe(true)
	})

	it('Unmount Cleanup', () => {
		const removeSpy = vi.spyOn(document, 'removeEventListener')
		wrapper.unmount()
		expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
	})
})
