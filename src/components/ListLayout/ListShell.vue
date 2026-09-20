<template>
  <nav
    v-if="definition.breadcrumbs?.length"
    class="mb-3"
    aria-label="breadcrumb"
  >
    <ol class="breadcrumb mb-0">
      <li
        v-for="(breadcrumb, index) in definition.breadcrumbs"
        :key="breadcrumb.text"
        class="breadcrumb-item"
        :class="{ active: index === definition.breadcrumbs.length - 1 }"
        :aria-current="
          index === definition.breadcrumbs.length - 1 ? 'page' : undefined
        "
      >
        <RouterLink v-if="breadcrumb.link" :to="breadcrumb.link">{{
          breadcrumb.text
        }}</RouterLink>
        <span v-else>{{ breadcrumb.text }}</span>
      </li>
    </ol>
  </nav>

  <div class="mb-9">
    <div class="row g-3">
      <div class="col-auto">
        <h2 class="mb-0">{{ definition.title }}</h2>
      </div>
      <div class="col-auto ms-auto d-flex align-items-center gap-2">
        <slot name="header-actions" />
        <button
          v-if="definition.actions.create"
          type="button"
          class="btn btn-sm btn-primary"
          aria-label="Thêm mới"
          data-testid="list-create"
          @click="$emit('create')"
        >
          <AppIcon name="plus" class="me-sm-2" />
          <span class="d-none d-sm-inline">Thêm mới</span>
        </button>
      </div>
    </div>

    <ul
      v-if="tabs.length || $slots.tabs"
      class="nav nav-links mb-3 mb-lg-2 mx-n3"
      aria-label="Bộ lọc danh sách"
    >
      <slot name="tabs" />
      <li v-for="tab in tabs" :key="String(tab.value)" class="nav-item">
        <a
          class="nav-link"
          :class="{ active: isActiveTab(tab.value) }"
          :aria-current="isActiveTab(tab.value) ? 'page' : undefined"
          href="#"
          @click.prevent="$emit('tab', tab.value)"
        >
          <span>{{ tab.label }} </span>
          <span
            v-if="tab.count !== undefined"
            class="text-body-tertiary fw-semibold"
            >({{ tab.count }})</span
          >
        </a>
      </li>
    </ul>

    <div id="products">
      <div class="mb-3 mt-2">
        <div class="d-flex flex-wrap align-items-center gap-3">
          <div
            class="list-total-summary"
            data-testid="list-total-summary"
            :aria-label="`Tổng số bản ghi: ${pagination.total}`"
          >
            <span class="list-total-summary__label">ALL</span>
            <span class="list-total-summary__count"
              >({{ pagination.total }})</span
            >
          </div>

          <div
            v-if="$slots.filters"
            class="list-filters scrollbar overflow-hidden-y flex-grow-1 min-w-0"
          >
            <div class="d-flex flex-wrap gap-3 w-100">
              <slot name="filters" />
            </div>
          </div>

          <div
            class="ms-auto d-flex flex-wrap align-items-center justify-content-end gap-2"
          >
            <div v-if="$slots.action">
              <slot name="action" />
            </div>

            <div
              class="list-view-toggle"
              role="group"
              aria-label="Chế độ hiển thị danh sách"
              data-testid="view-mode-toggle"
            >
              <button
                v-for="option in viewOptions"
                :key="option.mode"
                type="button"
                class="list-view-toggle__option"
                :class="{ 'is-active': viewMode === option.mode }"
                :aria-label="option.accessibilityLabel"
                :aria-pressed="viewMode === option.mode"
                :data-testid="`view-mode-${option.mode}`"
                :title="option.accessibilityLabel"
                @click="setViewMode(option.mode)"
              >
                <AppIcon :name="option.icon" />
                <span>{{ option.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="error" class="alert alert-subtle-danger mb-4" role="alert">
        {{ error }}
      </div>

      <div
        class="mx-n4 px-4 mx-lg-n6 px-lg-6 position-relative top-1"
        :class="
          viewMode === 'table'
            ? 'bg-body-emphasis border-top border-bottom border-translucent'
            : 'list-view-surface--grid'
        "
        data-testid="list-view-surface"
      >
        <div>
          <LoadingSkeleton v-if="loading" class="py-4" />
          <EmptyState v-else-if="!rows.length" class="py-4" />
          <DataTable
            v-else-if="viewMode === 'table'"
            :columns="definition.columns"
            :rows="rows"
            :page="pagination.page"
            :limit="pagination.limit"
            :min-table-width="definition.tableMinWidth"
            :allow-view="Boolean(definition.actions.view)"
            :allow-update="Boolean(definition.actions.update)"
            :allow-delete="Boolean(definition.actions.delete)"
            :allow-restore="Boolean(definition.actions.restore)"
            :selectable="selectable"
            :selected-keys="selectedKeys"
            :can-update-row="canUpdateRow"
            :can-delete-row="canDeleteRow"
            :can-restore-row="canRestoreRow"
            @sort="$emit('sort', $event)"
            @view="$emit('view', $event)"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @restore="$emit('restore', $event)"
            @cell-action="$emit('cell-action', $event)"
            @select-row="(row: any, val: any) => $emit('select-row', row, val)"
            @select-all="$emit('select-all', $event)"
          />
          <ResourceCardGrid
            v-else
            :columns="definition.columns"
            :rows="rows"
            :page="pagination.page"
            :limit="pagination.limit"
            :allow-view="Boolean(definition.actions.view)"
            :allow-update="Boolean(definition.actions.update)"
            :allow-delete="Boolean(definition.actions.delete)"
            :allow-restore="Boolean(definition.actions.restore)"
            :selectable="selectable"
            :selected-keys="selectedKeys"
            :can-update-row="canUpdateRow"
            :can-delete-row="canDeleteRow"
            :can-restore-row="canRestoreRow"
            @view="$emit('view', $event)"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @restore="$emit('restore', $event)"
            @cell-action="$emit('cell-action', $event)"
            @select-row="(row: any, val: any) => $emit('select-row', row, val)"
          />
        </div>

        <div
          v-if="pagination.totalPages > 0"
          class="border-top border-translucent py-2"
        >
          <PaginationBar
            :page="pagination.page"
            :total-pages="pagination.totalPages"
            :total="pagination.total"
            @change="$emit('page', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import { RouterLink } from "vue-router";
import AppIcon from "@/components/ui/AppIcon.vue";
import DataTable from "@/components/Table/DataTable.vue";
import ResourceCardGrid from "@/components/Table/ResourceCardGrid.vue";
import PaginationBar from "@/components/Pagination/index.vue";
import EmptyState from "@/components/placeholder/EmptyState.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import {
  useListViewMode,
  type ListViewMode,
} from "@/components/ListLayout/useListViewMode";
import type {
  PaginationState,
  ResourceDefinition,
  ResourceRow,
} from "@/config/resource";

interface ListTab {
  count?: number;
  label: string;
  value: unknown;
}

interface ListViewOption {
  accessibilityLabel: string;
  icon: string;
  label: string;
  mode: ListViewMode;
}

const viewOptions: readonly ListViewOption[] = [
  {
    accessibilityLabel: "Hiển thị dạng bảng",
    icon: "table",
    label: "Bảng",
    mode: "table",
  },
  {
    accessibilityLabel: "Hiển thị dạng thẻ",
    icon: "grid",
    label: "Thẻ",
    mode: "grid",
  },
];

export default defineComponent({
  name: "ListShell",
  components: {
    AppIcon,
    DataTable,
    EmptyState,
    LoadingSkeleton,
    PaginationBar,
    ResourceCardGrid,
    RouterLink,
  },
  props: {
    definition: {
      type: Object as PropType<ResourceDefinition>,
      required: true,
    },
    rows: { type: Array as PropType<ResourceRow[]>, default: () => [] },
    pagination: { type: Object as PropType<PaginationState>, required: true },
    loading: { type: Boolean, default: false },
    error: { type: String, default: "" },
    selectedColumns: { type: Array as PropType<string[]>, default: () => [] },
    tabs: { type: Array as PropType<ListTab[]>, default: () => [] },
    activeTabValue: { default: "" },
    canUpdateRow: {
      type: Function as PropType<(row: ResourceRow) => boolean>,
      default: () => true,
    },
    canDeleteRow: {
      type: Function as PropType<(row: ResourceRow) => boolean>,
      default: () => true,
    },
    canRestoreRow: {
      type: Function as PropType<(row: ResourceRow) => boolean>,
      default: () => false,
    },
    selectable: { type: Boolean, default: false },
    selectedKeys: {
      type: Array as PropType<(string | number)[]>,
      default: () => [],
    },
  },
  emits: [
    "create",
    "refresh",
    "fields",
    "sort",
    "view",
    "edit",
    "delete",
    "restore",
    "cell-action",
    "tab",
    "page",
    "select-row",
    "select-all",
  ],
  setup(props) {
    return {
      ...useListViewMode(computed(() => props.definition.key)),
      viewOptions,
    };
  },
  methods: {
    isActiveTab(value: unknown): boolean {
      return String(value) === String(this.activeTabValue);
    },
  },
});
</script>

<style scoped>
.list-total-summary {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 2.125rem;
  color: var(--phoenix-body-color);
  font-size: 0.875rem;
  line-height: 1;
  white-space: nowrap;
}

.list-total-summary__label {
  font-weight: 800;
  letter-spacing: 0.01em;
}

.list-total-summary__count {
  color: var(--phoenix-tertiary-color);
  font-weight: 600;
}

.list-view-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.1875rem;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.625rem;
  background: rgba(var(--phoenix-tertiary-bg-rgb), 0.38);
}

.list-view-toggle__option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4375rem;
  min-height: 2.125rem;
  padding: 0.375rem 0.6875rem;
  border: 0;
  border-radius: 0.4375rem;
  color: var(--phoenix-secondary-color);
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 150ms ease,
    background-color 150ms ease,
    box-shadow 150ms ease;
}

.list-view-toggle__option:hover:not(.is-active) {
  color: var(--phoenix-body-color);
  background: rgba(var(--phoenix-emphasis-bg-rgb), 0.55);
}

.list-view-toggle__option.is-active {
  color: var(--phoenix-primary);
  background: var(--phoenix-emphasis-bg);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.14);
}

.list-view-toggle__option:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(var(--phoenix-primary-rgb), 0.24);
}

.list-view-toggle__option :deep(.cms-icon) {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
}

.list-view-surface--grid {
  background: transparent;
}
</style>
