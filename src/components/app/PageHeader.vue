<template>
  <nav v-if="breadcrumbs.length" class="mb-3" aria-label="Điều hướng phân cấp">
    <ol class="breadcrumb mb-3">
      <li
        v-for="(crumb, index) in breadcrumbs"
        :key="`${crumb.label}-${index}`"
        class="breadcrumb-item"
        :class="{ active: !crumb.to }"
        :aria-current="!crumb.to ? 'page' : undefined"
      >
        <RouterLink v-if="crumb.to" :to="crumb.to">{{
          crumb.label
        }}</RouterLink>
        <span v-else>{{ crumb.label }}</span>
      </li>
    </ol>
  </nav>

  <div class="d-flex align-items-center justify-content-between gap-3 mb-4 flex-nowrap">
    <div class="min-w-0">
      <h2 class="mb-0 text-truncate" :title="title">{{ title }}</h2>
      <h5 v-if="description" class="text-body-tertiary fw-semibold mb-0 mt-2 text-truncate" :title="description">
        {{ description }}
      </h5>
    </div>
    <div
      v-if="$slots.actions"
      class="d-flex align-items-center flex-shrink-0 gap-2 ms-auto"
      data-testid="page-header-actions"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { RouterLink } from "vue-router";

export interface PageBreadcrumb {
  label: string;
  to?: string;
}

export default defineComponent({
  name: "PageHeader",
  components: { RouterLink },
  props: {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    breadcrumbs: {
      type: Array as PropType<PageBreadcrumb[]>,
      default: () => [],
    },
  },
});
</script>
