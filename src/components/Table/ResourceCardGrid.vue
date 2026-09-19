<template>
  <div
    class="resource-card-grid row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3"
    data-testid="resource-card-grid"
  >
    <article
      v-for="(row, rowIndex) in rows"
      :key="row.id"
      class="col"
      data-testid="resource-card"
      :aria-labelledby="titleId(row, rowIndex)"
    >
      <div
        class="resource-card card h-100 shadow-none border border-translucent"
      >
        <div class="card-body d-flex flex-column p-3 p-lg-4">
          <div class="d-flex align-items-start gap-3">
            <div v-if="selectable" class="form-check mb-0 pt-1">
              <input
                type="checkbox"
                class="form-check-input"
                :checked="isSelected(row)"
                :aria-label="`Chọn bản ghi ${resourceLabel(row)}`"
                :data-testid="`resource-card-select-${row.id}`"
                @click.stop
                @change="toggleSelectRow(row, $event)"
              />
            </div>
            <div class="min-w-0 flex-grow-1">
              <div
                v-if="titleColumn"
                class="text-body-tertiary fs-10 fw-semibold mb-1"
              >
                {{ titleColumn.label }}
              </div>
              <h3
                :id="titleId(row, rowIndex)"
                class="resource-card__title fs-8 mb-0 text-body-emphasis fw-bold text-break"
                data-testid="resource-card-title"
              >
                <CellRenderer
                  v-if="titleColumn"
                  :row="row"
                  :column="titleColumn"
                  :row-index="rowIndex"
                  :page="page"
                  :limit="limit"
                  @action="emitCellAction(row, titleColumn, $event)"
                />
                <span v-else>{{ resourceLabel(row) }}</span>
              </h3>
            </div>

            <div v-if="statusColumn" class="resource-card__status text-end">
              <div class="text-body-tertiary fs-10 fw-semibold mb-1">
                {{ statusColumn.label }}
              </div>
              <CellRenderer
                :row="row"
                :column="statusColumn"
                :row-index="rowIndex"
                :page="page"
                :limit="limit"
                @action="emitCellAction(row, statusColumn, $event)"
              />
            </div>

            <RowActionMenu
              :can-view="allowView"
              :can-edit="canUpdate(row)"
              :can-delete="canDelete(row)"
              :resource-label="resourceLabel(row)"
              @view="$emit('view', row)"
              @edit="$emit('edit', row)"
              @delete="$emit('delete', row)"
            />
          </div>

          <dl
            v-if="metadataColumns.length"
            class="resource-card__metadata row gx-3 gy-3 mb-0 mt-4 pt-3 border-top border-translucent"
          >
            <div
              v-for="column in metadataColumns"
              :key="column.key"
              class="resource-card__field col"
            >
              <dt class="text-body-tertiary fs-10 fw-semibold text-truncate">
                {{ column.label }}
              </dt>
              <dd class="resource-card__value mb-0 mt-1 text-body text-break">
                <CellRenderer
                  :row="row"
                  :column="column"
                  :row-index="rowIndex"
                  :page="page"
                  :limit="limit"
                  @action="emitCellAction(row, column, $event)"
                />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CellRenderer from "@/components/Table/CellRenderer.vue";
import RowActionMenu from "@/components/Table/RowActionMenu.vue";
import type { ColumnDefinition, ResourceRow } from "@/config/resource";
import { resourceIdentity } from "@/utils/resource-action";
import { isColumnVisibleIn } from "@/components/Table/column-visibility";

const props = withDefaults(
  defineProps<{
    columns: ColumnDefinition[];
    rows?: ResourceRow[];
    page?: number;
    limit?: number;
    allowView?: boolean;
    allowUpdate?: boolean;
    allowDelete?: boolean;
    selectable?: boolean;
    selectedKeys?: (string | number)[];
    canUpdateRow?: (row: ResourceRow) => boolean;
    canDeleteRow?: (row: ResourceRow) => boolean;
  }>(),
  {
    rows: () => [],
    page: 1,
    limit: 20,
    allowView: false,
    allowUpdate: false,
    allowDelete: false,
    selectable: false,
    selectedKeys: () => [],
    canUpdateRow: () => true,
    canDeleteRow: () => true,
  },
);

const emit = defineEmits<{
  view: [row: ResourceRow];
  edit: [row: ResourceRow];
  delete: [row: ResourceRow];
  "cell-action": [payload: unknown];
  "select-row": [row: ResourceRow, selected: boolean];
}>();

const selectedKeySet = computed(
  () => new Set((props.selectedKeys || []).map(String)),
);

const visibleColumns = computed(() =>
  props.columns.filter((column) => isColumnVisibleIn(column, "card")),
);
const statusColumn = computed(() =>
  visibleColumns.value.find((column) =>
    ["status", "badge"].includes(column.type),
  ),
);
const titleColumn = computed(() => {
  const candidates = visibleColumns.value.filter(
    (column) =>
      !["stt", "action"].includes(column.type) &&
      column.key !== statusColumn.value?.key,
  );
  return (
    candidates.find((column) =>
      [
        "text",
        "profile",
        "product",
        "group_text",
        "hyperlink",
        "textIsRead",
      ].includes(column.type),
    ) || candidates[0]
  );
});
const metadataColumns = computed(() =>
  visibleColumns.value.filter(
    (column) =>
      column.key !== titleColumn.value?.key &&
      column.key !== statusColumn.value?.key &&
      column.type !== "stt",
  ),
);

function titleId(row: ResourceRow, rowIndex: number): string {
  return `resource-card-title-${row.id}-${rowIndex}`;
}

function resourceLabel(row: ResourceRow): string {
  return resourceIdentity(row);
}

function canUpdate(row: ResourceRow): boolean {
  return Boolean(props.allowUpdate && props.canUpdateRow(row));
}

function canDelete(row: ResourceRow): boolean {
  return Boolean(props.allowDelete && props.canDeleteRow(row));
}

function isSelected(row: ResourceRow): boolean {
  return selectedKeySet.value.has(String(row.id));
}

function toggleSelectRow(row: ResourceRow, event: Event): void {
  const target = event.target as HTMLInputElement;
  emit("select-row", row, target.checked);
}

function emitCellAction(
  row: ResourceRow,
  column: ColumnDefinition,
  action: unknown,
): void {
  emit("cell-action", { row, column, action });
}
</script>

<style scoped>
.resource-card-grid {
  --resource-card-min-height: 100%;
}

.resource-card {
  min-width: 0;
  min-height: var(--resource-card-min-height);
}

.resource-card__title,
.resource-card__value {
  min-width: 0;
  overflow-wrap: anywhere;
}

.resource-card__metadata {
  margin-left: 0;
  margin-right: 0;
}

.resource-card__field {
  min-width: 0;
  flex: 0 0 50%;
}

.resource-card__status {
  flex-shrink: 0;
  max-width: 42%;
}

@media (max-width: 575.98px) {
  .resource-card__field {
    flex-basis: 100%;
  }
}
</style>
