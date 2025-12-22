<script
    setup
    lang="ts"
>
import { ref, onUnmounted, watch } from 'vue'

const props = defineProps<{
    label: string
    isDragging: boolean
}>()

const emit = defineEmits<{
    (e: 'add-day'): void
}>()

const isHovered = ref(false)
const totalCountdownSeconds = 3
const speed = 1.2 // we use faster speed to make it feel more natural
const countdown = ref(totalCountdownSeconds)


let timer: any = null

const startCountdown = () => {
    isHovered.value = true
    if (!props.isDragging) return

    countdown.value = totalCountdownSeconds
    timer = setInterval(() => {
        countdown.value--
        if (countdown.value < 0) {
            emit('add-day')
            stopCountdown()
        }
    }, 1000 / speed) // we use 800ms to make it feel more natural
}

const stopCountdown = () => {
    isHovered.value = false
    if (timer) {
        clearInterval(timer)
        timer = null
    }
    countdown.value = totalCountdownSeconds
}

// If drag stops while hovering, stop countdown
watch(() => props.isDragging, (val) => {
    if (!val) stopCountdown()
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
})
</script>

<template>
    <div class="add-day-zone"
         @click="emit('add-day')"
         @mouseenter="startCountdown"
         @mouseleave="stopCountdown"
         @mouseup="stopCountdown"
         :class="{ 'is-counting': isDragging && isHovered && countdown < totalCountdownSeconds }">

        <div class="add-content">
            <template v-if="isDragging && isHovered">
                <div class="countdown-number">{{ countdown }}</div>
                <div class="countdown-label">Hold to add</div>
            </template>
            <template v-else>
                <div class="plus-icon">+</div>
                <div class="hover-label">Add {{ label }}</div>
            </template>
        </div>

        <!-- Progress Bar Background/Effect -->
        <div class="progress-overlay"
             v-if="isDragging && isHovered"
             :style="{ height: ((totalCountdownSeconds - countdown) / totalCountdownSeconds * 100) * 1.05 + '%' }">
        </div>
    </div>
</template>

<style scoped>
.add-day-zone {
    width: 40px;
    border-left: 1px dashed var(--border-color);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 0;
    top: 40px;
    bottom: 0;
    z-index: 50;
    overflow: hidden;
    background: var(--bg-card);
    backdrop-filter: blur(10px);
}

.add-day-zone:hover {
    width: 180px;
    background: rgba(255, 255, 255, 0.05);
    border-left-style: solid;
}

.is-counting {
    width: 180px !important;
    /* Force expand during countdown */
    background: rgba(var(--color-primary-rgb), 0.1);
    border-left: 2px solid var(--color-primary);
}

.add-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    white-space: nowrap;
    position: relative;
    z-index: 2;
}

.plus-icon {
    font-size: 1.5rem;
    color: var(--text-muted);
    transition: transform 0.3s;
}

.add-day-zone:hover .plus-icon {
    transform: rotate(90deg) scale(1.2);
    color: #fff;
}

.hover-label {
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s;
    font-size: 0.8rem;
    color: var(--text-muted);
}

.add-day-zone:hover .hover-label {
    opacity: 1;
    transform: translateY(0);
}

.countdown-number {
    font-size: 3rem;
    font-weight: 800;
    color: #fff;
    line-height: 1;
    animation: pulse 1s infinite;
}

.countdown-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.progress-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #ffffff1a;
    transition: height 0.8s linear;
    z-index: 1;
    pointer-events: none;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 0.8;
    }

    50% {
        transform: scale(1.1);
        opacity: 1;
    }

    100% {
        transform: scale(1);
        opacity: 0.8;
    }
}
</style>
