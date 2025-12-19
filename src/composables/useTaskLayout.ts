import { computed, type Ref } from 'vue'
import type { Task } from '../types'

interface LayoutConfig {
    startHour: number
    endHour: number
    hourHeight: number
}

export function useTaskLayout(
    tasks: Task[],
    activeTaskId: Ref<number | null>,
    currentSnapTime: Ref<number | null>,
    currentDuration: Ref<number | null>,
    config: LayoutConfig
) {

    // 1. Flatten tasks with current active state
    const displayedTasks = computed(() => {
        return tasks.map(t => {
            let startTime = t.startTime!
            let duration = t.duration

            // Override if active
            if (t.id === activeTaskId.value) {
                if (currentSnapTime.value !== null) startTime = currentSnapTime.value
                if (currentDuration.value !== null) duration = currentDuration.value
            }

            return {
                ...t,
                displayStart: startTime,
                displayDuration: duration,
                endTime: startTime + (duration / 60)
            }
        }).sort((a, b) => a.displayStart - b.displayStart)
    })

    // 2. Calculate Layout positions
    const layoutTasks = computed(() => {
        // Basic greedy column packing

        // Group tasks into clusters that overlap
        const clusters: typeof displayedTasks.value[] = []
        let currentCluster: typeof displayedTasks.value = []
        let clusterEnd = -1

        for (const task of displayedTasks.value) {
            if (currentCluster.length === 0) {
                currentCluster.push(task)
                clusterEnd = task.endTime
            } else {
                // If overlap (start < max end of cluster)
                if (task.displayStart < clusterEnd) {
                    currentCluster.push(task)
                    clusterEnd = Math.max(clusterEnd, task.endTime)
                } else {
                    // No overlap, seal cluster
                    clusters.push(currentCluster)
                    currentCluster = [task]
                    clusterEnd = task.endTime
                }
            }
        }
        if (currentCluster.length > 0) clusters.push(currentCluster)

        // Process each cluster to assign Width and Left
        const result: any[] = []

        for (const cluster of clusters) {
            // Array of end times for each column
            const columns: number[] = []
            const taskColumns: number[] = [] // Index -> Col ID
            const isClusterOverlapping = cluster.length > 1

            for (const task of cluster) {
                // Find first column where task fits
                let placed = false
                for (let i = 0; i < columns.length; i++) {
                    if (columns[i] <= task.displayStart + 0.01) { // 0.01 epsilon
                        columns[i] = task.endTime
                        taskColumns.push(i)
                        placed = true
                        break
                    }
                }
                if (!placed) {
                    columns.push(task.endTime)
                    taskColumns.push(columns.length - 1)
                }
            }

            const numCols = columns.length
            const width = 100 / numCols

            cluster.forEach((task, index) => {
                const colIndex = taskColumns[index]

                // Only shake if overlaps exist AND not currently being interacted with (dragged)
                // We shake others if they overlap, but maybe not the one I'm holding?
                // Actually shaking the dragged one is distracting.
                const isSelfDragging = task.id === activeTaskId.value

                result.push({
                    ...task,
                    isOverlapping: isClusterOverlapping && !isSelfDragging,
                    style: {
                        top: `${(task.displayStart - config.startHour) * config.hourHeight}px`,
                        height: `${(task.displayDuration / 60) * config.hourHeight}px`,
                        left: `${colIndex * width}%`,
                        width: `${width}%`,
                        position: 'absolute' as const,
                        zIndex: task.id === activeTaskId.value ? 100 : 10
                    }
                })
            })
        }

        return result
    })

    return {
        layoutTasks
    }
}
