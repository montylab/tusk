import { computed, unref, type Ref } from 'vue'
import type { Task } from '../types'

interface LayoutConfig {
  startHour: number
  endHour: number
  hourHeight: number
}

export function useTaskLayout(
  tasks: Task[] | Ref<Task[]> | (() => Task[]),
  activeTaskId: Ref<string | number | null>,
  currentSnapTime: Ref<number | null>,
  currentDuration: Ref<number | null>,
  config: LayoutConfig
) {
  const taskList = computed(() => {
    const t = typeof tasks === 'function' ? tasks() : unref(tasks)
    return t || []
  })

  // 1. Flatten tasks with current active state
  const displayedTasks = computed(() => {
    return taskList.value
      .map((t) => {
        let startTime = t.startTime!
        let duration = t.duration

        // Style coordinate (for "ghost" snap or resize feedback)
        let displayStart = startTime
        let displayDuration = duration

        if (t.id === activeTaskId.value) {
          if (currentSnapTime.value !== null) displayStart = currentSnapTime.value
          if (currentDuration.value !== null) displayDuration = currentDuration.value
        }

        return {
          ...t,
          displayStart,
          displayDuration,
          startTime: t.id === activeTaskId.value ? displayStart : startTime,
          duration: t.id === activeTaskId.value ? displayDuration : duration,
          // Stability: Use original coordinates for the layout pass while interacting
          // so the task stays in its original column/cluster.
          layoutStart: t.id === activeTaskId.value ? startTime : displayStart,
          layoutDuration: t.id === activeTaskId.value ? duration : displayDuration,
          layoutEnd:
            (t.id === activeTaskId.value ? startTime : displayStart) +
            (t.id === activeTaskId.value ? duration : displayDuration) / 60
        }
      })
      .sort((a, b) => a.layoutStart - b.layoutStart)
  })

  // 2. Calculate Layout positions
  const layoutTasks = computed(() => {
    // Basic greedy column packing

    // Group tasks into clusters that overlap
    const clusters: (typeof displayedTasks.value)[] = []
    let currentCluster: typeof displayedTasks.value = []
    let clusterEnd = -1

    for (const task of displayedTasks.value) {
      if (currentCluster.length === 0) {
        currentCluster.push(task)
        clusterEnd = task.layoutEnd
      } else {
        // If overlap (start < max end of cluster)
        if (task.layoutStart < clusterEnd) {
          currentCluster.push(task)
          clusterEnd = Math.max(clusterEnd, task.layoutEnd)
        } else {
          // No overlap, seal cluster
          clusters.push(currentCluster)
          currentCluster = [task]
          clusterEnd = task.layoutEnd
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
          if (columns[i] <= task.layoutStart + 0.01) {
            // 0.01 epsilon
            columns[i] = task.layoutEnd
            taskColumns.push(i)
            placed = true
            break
          }
        }
        if (!placed) {
          columns.push(task.layoutEnd)
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
            height: `${(task.displayDuration / 60) * config.hourHeight - 1}px`, // we remove 1px to avoid double lines
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
