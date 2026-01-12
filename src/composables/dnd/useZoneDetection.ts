import { reactive, watch } from 'vue'
import { useDragContext } from './useDragContext'

export type ZoneType = 'trash' | 'todo' | 'shortcut' | 'calendar' | 'none'

interface ZoneBounds {
    trash: DOMRect | null
    todo: DOMRect | null
    shortcut: DOMRect | null
    calendar: DOMRect | null
}

// Singleton state for bounds
const bounds = reactive<ZoneBounds>({
    trash: null,
    todo: null,
    shortcut: null,
    calendar: null
})

export function useZoneDetection() {
    const { dragPosition, setDropTarget, isDragging } = useDragContext()

    const check = (x: number, y: number, rect: DOMRect | null) => {
        if (!rect) return false
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    }

    // Watch drag position to update drop target
    watch(() => dragPosition.value, (pos) => {
        if (!isDragging.value) return

        let zone: ZoneType = 'none'

        // Priority Order: Trash > Piles > Calendar
        if (check(pos.x, pos.y, bounds.trash)) {
            zone = 'trash'
        } else if (check(pos.x, pos.y, bounds.todo)) {
            zone = 'todo'
        } else if (check(pos.x, pos.y, bounds.shortcut)) {
            zone = 'shortcut'
        } else if (check(pos.x, pos.y, bounds.calendar)) {
            zone = 'calendar'
        }

        setDropTarget({ zone })
    }, { deep: true }) // dragPosition is ref object, needs deep or value watch

    const registerZone = (zone: Exclude<ZoneType, 'none'>, rect: DOMRect) => {
        bounds[zone] = rect
    }

    return {
        registerZone,
        activeZone: bounds // useful for debugging
    }
}
