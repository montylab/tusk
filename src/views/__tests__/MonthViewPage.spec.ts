import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import MonthViewPage from '../MonthViewPage.vue'
import { useTasksStore } from '../../stores/tasks'

// ── Mocks ──────────────────────────────────────────────────────────
const MonthCalendarStub = {
	template: '<div></div>',
	props: ['year', 'month', 'tasksByDate']
}
const TaskEditorPopupStub = { template: '<div></div>', props: ['show'] }

let router: any

beforeEach(() => {
	config.global.stubs = {
		MonthCalendar: MonthCalendarStub,
		TaskEditorPopup: TaskEditorPopupStub
	}

	router = createRouter({
		history: createWebHistory(),
		routes: [{ path: '/month/:year?/:month?', name: 'month-ymd', component: MonthViewPage }]
	})
})

describe('MonthViewPage.vue', () => {
	it('parses year/month from route', async () => {
		router.push('/month/2023/01')
		await router.isReady()

		const wrapper = mount(MonthViewPage, {
			global: {
				plugins: [router, createTestingPinia({ createSpy: vi.fn })]
			}
		})

		const calendar = wrapper.findComponent(MonthCalendarStub)
		expect(calendar.props('year')).toBe(2023)
		// Month is 0-indexed in component logic, but 1-indexed in URL (01 -> 0)
		expect(calendar.props('month')).toBe(0)
	})

	it('updates store currentDates with grid', async () => {
		router.push('/month/2023/01')
		await router.isReady()

		const wrapper = mount(MonthViewPage, {
			global: {
				plugins: [router, createTestingPinia({ createSpy: vi.fn })]
			}
		})

		const store = useTasksStore()
		expect(store.currentDates.length).toBeGreaterThan(28) // Should contain full grid
	})

	it('navigates to next month', async () => {
		router.push('/month/2023/01')
		await router.isReady()

		const wrapper = mount(MonthViewPage, {
			global: {
				plugins: [router, createTestingPinia({ createSpy: vi.fn })]
			}
		})

		const pushSpy = vi.spyOn(router, 'replace')
		const calendar = wrapper.findComponent(MonthCalendarStub)
		await calendar.vm.$emit('next-month')

		expect(pushSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'month-ymd',
				params: expect.objectContaining({
					year: '2023',
					month: '02'
				})
			})
		)
	})

	it('handles year rollover (Dec -> Jan)', async () => {
		router.push('/month/2023/12')
		await router.isReady()

		const wrapper = mount(MonthViewPage, {
			global: {
				plugins: [router, createTestingPinia({ createSpy: vi.fn })]
			}
		})

		const pushSpy = vi.spyOn(router, 'replace')
		const calendar = wrapper.findComponent(MonthCalendarStub)
		await calendar.vm.$emit('next-month')

		expect(pushSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'month-ymd',
				params: expect.objectContaining({
					year: '2024',
					month: '01'
				})
			})
		)
	})
})
