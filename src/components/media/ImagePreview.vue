<template>
  <Teleport to="body">
    <div v-if="src" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" aria-label="Xem ảnh">
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title fs-7">Xem ảnh</h2>
            <button type="button" class="btn-close" aria-label="Đóng ảnh" @click="$emit('close')" />
          </div>
          <div class="modal-body text-center bg-body-tertiary">
            <img class="img-fluid rounded" style="max-height: 75vh;" :src="src" :alt="alt" />
          </div>
        </div>
      </div>
    </div>
    <button v-if="src" type="button" class="modal-backdrop fade show border-0 p-0" aria-label="Đóng ảnh" @click="$emit('close')" />
  </Teleport>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { createOverlayBehavior } from "@/components/overlay/behavior";

export default defineComponent({
  name: "ImagePreview",
  props: { src: { type: String, default: "" }, alt: { type: String, default: "Ảnh sản phẩm" } },
  emits: ["close"],
  data() {
    return { overlay: createOverlayBehavior(() => this.$emit("close")) };
  },
  watch: {
    src: {
      immediate: true,
      handler(src: string) {
        this.overlay.sync(Boolean(src));
      },
    },
  },
  beforeUnmount() {
    this.overlay.dispose();
  },
});
</script>
