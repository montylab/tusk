import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { ref } from 'vue'
import ThemePanel from '../ThemePanel.vue'

// ── Mocks ──────────────────────────────────────────────────────────
const mockStartThemeTransition = vi.fn()
const mockCloseThemePanel = vi.fn()

vi.mock('../../stores/appearance', () => ({
	useAppearanceStore: () => ({
		theme: 'dark',
		interfaceScale: 100,
		colorScheme: 'default'
	}),
	THEMES: ['dark', 'light'] as const,
	SCALES: [80, 100, 120] as const,
	SCHEMES: ['default', 'vibrant'] as const
}))

vi.mock('../../stores/ui', () => ({
	useUIStore: () => ({
		isThemePanelOpen: true,
		startThemeTransition: mockStartThemeTransition,
		closeThemePanel: mockCloseThemePanel
	})
}))

vi.mock('pinia', async (importOriginal) => {
	const actual = await importOriginal<typeof import('pinia')>()
	return {
		...actual,
		storeToRefs: (store: Record<string, unknown>) => {
			const refs: Record<string, unknown> = {}
			for (const key of Object.keys(store)) {
				if (typeof store[key] !== 'function') {
					refs[key] = ref(store[key])
				}
			}
			return refs
		}
	}
})

beforeAll(() => {
	config.global.stubs = {
		Transition: false
	}
})

// ── Helpers ────────────────────────────────────────────────────────
function factory() {
	return mount(ThemePanel)
}

// ── Tests ──────────────────────────────────────────────────────────
describe('ThemePanel.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('Happy Path', () => {
		it('renders panel title "Appearance"', () => {
			const wrapper = factory()
			expect(wrapper.find('.panel-title').text()).toBe('Appearance')
		})

		it('renders theme buttons', () => {
			const wrapper = factory()
			const labels = wrapper.findAll('.switcher-label')
			expect(labels.some((l) => l.text() === 'Base Theme')).toBe(true)
		})

		it('renders scale buttons', () => {
			const wrapper = factory()
			const labels = wrapper.findAll('.switcher-label')
			expect(labels.some((l) => l.text() === 'Interface Scale')).toBe(true)
		})

		it('renders color scheme buttons', () => {
			const wrapper = factory()
			const labels = wrapper.findAll('.switcher-label')
			expect(labels.some((l) => l.text() === 'Task Style')).toBe(true)
		})

		it('calls closeThemePanel on close button click', async () => {
			const wrapper = factory()
			await wrapper.find('.close-btn').trigger('click')
			expect(mockCloseThemePanel).toHaveBeenCalled()
		})

		it('calls startThemeTransition on theme button click', async () => {
			const wrapper = factory()
			const themeButtons = wrapper.findAll('.switcher-group')[0].findAll('.theme-btn')
			await themeButtons[0].trigger('click')
			expect(mockStartThemeTransition).toHaveBeenCalled()
		})
	})
})
