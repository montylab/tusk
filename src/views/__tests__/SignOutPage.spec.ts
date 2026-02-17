import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SignOutPage from '../SignOutPage.vue'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
	useRouter: () => ({ push: mockPush })
}))

// Mock user store
const mockLogout = vi.fn().mockResolvedValue(undefined)

vi.mock('../../stores/user', () => ({
	useUserStore: () => ({
		logout: mockLogout
	})
}))

describe('SignOutPage.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockLogout.mockResolvedValue(undefined)
	})

	it('renders signing out message with loader', () => {
		const wrapper = mount(SignOutPage)

		expect(wrapper.find('.signout-page').exists()).toBe(true)
		expect(wrapper.find('.loader').exists()).toBe(true)
		expect(wrapper.text()).toContain('Signing out...')
	})

	it('calls logout and redirects to signin on mount', async () => {
		mount(SignOutPage)
		await flushPromises()

		expect(mockLogout).toHaveBeenCalled()
		expect(mockPush).toHaveBeenCalledWith({ name: 'signin' })
	})
})
