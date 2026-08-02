<template>
  <input
    :id="inputId"
    class="form-control"
    :name="field.key"
    type="file"
    :required="field.required"
    :disabled="field.disabled"
    :multiple="field.multiple"
    :accept="field.accept"
    @change="updateValue"
  />
</template>

<script setup lang="ts">
import type { FormFieldContext } from "@/components/Form/fields/contracts";

const props = defineProps<FormFieldContext>();
const emit = defineEmits<{ "update:modelValue": [value: File | File[] | null] }>();

function updateValue(event: Event): void {
  const files = Array.from((event.currentTarget as HTMLInputElement).files || []);
  emit("update:modelValue", props.field.multiple ? files : files[0] || null);
}
</script>
