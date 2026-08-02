<template>
  <textarea
    :id="inputId"
    class="form-control"
    :name="field.key"
    :value="scalarInputValue(modelValue)"
    :placeholder="field.placeholder"
    :required="field.required"
    :disabled="field.disabled"
    :readonly="field.readonly"
    :rows="field.rows || 4"
    :maxlength="field.maxLength"
    @input="$emit('update:modelValue', ($event.currentTarget as HTMLTextAreaElement).value)"
  />
</template>

<script setup lang="ts">
import type { FormFieldContext } from "@/components/Form/fields/contracts";
import { scalarInputValue } from "@/components/Form/fields/field-value";

defineProps<FormFieldContext>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>
