<template>
  <div aria-label="Đang tải" role="status">
    <span v-for="row in rows" :key="row" class="placeholder-glow d-block mb-3">
      <span class="placeholder col-12 rounded" />
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "LoadingSkeleton",
  props: { rows: { type: Number, default: 5 } },
});
</script>
