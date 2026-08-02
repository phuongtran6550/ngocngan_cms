<template>
  <div class="form-check form-switch mb-0">
    <input
      :id="inputId"
      class="form-check-input"
      type="checkbox"
      :name="field.key"
      :checked="Boolean(modelValue)"
      :disabled="field.disabled"
      @change="$emit('update:modelValue', ($event.currentTarget as HTMLInputElement).checked)"
    />
  </div>
</template>

<script setup lang="ts">
import type { FormFieldContext } from "@/components/Form/fields/contracts";

defineProps<FormFieldContext>();
defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>
