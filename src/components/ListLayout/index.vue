<template>
  <ManagedListLayout :resource="resource" v-bind="$attrs">
    <template v-if="$slots.tabs" #tabs>
      <slot name="tabs" />
    </template>
    <template v-if="$slots.action" #action>
      <slot name="action" />
    </template>
    <template v-if="$slots.filters" #filters="scope">
      <slot name="filters" v-bind="scope" />
    </template>
    <template v-if="$slots.drawer" #drawer="scope">
      <slot name="drawer" v-bind="scope" />
    </template>
  </ManagedListLayout>
</template>

<script setup lang="ts">
import ManagedListLayout from "@/components/ListLayout/ManagedListLayout.vue";

defineOptions({ name: "ListLayout", inheritAttrs: false });
defineProps<{ resource: object }>();
</script>
