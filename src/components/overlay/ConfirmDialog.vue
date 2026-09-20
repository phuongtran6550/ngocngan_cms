<template>
  <Teleport to="body">
    <div v-if="open" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h2 id="confirm-title" class="modal-title fs-7">{{ title }}</h2><button type="button" class="btn-close" aria-label="Đóng" @click="$emit('cancel')" /></div>
          <div class="modal-body">{{ message }}</div>
          <div class="modal-footer"><button type="button" class="btn btn-phoenix-secondary" @click="$emit('cancel')">Hủy</button><button type="button" :class="['btn', `btn-${confirmVariant}`]" @click="$emit('confirm')">{{ confirmLabel }}</button></div>
        </div>
      </div>
    </div>
    <button v-if="open" type="button" class="modal-backdrop fade show border-0 p-0" aria-label="Đóng" @click="$emit('cancel')" />
  </Teleport>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { createOverlayBehavior } from "@/components/overlay/behavior";

export default defineComponent({
  name: "ConfirmDialog",
  props: {
    open: Boolean,
    title: { type: String, default: "Xác nhận" },
    message: { type: String, default: "Bạn có chắc chắn muốn tiếp tục?" },
    confirmLabel: { type: String, default: "Xác nhận" },
    confirmVariant: { type: String, default: "danger" },
  },
  emits: ["cancel", "confirm"],
  data() {
    return { overlay: createOverlayBehavior(() => this.$emit("cancel")) };
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
