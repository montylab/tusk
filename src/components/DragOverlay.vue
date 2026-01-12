<script
    setup
    lang="ts"
>
import { computed } from 'vue'
import { useDragContext } from '../composables/dnd/useDragContext'
import TaskItem from './TaskItem.vue'

const { isDragging, dragPosition, dragOffset, dragPayload, dragDimensions, ghostPosition, dropTarget } = useDragContext()

const ghostStyle = computed(() => {
    if (!isDragging.value) return { display: 'none' }

    let x: number, y: number
    if (ghostPosition.value) {
        x = ghostPosition.value.x
        y = ghostPosition.value.y
    } else {
        x = dragPosition.value.x - dragOffset.value.x
        y = dragPosition.value.y - dragOffset.value.y
    }

    return {
        transform: `translate(${x}px, ${y}px)`,
        width: `${dragDimensions.value.width}px`,
        height: `${dragDimensions.value.height}px`,
        position: 'fixed' as const,
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: 'none' as const,
    }
})
</script>

<template>
    <Teleport to="body">
        <div v-if="isDragging && dragPayload"
             class="drag-ghost-container"
             :class="{ 'is-snapped': !!ghostPosition }"
             :style="ghostStyle"
             :data-target-zone="dropTarget.zone"
             :data-mode="dragPayload.source === 'calendar' ? (dragPayload as any).mode : 'drag'">
            <div class="ghost-morpher"
                 :class="dropTarget.zone">
                <TaskItem :task="dragPayload.data"
                          :is-dragging="true" />

                <!-- Time indicator overlay for calendar snaps -->
                <div v-if="dropTarget.zone === 'calendar' && dropTarget.data?.time !== undefined"
                     class="snap-indicator">
                    {{ Math.floor(dropTarget.data.time) }}:{{ ((dropTarget.data.time % 1) * 60).toString().padStart(2,
                        '0') }}
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.drag-ghost-container {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    pointer-events: none;
    will-change: transform;
    /* Morphing transitions for the container box ONLY for size */
    /* transition:
        width 0.2s cubic-bezier(0.19, 1, 0.22, 1),
        height 0.2s cubic-bezier(0.19, 1, 0.22, 1); */
}

/* Disable transitions during resize for instant feedback */
.drag-ghost-container[data-mode^="resize"],
.drag-ghost-container[data-mode^="resize"] .ghost-morpher {
    transition: none !important;
}

.ghost-morpher {
    width: 100%;
    height: 100%;
    transition: width 0.2s cubic-bezier(0.19, 1, 0.22, 1), height 0.2s cubic-bezier(0.19, 1, 0.22, 1), filter 0.3s ease, opacity 0.3s ease;
    transform-origin: center center;
    position: relative;
    display: flex;
}

/* Zone Specific States */
.ghost-morpher.trash {
    filter: sepia(1) hue-rotate(-50deg) saturate(3);
    /* Reddish */
    transform: scale(0.85) rotate(-2deg);
    opacity: 0.6;
}

.ghost-morpher.todo,
.ghost-morpher.shortcut {
    transform: scale(1.02);
    filter: brightness(1.1);
}

.is-snapped .ghost-morpher {
    transform: rotate(0deg) scale(1);
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
}

.snap-indicator {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-primary);
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
}
</style>
