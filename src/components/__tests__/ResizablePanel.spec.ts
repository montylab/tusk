import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ResizablePanel from '../ResizablePanel.vue'

describe('ResizablePanel.vue', () => {
	beforeEach(() => {
		localStorage.clear()
	})

	const mountComponent = (propsOffset = {}) => {
		return mount(ResizablePanel, {
			props: {
				side: 'right',
				defaultSize: 300,
				...propsOffset
			},
			slots: {
				default: '<div class="content">Content</div>'
			}
		})
	}

	it('renders with default size', () => {
		const wrapper = mountComponent({ defaultSize: 250 })
		// With v-bind, Vue sets a CSS variable on the element
		const style = (wrapper.element as HTMLElement).style
		const cssVar = Object.keys(style).find((k) => k.startsWith('--') && k.endsWith('-cssSize'))
		if (cssVar) {
			expect(style.getPropertyValue(cssVar)).toBe('250px')
		}
	})

	it('loads size from localStorage on mount', async () => {
		localStorage.setItem('panel-size', '400')
		const wrapper = mountComponent({ storageKey: 'panel-size' })
		await nextTick()
		const style = (wrapper.element as HTMLElement).style
		const cssVar = Object.keys(style).find((k) => k.startsWith('--') && k.endsWith('-cssSize'))
		if (cssVar) {
			expect(style.getPropertyValue(cssVar)).toBe('400px')
		}
	})

	it('emits resize on mount', () => {
		const wrapper = mountComponent({ defaultSize: 200 })
		expect(wrapper.emitted('resize')).toBeTruthy()
		expect(wrapper.emitted('resize')![0]).toEqual([200])
	})

	it('resizes on mousemove (right side)', async () => {
		const wrapper = mountComponent({ side: 'right', defaultSize: 300 })
		const handle = wrapper.find('.resize-handle')

		await handle.trigger('mousedown', { clientX: 400 })
		const moveEvent = new MouseEvent('mousemove', { clientX: 450 })
		document.dispatchEvent(moveEvent)
		await nextTick()

		expect(wrapper.emitted('resize')).toContainEqual([350])
		const style = (wrapper.element as HTMLElement).style
		const cssVar = Object.keys(style).find((k) => k.startsWith('--') && k.endsWith('-cssSize'))
		if (cssVar) {
			expect(style.getPropertyValue(cssVar)).toBe('350px')
		}
	})

	it('resizes on mousemove (left side)', async () => {
		const wrapper = mountComponent({ side: 'left', defaultSize: 300 })
		const handle = wrapper.find('.resize-handle')

		await handle.trigger('mousedown', { clientX: 400 })
		const moveEvent = new MouseEvent('mousemove', { clientX: 450 })
		document.dispatchEvent(moveEvent)
		await nextTick()

		expect(wrapper.emitted('resize')).toContainEqual([250])
	})

	it('constrains size between minSize and maxSize', async () => {
		const wrapper = mountComponent({
			side: 'right',
			defaultSize: 300,
			minSize: 200,
			maxSize: 400
		})
		const handle = wrapper.find('.resize-handle')

		await handle.trigger('mousedown', { clientX: 400 })

		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 600 }))
		await nextTick()
		expect(wrapper.emitted('resize')).toContainEqual([400])

		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 }))
		await nextTick()
		expect(wrapper.emitted('resize')).toContainEqual([200])
	})

	it('saves size to localStorage on drag end', async () => {
		const wrapper = mountComponent({ storageKey: 'test-key', defaultSize: 300 })
		const handle = wrapper.find('.resize-handle')

		await handle.trigger('mousedown', { clientX: 400 })
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 450 }))
		await nextTick()

		document.dispatchEvent(new MouseEvent('mouseup'))
		expect(localStorage.getItem('test-key')).toBe('350')
	})

	it('sets CSS variables for percentage constraints', () => {
		const wrapper = mountComponent({
			minPercentSize: 20,
			maxPercentSize: 80
		})
		const style = (wrapper.element as HTMLElement).style

		const minVar = Object.keys(style).find((k) => k.startsWith('--') && k.endsWith('-cssMinSize'))
		const maxVar = Object.keys(style).find((k) => k.startsWith('--') && k.endsWith('-cssMaxSize'))

		if (minVar) {
			expect(style.getPropertyValue(minVar)).toBe('max(0px, 20%)')
		}
		if (maxVar) {
			expect(style.getPropertyValue(maxVar)).toBe('min(9999px, 80%)')
		}
	})

	it('handles touch events', async () => {
		const wrapper = mountComponent({ side: 'right', defaultSize: 300 })
		const handle = wrapper.find('.resize-handle')

		// touchstart
		await handle.trigger('touchstart', { touches: [{ clientX: 400 }] })

		// touchmove
		const touchMoveEvent = new TouchEvent('touchmove', {
			touches: [{ clientX: 450 } as any]
		})
		document.dispatchEvent(touchMoveEvent)
		await nextTick()
		expect(wrapper.emitted('resize')).toContainEqual([350])

		// touchend
		document.dispatchEvent(new TouchEvent('touchend'))
		await nextTick()
		expect(wrapper.find('.resize-handle').classes()).not.toContain('dragging')
	})
})
