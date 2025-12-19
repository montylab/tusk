import { reactive, toRefs } from 'vue'

interface DragState {
    trashBounds: DOMRect | null
    todoBounds: DOMRect | null
    shortcutBounds: DOMRect | null
    isOverTrash: boolean
    isOverTodo: boolean
    isOverShortcut: boolean
}

const state = reactive<DragState>({
    trashBounds: null,
    todoBounds: null,
    shortcutBounds: null,
    isOverTrash: false,
    isOverTodo: false,
    isOverShortcut: false
})

export function useDragState() {
    const updateCollision = (e: MouseEvent) => {
        const check = (bounds: DOMRect | null) => {
            if (!bounds) return false
            return e.clientX >= bounds.left &&
                e.clientX <= bounds.right &&
                e.clientY >= bounds.top &&
                e.clientY <= bounds.bottom
        }

        state.isOverTrash = check(state.trashBounds)
        state.isOverTodo = check(state.todoBounds)
        state.isOverShortcut = check(state.shortcutBounds)
    }

    const resetCollisions = () => {
        state.isOverTrash = false
        state.isOverTodo = false
        state.isOverShortcut = false
    }

    return {
        ...toRefs(state),
        updateCollision,
        resetCollisions
    }
}
