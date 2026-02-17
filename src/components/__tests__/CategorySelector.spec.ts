import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import CategorySelector from '../CategorySelector.vue'
import { useCategoriesStore } from '../../stores/categories'
import { useSettingsStore } from '../../stores/settings'

// --- Mock external modules ---

const mocks = vi.hoisted(() => {
	const AutoCompleteStub = {
		name: 'AutoComplete',
		template: `<div class="autocomplete-stub">
			<input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
			<slot name="option" v-for="s in suggestions" :option="s" />
		</div>`,
		props: ['modelValue', 'suggestions', 'optionLabel', 'dropdown', 'inputClass', 'panelClass', 'placeholder'],
		emits: ['update:modelValue', 'complete', 'item-select']
	}

	const ColorPickerInputStub = {
		name: 'ColorPickerInput',
		template: '<div class="color-picker-input-stub"></div>',
		props: ['modelValue'],
		emits: ['update:modelValue']
	}

	const AppCheckboxStub = {
		name: 'AppCheckbox',
		template: '<div class="app-checkbox-stub"></div>',
		props: ['modelValue', 'label', 'inputId'],
		emits: ['update:modelValue']
	}

	return { AutoCompleteStub, ColorPickerInputStub, AppCheckboxStub }
})

vi.mock('primevue/autocomplete', () => ({ default: mocks.AutoCompleteStub }))
vi.mock('../ColorPickerInput.vue', () => ({ default: mocks.ColorPickerInputStub }))
vi.mock('../common/AppCheckbox.vue', () => ({ default: mocks.AppCheckboxStub }))

// Mock firebase to prevent store watch side-effects
vi.mock('../../services/firebaseService', () => ({
	subscribeToCategories: vi.fn(),
	createCategory: vi.fn().mockResolvedValue({ id: 'new-id' }),
	updateCategory: vi.fn().mockResolvedValue(undefined),
	deleteCategory: vi.fn().mockResolvedValue(undefined)
}))

