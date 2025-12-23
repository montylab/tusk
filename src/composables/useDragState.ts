import { reactive, toRefs, computed } from 'vue'

export type DragZone = 'trash' | 'todo' | 'shortcut' | 'calendar' | 'add-button' | null

interface DragState {
    trashBounds: DOMRect | null
    todoBounds: DOMRect | null
    shortcutBounds: DOMRect | null
    calendarBounds: DOMRect | null
    addButtonBounds: DOMRect | null
    overZone: DragZone
}

const state = reactive<DragState>({
    trashBounds: null,
    todoBounds: null,
    shortcutBounds: null,
    calendarBounds: null,
    addButtonBounds: null,
    overZone: null
})

export function useDragState() {
    const isOverTrash = computed(() => state.overZone === 'trash')
    const isOverTodo = computed(() => state.overZone === 'todo')
    const isOverShortcut = computed(() => state.overZone === 'shortcut')
    const isOverCalendar = computed(() => state.overZone === 'calendar')
    const isOverAddButton = computed(() => state.overZone === 'add-button')

    const updateCollision = (e: MouseEvent) => {
        const check = (bounds: DOMRect | null) => {
            if (!bounds) return false
            return e.clientX >= bounds.left &&
                e.clientX <= bounds.right &&
                e.clientY >= bounds.top &&
                e.clientY <= bounds.bottom
        }

        if (check(state.trashBounds)) {
            state.overZone = 'trash'
        } else if (check(state.todoBounds)) {
            state.overZone = 'todo'
        } else if (check(state.shortcutBounds)) {
            state.overZone = 'shortcut'
        } else if (check(state.addButtonBounds)) {
            state.overZone = 'add-button'
        } else if (check(state.calendarBounds)) {
            state.overZone = 'calendar'
        } else {
            state.overZone = null
        }
    }

    const resetCollisions = () => {
        state.overZone = null
    }

    return {
        ...toRefs(state),
        isOverTrash,
        isOverTodo,
        isOverShortcut,
        isOverCalendar,
        isOverAddButton,
        updateCollision,
        resetCollisions
    }
}
