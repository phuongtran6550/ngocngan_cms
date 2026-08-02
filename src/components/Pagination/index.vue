<template>
  <nav v-if="totalPages > 0" class="d-flex flex-wrap align-items-center justify-content-between gap-3" aria-label="Phân trang">
    <span class="text-body-tertiary fs-10">Trang {{ page }} / {{ totalPages }} · {{ total }} bản ghi</span>
    <ul class="pagination mb-0">
      <li class="page-item" :class="{ disabled: page <= 1 }">
        <button type="button" class="page-link" :disabled="page <= 1" @click="$emit('change', page - 1)">Trước</button>
      </li>
      <li class="page-item" :class="{ disabled: page >= totalPages }">
        <button type="button" class="page-link" :disabled="page >= totalPages" @click="$emit('change', page + 1)">Sau</button>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "PaginationBar",
  props: {
    page: { type: Number, default: 1 },
    totalPages: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  emits: ["change"],
});
</script>