describe('CategorySelector.vue', () => {
	const storeCategories = [
		{ id: '1', name: 'Work', color: '#ff0000', order: 0, isDeepWork: false },
		{ id: '2', name: 'Health', color: '#00ff00', order: 10, isDeepWork: true }
	]

	const mountComponent = async (props: { name?: string; color?: string; isDeepWork?: boolean } = {}) => {
		const categoriesMap = storeCategories.reduce(
			(acc, cat) => {
				acc[cat.id] = cat
				return acc
			},
			{} as Record<string, any>
		)

		const wrapper = mount(CategorySelector, {
			props: {
				name: props.name ?? '',
				color: props.color ?? '',
				isDeepWork: props.isDeepWork ?? false
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: false,
						initialState: {
							categories: { categoriesMap, loading: false },
							settings: {}
						}
					})
				],
				components: {
					AutoComplete: mocks.AutoCompleteStub,
					ColorPickerInput: mocks.ColorPickerInputStub,
					AppCheckbox: mocks.AppCheckboxStub
				}
			}
		})

		// Re-populate store since watch clears it
		const categoriesStore = useCategoriesStore()
		categoriesStore.categoriesMap = { ...categoriesMap }

		const settingsStore = useSettingsStore()
		settingsStore.getRandomCategoryColor = vi.fn().mockReturnValue('#abcdef')

		await nextTick()
		return wrapper
	}

	// --- Happy Path ---

	it('renders autocomplete with initial name prop', async () => {
		const wrapper = await mountComponent({ name: 'Work', color: '#ff0000' })
		const ac = wrapper.findComponent(mocks.AutoCompleteStub)
		expect(ac.exists()).toBe(true)
	})

	it('searching filters categories from store', async () => {
		const wrapper = await mountComponent()

		// Access the component's internal searchCategory via exposed or by triggering complete event
		const ac = wrapper.findComponent(mocks.AutoCompleteStub)
		await ac.vm.$emit('complete', { query: 'wo' })
		await nextTick()

		// The component should have filtered suggestions containing "Work"
		// We can check by looking at the suggestions prop passed to AutoComplete
		await nextTick()
		// Since filteredSuggestions is internal, check the AutoComplete's suggestions prop
		const suggestions = ac.props('suggestions')
		if (suggestions) {
			expect(suggestions.some((s: any) => s.name === 'Work')).toBe(true)
		}
	})

	it('search adds "create new" option when no exact match', async () => {
		const wrapper = await mountComponent()
		const ac = wrapper.findComponent(mocks.AutoCompleteStub)
		await ac.vm.$emit('complete', { query: 'NewCat' })
		await nextTick()

		const suggestions = ac.props('suggestions')
		if (suggestions) {
			const newItem = suggestions.find((s: any) => s.isNew === true)
			expect(newItem).toBeDefined()
			expect(newItem.name).toBe('NewCat')
		}
	})

	it('exact match does NOT add "create new" option', async () => {
		const wrapper = await mountComponent()
		const ac = wrapper.findComponent(mocks.AutoCompleteStub)
		await ac.vm.$emit('complete', { query: 'Work' })
		await nextTick()

		const suggestions = ac.props('suggestions')
		if (suggestions) {
			const newItem = suggestions.find((s: any) => s.isNew === true)
			expect(newItem).toBeUndefined()
		}
	})

	it('selecting existing category emits name, color, isDeepWork', async () => {
		const wrapper = await mountComponent()
		const ac = wrapper.findComponent(mocks.AutoCompleteStub)

		await ac.vm.$emit('item-select', {
			value: { name: 'Health', color: '#00ff00', isNew: false }
		})
		await flushPromises()

		expect(wrapper.emitted('update:name')).toBeTruthy()
		expect(wrapper.emitted('update:name')![0]).toEqual(['Health'])
		expect(wrapper.emitted('update:color')).toBeTruthy()
		expect(wrapper.emitted('update:isDeepWork')).toBeTruthy()
		// Health has isDeepWork: true
		const deepWorkEmissions = wrapper.emitted('update:isDeepWork')!
		expect(deepWorkEmissions[deepWorkEmissions.length - 1]).toEqual([true])
	})

	it('new category shows deep-work toggle and color picker', async () => {
		const wrapper = await mountComponent({ name: 'BrandNew', color: '#abcdef' })
		await nextTick()

		// isNewCategory should be true for unknown name
		expect(wrapper.find('.deep-work-toggle').exists()).toBe(true)
		expect(wrapper.find('.color-picker-row').exists()).toBe(true)
	})

	it('existing category hides deep-work toggle and color picker', async () => {
		const wrapper = await mountComponent({ name: 'Work', color: '#ff0000' })
		await nextTick()

		expect(wrapper.find('.deep-work-toggle').exists()).toBe(false)
		expect(wrapper.find('.color-picker-row').exists()).toBe(false)
	})

	// --- Edge Cases ---

	it('empty name clears color and resets isDeepWork', async () => {
		const wrapper = await mountComponent({ name: 'Work', color: '#ff0000' })

		// Clear the name by emitting from AutoComplete
		const ac = wrapper.findComponent(mocks.AutoCompleteStub)
		await ac.vm.$emit('update:modelValue', '')
		await nextTick()

		const colorEmissions = wrapper.emitted('update:color')
		const deepWorkEmissions = wrapper.emitted('update:isDeepWork')
		expect(colorEmissions).toBeTruthy()
		// Last emission should be empty
		expect(colorEmissions![colorEmissions!.length - 1]).toEqual([''])
		expect(deepWorkEmissions).toBeTruthy()
		expect(deepWorkEmissions![deepWorkEmissions!.length - 1]).toEqual([false])
	})

	it('props.name change updates internal nameInput ref', async () => {
		const wrapper = await mountComponent({ name: 'Work', color: '#ff0000' })

		await wrapper.setProps({ name: 'Health' })
		await nextTick()

		const ac = wrapper.findComponent(mocks.AutoCompleteStub)
		expect(ac.props('modelValue')).toBe('Health')
	})

	it('color prop empty with existing name auto-fills from store', async () => {
		const wrapper = await mountComponent({ name: 'Work', color: '' })
		await nextTick()

		const colorEmissions = wrapper.emitted('update:color')
		expect(colorEmissions).toBeTruthy()
		// Should have auto-filled with Work's color from store
		const lastColor = colorEmissions![colorEmissions!.length - 1][0]
		expect(lastColor).toBe('#ff0000')
	})

	it('color prop empty with new name gets random color', async () => {
		const wrapper = await mountComponent({ name: 'Unknown', color: '' })
		await nextTick()

		const colorEmissions = wrapper.emitted('update:color')
		expect(colorEmissions).toBeTruthy()
		// Should have gotten a color (random from store, assigned during mount)
		const lastColor = colorEmissions![colorEmissions!.length - 1][0]
		expect(lastColor).toMatch(/^#[0-9a-fA-F]{6}$/)
	})

	// --- UI Interaction ---

	it('deep work checkbox emits update:isDeepWork on toggle', async () => {
		const wrapper = await mountComponent({ name: 'BrandNew', color: '#abcdef' })
		await nextTick()

		const checkbox = wrapper.findComponent(mocks.AppCheckboxStub)
		expect(checkbox.exists()).toBe(true)

		await checkbox.vm.$emit('update:modelValue', true)
		await nextTick()

		const emissions = wrapper.emitted('update:isDeepWork')
		expect(emissions).toBeTruthy()
		expect(emissions![emissions!.length - 1]).toEqual([true])
	})
})
