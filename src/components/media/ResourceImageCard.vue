<template>
  <button
    type="button"
    class="card w-100 overflow-hidden border-0 bg-body-secondary p-0 shadow-none"
    @click="$emit('preview')"
  >
    <span class="ratio ratio-1x1">
      <img class="h-100 w-100 object-fit-contain" :src="src" :alt="alt" />
    </span>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ResourceImageCard",
  props: {
    src: { type: String, required: true },
    alt: { type: String, required: true },
  },
  emits: ["preview"],
});
</script>
