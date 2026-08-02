<template>
  <div class="dropzone dropzone-single" :class="{ 'dz-max-files-reached': preview }">
    <input ref="input" class="visually-hidden" type="file" :accept="imageAccept" capture="environment" @change="selectFile" />
    <button type="button" class="dz-message text-center w-100" :disabled="disabled || busy" @click="openPicker">
      <span v-if="!preview" class="dz-message-text d-grid gap-1">
        <strong>Chụp hoặc chọn ảnh</strong>
        <small class="text-body-tertiary">JPG, PNG, WEBP · tối đa 25 MB</small>
      </span>
    </button>
    <div v-if="preview" class="dz-preview dz-preview-single">
      <div class="dz-preview-cover"><img class="dz-preview-img" :src="preview" alt="Ảnh xem trước" /></div>
    </div>
    <button v-if="preview" type="button" class="btn btn-sm btn-primary position-absolute bottom-0 end-0 m-3" :disabled="disabled || busy" @click="openPicker">
      Chọn ảnh khác
    </button>
    <div v-if="busy" class="position-absolute bottom-0 start-0 end-0 px-4 pb-3" role="status">
      <div class="d-flex justify-content-between fs-10 mb-1"><span>Đang xử lý</span><span>{{ Math.round(progress) }}%</span></div>
      <div class="progress" style="height: 0.5rem;"><div class="progress-bar" :style="{ width: `${progress}%` }" /></div>
    </div>
    <small v-if="localError" class="text-danger d-block mt-2" role="alert">{{ localError }}</small>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {
  IMAGE_FILE_ACCEPT,
  validateImageFile,
} from "@/utils/image-optimizer";

export default defineComponent({
  name: "ImageUploader",
  props: {
    src: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
  },
  emits: ["select"],
  data() {
    return {
      imageAccept: IMAGE_FILE_ACCEPT,
      localPreview: "",
      localError: "",
    };
  },
  computed: {
    preview(): string { return this.localPreview || this.src; },
  },
  beforeUnmount() { this.revokePreview(); },
  methods: {
    openPicker(): void { (this.$refs.input as HTMLInputElement | undefined)?.click(); },
    revokePreview(): void {
      if (this.localPreview) URL.revokeObjectURL(this.localPreview);
      this.localPreview = "";
    },
    selectFile(event: Event): void {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      this.localError = "";
      try {
        validateImageFile(file);
      } catch (error) {
        this.localError = error instanceof Error
          ? error.message
          : "Ảnh đã chọn không hợp lệ";
        input.value = "";
        return;
      }
      this.revokePreview();
      this.localPreview = URL.createObjectURL(file);
      this.$emit("select", file);
      input.value = "";
    },
  },
});
</script>
