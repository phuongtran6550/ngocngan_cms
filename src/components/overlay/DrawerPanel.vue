<template>
  <Teleport to="body">
    <div v-if="open" class="offcanvas offcanvas-end show" :class="{ 'offcanvas-wide': wide }" tabindex="-1" role="dialog" aria-modal="true" :aria-label="title">
      <div class="offcanvas-header">
        <h2 class="offcanvas-title fs-7 mb-0">{{ title }}</h2>
        <button type="button" class="btn-close" aria-label="Đóng" @click="$emit('close')" />
      </div>
      <div class="offcanvas-body"><slot /></div>
    </div>
    <button v-if="open" type="button" class="offcanvas-backdrop fade show border-0 p-0" aria-label="Đóng" @click="$emit('close')" />
  </Teleport>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { createOverlayBehavior } from "@/components/overlay/behavior";

export default defineComponent({
  name: "DrawerPanel",
  props: { open: Boolean, title: { type: String, default: "Chi tiết" }, wide: Boolean },
  emits: ["close"],
  data() {
    return { overlay: createOverlayBehavior(() => this.$emit("close")) };
  },
  watch: {
    open: {
      immediate: true,
      handler(open: boolean) {
        this.overlay.sync(open);
      },
    },
  },
  beforeUnmount() {
    this.overlay.dispose();
  },
});
</script>

<style scoped>
.offcanvas-wide { --bs-offcanvas-width: min(96vw, 72rem); }
</style>
