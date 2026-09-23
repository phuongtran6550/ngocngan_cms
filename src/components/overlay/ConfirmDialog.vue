<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="confirm-title" class="modal-title fs-7">{{ title }}</h2>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              :disabled="loading"
              @click="handleCancel"
            />
          </div>
          <div class="modal-body">{{ message }}</div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-phoenix-secondary"
              :disabled="loading"
              @click="handleCancel"
            >
              Hủy
            </button>
            <button
              type="button"
              :class="['btn', `btn-${confirmVariant}`]"
              :disabled="loading"
              @click="handleConfirm"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <button
      v-if="open"
      type="button"
      class="modal-backdrop fade show border-0 p-0"
      aria-label="Đóng"
      :disabled="loading"
      @click="handleCancel"
    />
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
    loading: { type: Boolean, default: false },
  },
  emits: ["cancel", "confirm"],
  data() {
    return { overlay: createOverlayBehavior(() => this.handleCancel()) };
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
  methods: {
    handleCancel(): void {
      if (this.loading) return;
      this.$emit("cancel");
    },
    handleConfirm(): void {
      if (this.loading) return;
      this.$emit("confirm");
    },
  },
});
</script>
