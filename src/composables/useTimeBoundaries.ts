import { ref, onMounted, onUnmounted } from 'vue'
import { formatDate } from '../utils/dateUtils'

export function useTimeBoundaries() {
  const currentDate = ref(formatDate(new Date()))
  const dayChangeCallbacks = new Set<(newDate: string) => void>()
  const weekChangeCallbacks = new Set<(newDate: string) => void>()
  const monthChangeCallbacks = new Set<(newDate: string) => void>()

  let timeoutId: any = null
  let intervalId: any = null

  const getWeekNumber = (d: Date) => {
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1)
    const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  const checkDateChange = () => {
    const now = new Date()
    const freshDateStr = formatDate(now)

    if (freshDateStr !== currentDate.value) {
      const oldDate = new Date(currentDate.value)
      const newDate = now

      const isNewMonth = oldDate.getMonth() !== newDate.getMonth() || oldDate.getFullYear() !== newDate.getFullYear()
      const isNewWeek =
        getWeekNumber(oldDate) !== getWeekNumber(newDate) || oldDate.getFullYear() !== newDate.getFullYear()

      currentDate.value = freshDateStr

      // Trigger callbacks
      dayChangeCallbacks.forEach((cb) => cb(freshDateStr))
      if (isNewWeek) weekChangeCallbacks.forEach((cb) => cb(freshDateStr))
      if (isNewMonth) monthChangeCallbacks.forEach((cb) => cb(freshDateStr))

      // Re-schedule for next midnight
      scheduleNextCheck()
    }
  }

  const scheduleNextCheck = () => {
    if (timeoutId) clearTimeout(timeoutId)

    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    // Add a small buffer to ensure we are actually in the next day
    const msUntilMidnight = tomorrow.getTime() - now.getTime() + 1000

    timeoutId = setTimeout(() => {
      checkDateChange()
    }, msUntilMidnight)
  }

  const onWindowFocus = () => {
    checkDateChange()
  }

  onMounted(() => {
    scheduleNextCheck()
    // Watchdog check every minute to handle system sleep/hibernation
    intervalId = setInterval(checkDateChange, 60000)
    window.addEventListener('focus', onWindowFocus)
  })

  onUnmounted(() => {
    if (timeoutId) clearTimeout(timeoutId)
    if (intervalId) clearInterval(intervalId)
    window.removeEventListener('focus', onWindowFocus)
    dayChangeCallbacks.clear()
    weekChangeCallbacks.clear()
    monthChangeCallbacks.clear()
  })

  return {
    currentDate,
    onDayChange: (cb: (date: string) => void) => {
      dayChangeCallbacks.add(cb)
      return () => dayChangeCallbacks.delete(cb)
    },
    onWeekChange: (cb: (date: string) => void) => {
      weekChangeCallbacks.add(cb)
      return () => weekChangeCallbacks.delete(cb)
    },
    onMonthChange: (cb: (date: string) => void) => {
      monthChangeCallbacks.add(cb)
      return () => monthChangeCallbacks.delete(cb)
    },
    checkDateChange // Expose for testing
  }
}
