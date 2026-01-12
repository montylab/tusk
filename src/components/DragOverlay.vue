<script
    setup
    lang="ts"
>
import { computed } from 'vue'
import { useDragContext } from '../composables/dnd/useDragContext'
import TaskItem from './TaskItem.vue'

const { isDragging, dragPosition, dragOffset, dragPayload, dragDimensions, ghostPosition } = useDragContext()

const style = computed(() => {
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
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        opacity: 0.95
    }
})
</script>

<template>
    <Teleport to="body">
        <div v-if="isDragging"
             class="drag-overlay"
             :style="style">
            <TaskItem v-if="dragPayload?.type === 'task'"
                      :task="dragPayload.data"
                      :is-dragging="true" />
        </div>
    </Teleport>
</template>

<style scoped>
.drag-overlay {
    will-change: transform;
}
</style>
