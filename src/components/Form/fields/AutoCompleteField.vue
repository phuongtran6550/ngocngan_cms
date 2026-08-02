<template>
  <select
    v-if="field.multiple"
    :id="inputId"
    class="form-select"
    :name="field.key"
    :required="field.required"
    :disabled="field.disabled"
    multiple
    @change="updateMultiple"
  >
    <option
      v-for="option in field.options || []"
      :key="String(option.value)"
      :value="option.value"
      :selected="isSelected(option.value)"
    >
      {{ option.label }}
    </option>
  </select>
  <input
    v-else
    :id="inputId"
    class="form-control"
    :name="field.key"
    type="text"
    :value="displayValue"
    :list="listId"
    :placeholder="field.placeholder"
    :required="field.required"
    :disabled="field.disabled"
    :readonly="field.readonly"
    :autocomplete="field.autocomplete || 'off'"
    @input="updateSingle"
  />
  <datalist v-if="!field.multiple" :id="listId">
    <option v-for="option in field.options || []" :key="String(option.value)" :value="option.label" />
  </datalist>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FormFieldContext } from "@/components/Form/fields/contracts";
import { optionValue, scalarInputValue } from "@/components/Form/fields/field-value";

const props = defineProps<FormFieldContext>();
const emit = defineEmits<{ "update:modelValue": [value: string | number | Array<string | number>] }>();
const listId = computed(() => `${props.inputId}-options`);
const displayValue = computed(() => {
  const option = props.field.options?.find((item) => item.value === props.modelValue);
  return option?.label || scalarInputValue(props.modelValue);
});

function updateSingle(event: Event): void {
  const value = (event.currentTarget as HTMLInputElement).value;
  const option = props.field.options?.find((item) => item.label === value);
  emit("update:modelValue", option?.value ?? value);
}

function updateMultiple(event: Event): void {
  const element = event.currentTarget as HTMLSelectElement;
  emit("update:modelValue", Array.from(element.selectedOptions)
    .map((option) => optionValue(props.field, option.value)));
}

function isSelected(value: string | number): boolean {
  return Array.isArray(props.modelValue)
    && props.modelValue.some((item) => String(item) === String(value));
}
</script>
