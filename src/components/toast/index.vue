<template>
  <div class="toast-container position-fixed top-0 end-0 p-3" aria-live="polite" aria-atomic="true">
    <div v-for="toast in toasts" :key="toast.id" class="toast show" :class="`toast-${toast.variant}`" role="alert">
      <div class="toast-body d-flex align-items-center justify-content-between gap-3">
        <span>{{ toast.message }}</span>
        <button type="button" class="btn-close" aria-label="Đóng" @click="$emit('dismiss', toast.id)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

interface ToastItem { id: string | number; message: string; variant: "success" | "danger" | "info" }

export default defineComponent({
  name: "ToastRegion",
  props: { toasts: { type: Array as PropType<ToastItem[]>, default: () => [] } },
  emits: ["dismiss"],
});
</script>
