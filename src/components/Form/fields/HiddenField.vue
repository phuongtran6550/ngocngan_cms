<template>
  <input :id="inputId" :name="field.key" type="hidden" :value="scalarInputValue(modelValue)" />
</template>

<script setup lang="ts">
import type { FormFieldContext } from "@/components/Form/fields/contracts";
import { scalarInputValue } from "@/components/Form/fields/field-value";

defineProps<FormFieldContext>();
</script>
