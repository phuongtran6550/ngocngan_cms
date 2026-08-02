<template>
  <dl class="row gy-4 mb-0">
    <template v-for="field in fields" :key="field.label">
      <dt class="col-12 col-md-5 mb-0 fs-9 fw-semibold text-body-tertiary">{{ field.label }}</dt>
      <dd class="col-12 col-md-7 mb-0 fw-semibold text-body-highlight">{{ field.value }}</dd>
    </template>
  </dl>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export interface DetailDefinition {
  label: string;
  value: string;
}

export default defineComponent({
  name: "DetailDefinitionList",
  props: {
    fields: {
      type: Array as PropType<DetailDefinition[]>,
      required: true,
    },
  },
});
</script>
