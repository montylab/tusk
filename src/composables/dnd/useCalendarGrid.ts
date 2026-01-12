import { unref, Ref } from 'vue'

export interface CalendarGridConfig {
    hourHeight: number
    startHour: number
    endHour: number
    dates: Ref<string[]>
    topOffset: Ref<number>
    getContainerRect: () => DOMRect | null
    getScrollTop: () => number
}

export function useCalendarGrid(config: CalendarGridConfig) {
    /**
     * Projects screen coordinates into calendar space (date, time, and ghost positions)
     */
    const project = (clientX: number, clientY: number, durationHours: number = 1, offsetYPixels: number = 0) => {
        const rect = config.getContainerRect()
        if (!rect) return null

        // 1. Column Calculation
        const relativeX = clientX - rect.left
        const colAreaWidth = rect.width - 30 // Subtract AddDayZone spacer

        // If mouse is horizontally outside the columns, it's not a calendar snap
        if (relativeX < 0 || relativeX > colAreaWidth) return null

        const colWidth = colAreaWidth / config.dates.value.length

        let colIndex = Math.floor(relativeX / colWidth)
        colIndex = Math.max(0, Math.min(config.dates.value.length - 1, colIndex))

        const date = config.dates.value[colIndex]

        // 2. Time Calculation
        // Adjusted clientY to represent the TOP of the task
        const taskTopY = clientY - offsetYPixels

        // If task top is vertically outside the calendar view, it's not a snap
        if (taskTopY < rect.top || taskTopY > rect.bottom) return null

        const relativeY = taskTopY - rect.top - unref(config.topOffset)
        const taskTime = (relativeY / config.hourHeight) + config.startHour

        // 3. Snapping (15 min increments)
        let snappedTime = Math.round(taskTime * 4) / 4

        // Bounds check for time (account for duration so task doesn't overflow bottom)
        snappedTime = Math.max(
            config.startHour,
            Math.min(config.endHour - durationHours, snappedTime)
        )

        // 4. Ghost Screen Positions
        const ghostX = rect.left + (colIndex * colWidth) + 1 // +1 for border alignment
        const ghostY = rect.top + (snappedTime - config.startHour) * config.hourHeight + unref(config.topOffset)

        return {
            date,
            time: snappedTime,
            colWidth,
            colIndex,
            ghostX,
            ghostY
        }
    }

    return {
        project
    }
}
