<template>
  <input
    :id="inputId"
    class="form-control"
    :name="field.key"
    :type="inputType"
    :value="scalarInputValue(modelValue)"
    :placeholder="field.placeholder"
    :required="field.required"
    :disabled="field.disabled"
    :readonly="field.readonly"
    :min="field.min"
    :max="field.max"
    :maxlength="field.maxLength"
    :step="field.step"
    :autocomplete="field.autocomplete"
    @input="updateValue"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FormFieldContext } from "@/components/Form/fields/contracts";
import { numericInputValue, scalarInputValue } from "@/components/Form/fields/field-value";

const props = defineProps<FormFieldContext>();
const emit = defineEmits<{ "update:modelValue": [value: string | number | null] }>();
const inputType = computed(() => {
  if (props.field.type === "password") return "password";
  if (props.field.type === "number" || props.field.type === "money") return "number";
  if (props.field.type === "datetime") return "datetime-local";
  if (props.field.type === "date") return "date";
  if (props.field.type === "email" || props.field.type === "tel" || props.field.type === "url") {
    return props.field.type;
  }
  return "text";
});

function updateValue(event: Event): void {
  const value = (event.currentTarget as HTMLInputElement).value;
  emit("update:modelValue", props.field.type === "number" || props.field.type === "money"
    ? numericInputValue(value)
    : value);
}
</script>
