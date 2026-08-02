<template>
  <div class="avatar" :class="`avatar-${size}`">
    <img
      v-if="showImage"
      class="rounded-circle"
      :src="src"
      alt=""
      @error="useFallback"
    />
    <svg
      v-else
      class="avatar-placeholder rounded-circle d-block h-100 w-100"
      data-testid="default-avatar"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="24" fill="var(--phoenix-secondary-bg)" />
      <circle cx="24" cy="18" r="8" fill="var(--phoenix-secondary-color)" />
      <path
        d="M7 46c1.8-10.1 8.1-15.5 17-15.5S39.2 35.9 41 46"
        fill="var(--phoenix-secondary-color)"
      />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

type AvatarSize = "l" | "xl";

export default defineComponent({
  name: "AppAvatar",
  props: {
    src: { type: String, default: "" },
    size: { type: String as PropType<AvatarSize>, default: "l" },
  },
  data() {
    return { sourceFailed: false };
  },
  computed: {
    showImage(): boolean {
      return !this.sourceFailed && Boolean(this.src.trim());
    },
  },
  watch: {
    src() {
      this.sourceFailed = false;
    },
  },
  methods: {
    useFallback(): void {
      this.sourceFailed = true;
    },
  },
});
</script>
