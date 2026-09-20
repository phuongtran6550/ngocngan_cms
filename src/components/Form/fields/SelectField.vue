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
  <AutoCompleteSelect
    v-else
    :id="inputId"
    :name="field.key"
    :model-value="singleValue"
    :options="field.options || []"
    :placeholder="field.placeholder || `Chọn ${field.label.toLowerCase()}`"
    :required="field.required"
    :disabled="field.disabled"
    @update:model-value="onSingleSelectChange"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import AutoCompleteSelect from "@/components/Form/AutoCompleteSelect.vue";
import type { FormFieldContext } from "@/components/Form/fields/contracts";
import { optionValue } from "@/components/Form/fields/field-value";

const props = defineProps<FormFieldContext>();
const emit = defineEmits<{ "update:modelValue": [value: string | number | Array<string | number>] }>();

const singleValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return "";
  return props.modelValue as string | number;
});

function onSingleSelectChange(val: unknown): void {
  emit("update:modelValue", optionValue(props.field, String(val ?? "")));
}

function updateMultiple(event: Event): void {
  const element = event.currentTarget as HTMLSelectElement;
  emit("update:modelValue", Array.from(element.selectedOptions)
    .map((option) => optionValue(props.field, option.value)));
}

function isSelected(value: string | number): boolean {
  return props.field.multiple && Array.isArray(props.modelValue)
    ? props.modelValue.some((item) => String(item) === String(value))
    : String(props.modelValue ?? "") === String(value);
}
</script>

