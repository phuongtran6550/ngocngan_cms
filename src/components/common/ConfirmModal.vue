<template>
  <div v-if="open" class="modal-backdrop">
    <div class="modal">
      <h3>{{ title }}</h3>
      <p class="muted">{{ message }}</p>
      <div class="card-actions">
        <button class="btn btn-danger" type="button" @click="$emit('confirm')">{{ confirmText }}</button>
        <button class="btn btn-light" type="button" @click="$emit('cancel')">Đóng</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: Boolean,
  title: { type: String, default: 'Xác nhận' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Xác nhận' }
});
defineEmits(['confirm', 'cancel']);
</script>
