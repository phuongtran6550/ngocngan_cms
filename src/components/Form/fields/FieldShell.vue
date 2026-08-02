<template>
  <div :class="compact ? 'mb-0' : 'mb-3'">
    <label v-if="!compact" class="form-label" :for="inputId">
      {{ field.label }}
      <span v-if="field.required" class="text-danger ms-1">*</span>
    </label>
    <slot />
    <div v-if="!compact && field.helpText" class="form-text">{{ field.helpText }}</div>
    <div v-if="error" class="invalid-feedback d-block" role="alert">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import type { FormFieldDefinition } from "@/config/resource";

defineProps<{
  compact?: boolean;
  error?: string;
  field: FormFieldDefinition;
  inputId: string;
}>();
</script>
