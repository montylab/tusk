import { ref, readonly } from 'vue'

export interface DragStrategy {
    onStart: (payload: any, event: MouseEvent) => void
    onMove: (event: MouseEvent) => void
    onEnd: (event: MouseEvent) => void
    onCancel?: () => void
    [key: string]: any
}

// Singleton state
const activeStrategy = ref<DragStrategy | null>(null)

export function useDragAndDrop() {

    const onMove = (e: MouseEvent) => {
        if (activeStrategy.value) {
            e.preventDefault() // prevent selection
            activeStrategy.value.onMove(e)
        }
    }

    const onEnd = (e: MouseEvent) => {
        if (activeStrategy.value) {
            activeStrategy.value.onEnd(e)
            cleanup()
        }
    }

    const onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && activeStrategy.value) {
            activeStrategy.value.onCancel?.()
            cleanup()
        }
    }

    const cleanup = () => {
        activeStrategy.value = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onEnd)
        window.removeEventListener('keydown', onKeydown)
    }

    const startDrag = (strategy: DragStrategy, event: MouseEvent, payload?: any) => {
        // If already dragging, ignore or cancel previous? 
        if (activeStrategy.value) cleanup()

        activeStrategy.value = strategy
        strategy.onStart(payload, event)

        window.addEventListener('mousemove', onMove, { passive: false })
        window.addEventListener('mouseup', onEnd)
        window.addEventListener('keydown', onKeydown)
    }

    return {
        activeStrategy: readonly(activeStrategy),
        startDrag
    }
}
