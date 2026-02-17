import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TimeHoverTracker from '../TimeHoverTracker.vue'
import { useTimeStore } from '../../../stores/time'

describe('TimeHoverTracker.vue', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('sets hovered time range on mouseenter', async () => {
		const wrapper = mount(TimeHoverTracker, {
			props: {
				start: 540,
				duration: 60
			},
			slots: {
				default: `<template #default="{ events }">
          <div data-testid="trigger" v-on="events">Hover Me</div>
        </template>`
			},
			global: {
				plugins: [createTestingPinia({ createSpy: vi.fn })]
			}
		})

		const timeStore = useTimeStore()
		const trigger = wrapper.find('[data-testid="trigger"]')

		await trigger.trigger('mouseenter')

		expect(timeStore.setHoveredTimeRange).toHaveBeenCalledWith({
			start: 540,
			duration: 60
		})
	})

	it('clears hovered time range on mouseleave', async () => {
		const wrapper = mount(TimeHoverTracker, {
			props: {
				start: 540,
				duration: 60
			},
			slots: {
				default: `<template #default="{ events }">
          <div data-testid="trigger" v-on="events">Hover Me</div>
        </template>`
			},
			global: {
				plugins: [createTestingPinia({ createSpy: vi.fn })]
			}
		})

		const timeStore = useTimeStore()
		const trigger = wrapper.find('[data-testid="trigger"]')

		await trigger.trigger('mouseleave')

		expect(timeStore.setHoveredTimeRange).toHaveBeenCalledWith(null)
	})
})
