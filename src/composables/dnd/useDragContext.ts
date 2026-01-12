import { ref, readonly } from 'vue'

export interface DragPayload {
    type: 'task' | 'list-item'
    data: any // The task object or item data
    source: 'calendar' | 'todo' | 'shortcut'
}

export interface DropTarget {
    zone: 'calendar' | 'todo' | 'shortcut' | 'trash' | 'none'
    data?: any // Contextual data (e.g., date, time, insertion index)
}

export interface DragPosition {
    x: number
    y: number
}

export interface DragDimensions {
    width: number
    height: number
}

// Global singleton state
const isDragging = ref(false)
const dragPayload = ref<DragPayload | null>(null)
const dragPosition = ref<DragPosition>({ x: 0, y: 0 })
const ghostPosition = ref<DragPosition | null>(null)
const dropTarget = ref<DropTarget>({ zone: 'none' })
const dragOffset = ref<{ x: number, y: number }>({ x: 0, y: 0 }) // Offset from mouse to element top-left
const dragDimensions = ref<DragDimensions>({ width: 0, height: 0 })

export function useDragContext() {
    const startDrag = (payload: DragPayload, initialPosition: DragPosition, offset = { x: 0, y: 0 }, dimensions = { width: 200, height: 60 }) => {
        isDragging.value = true
        dragPayload.value = payload
        dragPosition.value = initialPosition
        ghostPosition.value = null
        dragOffset.value = offset
        dragDimensions.value = dimensions
        dropTarget.value = { zone: 'none' }
    }

    const updateDragPosition = (x: number, y: number) => {
        dragPosition.value = { x, y }
    }

    const updateGhostPosition = (x: number | null, y: number | null) => {
        if (x === null || y === null) ghostPosition.value = null
        else ghostPosition.value = { x, y }
    }

    const updateDragDimensions = (width: number, height: number) => {
        dragDimensions.value = { width, height }
    }

    const setDropTarget = (target: DropTarget) => {
        dropTarget.value = target
    }

    const endDrag = () => {
        isDragging.value = false
        dragPayload.value = null
        dropTarget.value = { zone: 'none' }
        dragOffset.value = { x: 0, y: 0 }
        dragDimensions.value = { width: 0, height: 0 }
    }

    return {
        isDragging: readonly(isDragging),
        dragPayload: readonly(dragPayload),
        dragPosition: readonly(dragPosition),
        ghostPosition: readonly(ghostPosition),
        dropTarget: readonly(dropTarget),
        dragOffset: readonly(dragOffset),
        dragDimensions: readonly(dragDimensions),

        startDrag,
        updateDragPosition,
        updateGhostPosition,
        updateDragDimensions,
        setDropTarget,
        endDrag
    }
}
