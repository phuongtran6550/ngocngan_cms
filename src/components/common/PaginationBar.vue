<template>
  <div class="toolbar" v-if="totalPages > 1">
    <button class="btn btn-light" type="button" :disabled="page <= 1" @click="$emit('change', page - 1)">‹</button>
    <span class="muted">Trang {{ page }} / {{ totalPages }}</span>
    <button class="btn btn-light" type="button" :disabled="page >= totalPages" @click="$emit('change', page + 1)">›</button>
  </div>
</template>

<script setup>
defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true }
});
defineEmits(['change']);
</script>
