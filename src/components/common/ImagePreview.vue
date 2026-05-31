<template>
  <div v-if="src" class="modal-backdrop image-modal" @click="emit('close')">
    <div class="image-modal__stage" role="dialog" aria-modal="true" @click.stop>
      <div class="image-modal__toolbar">
        <div class="image-modal__zoom-chip">{{ zoomLabel }}</div>
        <button class="btn btn-light btn-icon" type="button" aria-label="Thu nhỏ" @click="zoomOut">
          <Icon icon="heroicons-outline:minus" />
        </button>
        <button class="btn btn-light btn-icon" type="button" aria-label="Phóng to" @click="zoomIn">
          <Icon icon="heroicons-outline:plus" />
        </button>
        <button class="btn btn-light btn-icon" type="button" aria-label="Vừa màn hình" @click="resetZoom">
          <Icon icon="heroicons-outline:arrows-pointing-in" />
        </button>
        <button class="btn btn-primary btn-icon" type="button" aria-label="Đóng" @click="emit('close')">
          <Icon icon="heroicons-outline:x-mark" />
        </button>
      </div>

      <div
        ref="viewport"
        class="image-modal__viewport"
        @wheel.prevent="handleWheel"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
        @dblclick="toggleDoubleTapZoom"
      >
        <img
          class="image-modal__zoom-image"
          :src="src"
          alt=""
          draggable="false"
          :style="{ transform: imageTransform }"
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Icon from '@/components/Icon';

const props = defineProps({ src: { type: String, default: '' } });
const emit = defineEmits(['close']);

const minScale = 1;
const maxScale = 5;
const zoomStep = 0.45;
const viewport = ref(null);
const scale = ref(1);
const translate = ref({ x: 0, y: 0 });
const activePointers = new Map();
let dragStart = null;
let pinchStart = null;
let bodyOverflow = '';

const imageTransform = computed(() => `translate3d(${translate.value.x}px, ${translate.value.y}px, 0) scale(${scale.value})`);
const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`);

watch(() => props.src, (value) => {
  if (value) {
    resetZoom();
    lockBodyScroll();
    window.addEventListener('keydown', handleKeydown);
    return;
  }

  cleanupViewer();
});

onBeforeUnmount(cleanupViewer);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lockBodyScroll() {
  if (bodyOverflow === '') {
    bodyOverflow = document.body.style.overflow || ' ';
  }
  document.body.style.overflow = 'hidden';
}

function cleanupViewer() {
  activePointers.clear();
  dragStart = null;
  pinchStart = null;
  window.removeEventListener('keydown', handleKeydown);

  if (bodyOverflow !== '') {
    document.body.style.overflow = bodyOverflow === ' ' ? '' : bodyOverflow;
    bodyOverflow = '';
  }
}

function resetZoom() {
  scale.value = 1;
  translate.value = { x: 0, y: 0 };
}

function setScale(nextScale, origin = viewportCenter()) {
  const normalized = clamp(nextScale, minScale, maxScale);
  if (normalized === scale.value) return;

  const rect = viewport.value?.getBoundingClientRect();
  if (!rect) {
    scale.value = normalized;
    return;
  }

  const ratio = normalized / scale.value;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  translate.value = {
    x: (translate.value.x - (origin.x - centerX)) * ratio + (origin.x - centerX),
    y: (translate.value.y - (origin.y - centerY)) * ratio + (origin.y - centerY)
  };
  scale.value = normalized;

  if (scale.value === minScale) {
    translate.value = { x: 0, y: 0 };
  }
}

function viewportCenter() {
  const rect = viewport.value?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function zoomIn() {
  setScale(scale.value + zoomStep);
}

function zoomOut() {
  setScale(scale.value - zoomStep);
}

function toggleDoubleTapZoom(event) {
  if (scale.value > 1) {
    resetZoom();
    return;
  }

  setScale(2.4, { x: event.clientX, y: event.clientY });
}

function handleWheel(event) {
  const direction = event.deltaY > 0 ? -zoomStep : zoomStep;
  setScale(scale.value + direction, { x: event.clientX, y: event.clientY });
}

function handlePointerDown(event) {
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  event.currentTarget.setPointerCapture?.(event.pointerId);

  if (activePointers.size === 1) {
    dragStart = {
      x: event.clientX,
      y: event.clientY,
      translate: { ...translate.value }
    };
  }

  if (activePointers.size === 2) {
    const [first, second] = [...activePointers.values()];
    pinchStart = {
      distance: pointerDistance(first, second),
      scale: scale.value,
      center: pointerCenter(first, second)
    };
  }
}

function handlePointerMove(event) {
  if (!activePointers.has(event.pointerId)) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (activePointers.size >= 2) {
    applyPinchZoom();
    return;
  }

  if (!dragStart || scale.value <= 1) return;

  translate.value = {
    x: dragStart.translate.x + event.clientX - dragStart.x,
    y: dragStart.translate.y + event.clientY - dragStart.y
  };
}

function handlePointerUp(event) {
  activePointers.delete(event.pointerId);
  event.currentTarget.releasePointerCapture?.(event.pointerId);
  pinchStart = null;

  if (activePointers.size === 1) {
    const [remaining] = activePointers.values();
    dragStart = {
      x: remaining.x,
      y: remaining.y,
      translate: { ...translate.value }
    };
    return;
  }

  dragStart = null;
}

function applyPinchZoom() {
  if (!pinchStart || activePointers.size < 2) return;
  const [first, second] = [...activePointers.values()];
  const nextDistance = pointerDistance(first, second);
  const nextCenter = pointerCenter(first, second);
  setScale(pinchStart.scale * (nextDistance / pinchStart.distance), nextCenter);
}

function pointerDistance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function pointerCenter(first, second) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2
  };
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    emit('close');
  } else if (event.key === '+' || event.key === '=') {
    zoomIn();
  } else if (event.key === '-') {
    zoomOut();
  } else if (event.key === '0') {
    resetZoom();
  }
}
</script>

<style scoped>
.image-modal__viewport {
  touch-action: none;
}
</style>
