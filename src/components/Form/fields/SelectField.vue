<template>
  <select
    :id="inputId"
    class="form-select"
    :name="field.key"
    v-bind="field.multiple ? {} : { value: modelValue }"
    :required="field.required"
    :disabled="field.disabled"
    :multiple="field.multiple"
    @change="updateValue"
  >
    <option v-if="!field.multiple" value="">Chọn {{ field.label.toLowerCase() }}</option>
    <option
      v-for="option in field.options || []"
      :key="String(option.value)"
      :value="option.value"
      :selected="isSelected(option.value)"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
import type { FormFieldContext } from "@/components/Form/fields/contracts";
import { optionValue } from "@/components/Form/fields/field-value";

const props = defineProps<FormFieldContext>();
const emit = defineEmits<{ "update:modelValue": [value: string | number | Array<string | number>] }>();

function updateValue(event: Event): void {
  const element = event.currentTarget as HTMLSelectElement;
  if (props.field.multiple) {
    emit("update:modelValue", Array.from(element.selectedOptions)
      .map((option) => optionValue(props.field, option.value)));
    return;
  }
  emit("update:modelValue", optionValue(props.field, element.value));
}

function isSelected(value: string | number): boolean {
  return props.field.multiple && Array.isArray(props.modelValue)
    ? props.modelValue.some((item) => String(item) === String(value))
    : String(props.modelValue ?? "") === String(value);
}
</script>
