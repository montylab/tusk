<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
    date?: string | null
    time?: number | null
    view?: 'date-only' | 'time-only'
}>()

const emit = defineEmits<{
    (e: 'update:date', value: string | null): void
    (e: 'update:time', value: number | null): void
}>()

// Convert string date ("YYYY-MM-DD") to Date object
const stringToDate = (s: string | null | undefined): Date | null => {
    if (!s) return null
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
}

// Convert Date object to "YYYY-MM-DD"
const dateToString = (d: Date | null): string | null => {
    if (!d) return null
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

// Convert numeric time (decimal hours) to Date
const numberToTimeDate = (n: number | null | undefined): Date | null => {
    if (n === null || n === undefined) return null
    const d = new Date()
    d.setHours(Math.floor(n))
    d.setMinutes(Math.round((n % 1) * 60))
    d.setSeconds(0)
    d.setMilliseconds(0)
    return d
}

// Convert Date to numeric time (decimal hours)
const timeDateToNumber = (d: Date | null): number | null => {
    if (!d) return null
    return d.getHours() + d.getMinutes() / 60
}

// Internal state
const internalDate = ref<Date | null>(stringToDate(props.date))
const internalTime = ref<Date | null>(numberToTimeDate(props.time))

// Sync internal -> parent
watch(internalDate, (newVal) => {
    emit('update:date', dateToString(newVal))
})

watch(internalTime, (newVal) => {
    emit('update:time', timeDateToNumber(newVal))
})

// Sync parent -> internal
watch(() => props.date, (newVal) => {
    const d = stringToDate(newVal)
    if (d?.getTime() !== internalDate.value?.getTime()) {
        internalDate.value = d
    }
})

watch(() => props.time, (newVal) => {
    const d = numberToTimeDate(newVal)
    if (!d) {
        internalTime.value = null
    } else if (!internalTime.value || d.getHours() !== internalTime.value.getHours() || d.getMinutes() !== internalTime.value.getMinutes()) {
        internalTime.value = d
    }
})

const showDate = computed(() => !props.view || props.view === 'date-only')
const showTime = computed(() => !props.view || props.view === 'time-only')

const handleWheel = (e: WheelEvent) => {
    if (!e.shiftKey) return
    e.preventDefault()

    const current = internalTime.value || new Date()
    if (!internalTime.value) {
        current.setHours(9, 0, 0, 0)
    }

    const d = new Date(current)
    const step = 15 // minutes
    const direction = e.deltaY > 0 ? -1 : 1 // Up increases, Down decreases

    d.setMinutes(d.getMinutes() + direction * step)
    internalTime.value = d
}
</script>

<template>
    <div class="datetime-picker-wrapper">
        <div v-if="showDate" class="picker-group">
            <DatePicker v-model="internalDate" showIcon fluid iconDisplay="input" placeholder="Select date"
                class="custom-datepicker" />
        </div>

        <div v-if="showTime" class="picker-group" @wheel="handleWheel">
            <DatePicker v-model="internalTime" showIcon fluid iconDisplay="input" timeOnly :stepMinute="15"
                placeholder="Select time" class="custom-datepicker">
                <template #inputicon="slotProps">
                    <i class="pi pi-clock" @click="slotProps.clickCallback" />
                </template>
            </DatePicker>
        </div>
    </div>
</template>

<style scoped>
.datetime-picker-wrapper {
    display: flex;
    gap: 1rem;
    width: 100%;
}

.picker-group {
    flex: 1;
}

:deep(.p-datepicker) {
    background: rgba(30, 30, 45, 0.98) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(10px) !important;
}

:deep(.p-datepicker-input) {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #fff !important;
    border-radius: 8px !important;
    padding: 0.75rem 1rem !important;
    transition: all 0.2s ease !important;
}

:deep(.p-datepicker-input:focus) {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(102, 126, 234, 0.5) !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

:deep(.p-datepicker-input-icon) {
    color: rgba(255, 255, 255, 0.6) !important;
}
</style>
