import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import DayViewPage from '../DayViewPage.vue'
import { useTasksStore } from '../../stores/tasks'
import { formatDate } from '../../utils/dateUtils'

// ── Mocks ──────────────────────────────────────────────────────────
const TaskPageLayoutStub = { template: '<div><slot/><slot name="popups"/></div>' }
const DayViewStub = {
	template: '<div></div>',
	methods: { scrollToCurrentTime: vi.fn() }
}
const TrashBasketRoundStub = { template: '<div></div>' }
const TaskEditorPopupStub = { template: '<div></div>', props: ['show'] }

let router: any

beforeEach(() => {
	config.global.stubs = {
		TaskPageLayout: TaskPageLayoutStub,
		DayView: DayViewStub,
		TrashBasketRound: TrashBasketRoundStub,
		TaskEditorPopup: TaskEditorPopupStub
	}

	router = createRouter({
		history: createWebHistory(),
		routes: [{ path: '/day/:date?', name: 'day', component: DayViewPage }]
	})
})

describe('DayViewPage.vue', () => {
	it('renders DayView and layout', async () => {
		router.push('/day/2023-01-01')
		await router.isReady()

		const wrapper = mount(DayViewPage, {
			global: {
				plugins: [router, createTestingPinia({ createSpy: vi.fn })]
			}
		})

		expect(wrapper.findComponent(DayViewStub).exists()).toBe(true)
		expect(wrapper.findComponent(TrashBasketRoundStub).exists()).toBe(true)
	})

	it('updates store currentDates on mount', async () => {
		router.push('/day/2023-01-01')
		await router.isReady()

		const wrapper = mount(DayViewPage, {
			global: {
				plugins: [
					router,
					createTestingPinia({
						createSpy: vi.fn,
						initialState: {
							tasks: { currentDates: [] }
						}
					})
				]
			}
		})

		const store = useTasksStore()
		expect(store.currentDates).toEqual(['2023-01-01'])
	})

	it('defaults to today if no date param', async () => {
		router.push('/day') // No param
		await router.isReady()

		const wrapper = mount(DayViewPage, {
			global: {
				plugins: [router, createTestingPinia({ createSpy: vi.fn })]
			}
		})

		const store = useTasksStore()
		const today = formatDate(new Date())
		expect(store.currentDates).toEqual([today])
	})

	it('navigates to next day on add-day event', async () => {
		router.push('/day/2023-01-01')
		await router.isReady()

		const wrapper = mount(DayViewPage, {
			global: {
				plugins: [
					router,
					createTestingPinia({
						createSpy: vi.fn,
						initialState: {
							tasks: { currentDates: ['2023-01-01'] }
						}
					})
				]
			}
		})

		const store = useTasksStore()
		const dayView = wrapper.findComponent(DayViewStub)
		await dayView.vm.$emit('add-day')

		expect(store.addDate).toHaveBeenCalledWith('2023-01-02')
	})
})
