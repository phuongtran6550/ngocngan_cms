<template>
  <div v-if="message" :id="id" class="invalid-feedback d-block" role="alert">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string;
  message?: string;
}>();
</script>
