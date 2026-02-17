import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SignInPage from '../SignInPage.vue'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
	useRouter: () => ({ push: mockPush })
}))

// Mock AppLogo
vi.mock('../../components/common/AppLogo.vue', () => ({
	default: { template: '<div class="app-logo-stub" />' }
}))

// Mock user store
const mockLoginWithGoogle = vi.fn()
const mockSignInWithEmail = vi.fn()
const mockSignUpWithEmail = vi.fn()
let mockUser: any = null

vi.mock('../../stores/user', () => ({
	useUserStore: () => ({
		get user() {
			return mockUser
		},
		loginWithGoogle: mockLoginWithGoogle,
		signInWithEmail: mockSignInWithEmail,
		signUpWithEmail: mockSignUpWithEmail
	})
}))

describe('SignInPage.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockUser = null
	})

	function mountPage() {
		return mount(SignInPage)
	}

	// --- Happy Path ---

	it('renders sign-in form by default', () => {
		const wrapper = mountPage()

		expect(wrapper.find('#email').exists()).toBe(true)
		expect(wrapper.find('#password').exists()).toBe(true)
		expect(wrapper.find('.submit-btn').text()).toBe('Sign In')
		expect(wrapper.text()).toContain('Welcome back')
	})

	it('toggles to Sign Up mode', async () => {
		const wrapper = mountPage()

		await wrapper.find('.text-link').trigger('click')

		expect(wrapper.find('.submit-btn').text()).toBe('Create Account')
		expect(wrapper.text()).toContain('Join the community')
	})

	it('successful email sign-in redirects to home', async () => {
		mockSignInWithEmail.mockImplementation(async () => {
			mockUser = { uid: 'test' }
		})
		const wrapper = mountPage()

		await wrapper.find('#email').setValue('test@example.com')
		await wrapper.find('#password').setValue('password123')
		await wrapper.find('form').trigger('submit')
		await flushPromises()

		expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123')
		expect(mockPush).toHaveBeenCalledWith('/')
	})

	it('successful email sign-up redirects to home', async () => {
		mockSignUpWithEmail.mockImplementation(async () => {
			mockUser = { uid: 'test' }
		})
		const wrapper = mountPage()

		// Toggle to sign-up mode
		await wrapper.find('.text-link').trigger('click')

		await wrapper.find('#email').setValue('new@example.com')
		await wrapper.find('#password').setValue('password123')
		await wrapper.find('form').trigger('submit')
		await flushPromises()

		expect(mockSignUpWithEmail).toHaveBeenCalledWith('new@example.com', 'password123')
		expect(mockPush).toHaveBeenCalledWith('/')
	})

	it('google login triggers and redirects', async () => {
		mockLoginWithGoogle.mockImplementation(async () => {
			mockUser = { uid: 'google-user' }
		})
		const wrapper = mountPage()

		await wrapper.find('.google-btn').trigger('click')
		await flushPromises()

		expect(mockLoginWithGoogle).toHaveBeenCalled()
		expect(mockPush).toHaveBeenCalledWith('/')
	})

	// --- Edge Cases ---

	it('shows error when fields are empty', async () => {
		const wrapper = mountPage()

		// Leave fields empty and submit
		await wrapper.find('form').trigger('submit')
		await flushPromises()

		expect(wrapper.find('.error-text').text()).toBe('Please fill in all fields')
		expect(mockSignInWithEmail).not.toHaveBeenCalled()
	})

	it('shows error on failed email auth', async () => {
		mockSignInWithEmail.mockRejectedValue(new Error('Invalid credentials'))
		const wrapper = mountPage()

		await wrapper.find('#email').setValue('bad@example.com')
		await wrapper.find('#password').setValue('wrong')
		await wrapper.find('form').trigger('submit')
		await flushPromises()

		expect(wrapper.find('.error-text').text()).toBe('Invalid credentials')
	})

	it('shows error on failed Google login', async () => {
		mockLoginWithGoogle.mockRejectedValue(new Error('Popup closed'))
		const wrapper = mountPage()

		await wrapper.find('.google-btn').trigger('click')
		await flushPromises()

		expect(wrapper.find('.error-text').text()).toBe('Popup closed')
	})

	it('disables buttons during loading', async () => {
		// Make signIn hang to keep loading state active
		mockSignInWithEmail.mockImplementation(() => new Promise(() => {}))
		const wrapper = mountPage()

		await wrapper.find('#email').setValue('test@test.com')
		await wrapper.find('#password').setValue('pass')
		await wrapper.find('form').trigger('submit')
		// Don't flush — keep the promise pending

		expect(wrapper.find('.submit-btn').attributes('disabled')).toBeDefined()
		expect(wrapper.find('.google-btn').attributes('disabled')).toBeDefined()
	})

	it('clears error message on mode toggle', async () => {
		const wrapper = mountPage()

		// Trigger an error
		await wrapper.find('form').trigger('submit')
		await flushPromises()
		expect(wrapper.find('.error-text').exists()).toBe(true)

		// Toggle mode
		await wrapper.find('.text-link').trigger('click')

		expect(wrapper.find('.error-text').exists()).toBe(false)
	})

	it('redirects to home if already logged in on mount', async () => {
		mockUser = { uid: 'existing-user' }
		mountPage()
		await flushPromises()

		expect(mockPush).toHaveBeenCalledWith('/')
	})
})
