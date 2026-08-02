<template>
  <div class="text-center py-6" role="status">
    <AppIcon class="fs-3 text-body-tertiary mb-3" name="archive" />
    <h2 class="fs-8 mb-2">{{ title }}</h2>
    <p class="text-body-tertiary mb-0">{{ description }}</p>
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";

export default defineComponent({
  name: "EmptyState",
  components: { AppIcon },
  props: {
    title: { type: String, default: "Chưa có dữ liệu" },
    description: { type: String, default: "Dữ liệu sẽ hiển thị tại đây khi có bản ghi." },
  },
});
</script>
