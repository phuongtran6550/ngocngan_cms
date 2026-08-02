<template>
  <component
    v-if="field.type === 'hidden'"
    :is="fieldComponent"
    :field="field"
    :input-id="inputId"
    :model-value="currentValue"
    @update:model-value="updateValue"
  />
  <FieldShell
    v-else
    :field="field"
    :input-id="inputId"
    :error="error"
    :compact="compact"
  >
    <component
      :is="fieldComponent"
      :field="field"
      :input-id="inputId"
      :model-value="currentValue"
      @update:model-value="updateValue"
    />
  </FieldShell>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FormFieldDefinition } from "@/config/resource";
import FieldShell from "@/components/Form/fields/FieldShell.vue";
import { resolveFormField } from "@/components/Form/fields/field-registry";

const props = withDefaults(defineProps<{
  compact?: boolean;
  error?: string;
  field: FormFieldDefinition;
  modelValue?: unknown;
  value?: unknown;
}>(), {
  compact: false,
  error: "",
  modelValue: undefined,
  value: undefined,
});
const emit = defineEmits<{
  update: [value: unknown];
  "update:modelValue": [value: unknown];
}>();

const inputId = computed(() => `field-${props.field.key}`);
const fieldComponent = computed(() => resolveFormField(props.field.type));
const currentValue = computed(() => props.modelValue !== undefined ? props.modelValue : props.value);

function updateValue(value: unknown): void {
  emit("update:modelValue", value);
  emit("update", value);
}
</script>
