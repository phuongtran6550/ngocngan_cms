<template>
  <div
    class="table-responsive scrollbar mx-n1 px-1"
    data-testid="desktop-data-table"
  >
    <table
      class="table fs-9 mb-0"
      :style="{ minWidth: minTableWidth || undefined }"
    >
      <thead>
        <tr>
          <th
            v-for="(column, index) in visibleColumns"
            :key="column.key"
            :class="headerClass(column, index)"
            :style="{ width: column.width }"
            scope="col"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="btn btn-link p-0 text-body fw-semibold text-decoration-none"
              @click="$emit('sort', column.key)"
            >
              {{ column.label }}
            </button>
            <span v-else>{{ column.label }}</span>
          </th>
          <th
            v-if="hasActions"
            class="sort text-end align-middle pe-0 ps-4"
            scope="col"
          >
            <span class="visually-hidden">Thao tác</span>
          </th>
        </tr>
      </thead>
      <tbody class="list">
        <tr
          v-for="(row, rowIndex) in rows"
          :key="row.id"
          class="position-static"
        >
          <td
            v-for="(column, index) in visibleColumns"
            :key="column.key"
            :class="cellClass(column, index)"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="valueFor(row, column)"
            >
              <CellRenderer
                :row="row"
                :column="column"
                :row-index="rowIndex"
                :page="page"
                :limit="limit"
                @action="emitCellAction(row, column, $event)"
              />
            </slot>
          </td>
          <td
            v-if="hasActions"
            class="align-middle white-space-nowrap text-end pe-0 ps-4 btn-reveal-trigger"
          >
            <RowActionMenu
              :can-view="allowView"
              :can-edit="canUpdate(row)"
              :can-delete="canDelete(row)"
              :resource-label="resourceLabel(row)"
              @view="$emit('view', row)"
              @edit="$emit('edit', row)"
              @delete="$emit('delete', row)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ColumnDefinition, ResourceRow } from "@/config/resource";
import CellRenderer from "@/components/Table/CellRenderer.vue";
import RowActionMenu from "@/components/Table/RowActionMenu.vue";
import { resourceIdentity } from "@/utils/resource-action";
import { cellValue } from "@/components/Table/cells/value";
import { isColumnVisibleIn } from "@/components/Table/column-visibility";

export default defineComponent({
  name: "DataTable",
  components: { CellRenderer, RowActionMenu },
  props: {
    columns: { type: Array as PropType<ColumnDefinition[]>, required: true },
    rows: { type: Array as PropType<ResourceRow[]>, default: () => [] },
    page: { type: Number, default: 1 },
    limit: { type: Number, default: 20 },
    minTableWidth: { type: String, default: "" },
    allowView: { type: Boolean, default: false },
    allowUpdate: { type: Boolean, default: false },
    allowDelete: { type: Boolean, default: false },
    canUpdateRow: {
      type: Function as PropType<(row: ResourceRow) => boolean>,
      default: () => true,
    },
    canDeleteRow: {
      type: Function as PropType<(row: ResourceRow) => boolean>,
      default: () => true,
    },
  },
  emits: ["sort", "view", "edit", "delete", "cell-action"],
  computed: {
    visibleColumns(): ColumnDefinition[] {
      return this.columns.filter((column) =>
        isColumnVisibleIn(column, "table"),
      );
    },
    hasActions(): boolean {
      return this.allowView || this.allowUpdate || this.allowDelete;
    },
  },
  methods: {
    headerClass(column: ColumnDefinition, index: number): string[] {
      return [
        "sort",
        "align-middle",
        index === 0 ? "ps-0" : "ps-4",
        this.isNumericColumn(column) ? "text-end" : "",
        this.isCompactColumn(column) ? "white-space-nowrap" : "",
      ].filter(Boolean);
    },
    cellClass(column: ColumnDefinition, index: number): string[] {
      return [
        "align-middle",
        index === 0 ? "ps-0" : "ps-4",
        this.isCompactColumn(column) ? "white-space-nowrap" : "",
        this.isNumericColumn(column) ? "text-end" : "",
        column.type === "text" ? "fw-semibold" : "",
        column.type === "datetime" ? "text-body-tertiary" : "",
      ].filter(Boolean);
    },
    isNumericColumn(column: ColumnDefinition): boolean {
      return ["number", "money", "dollar"].includes(column.type);
    },
    isCompactColumn(column: ColumnDefinition): boolean {
      return ["date", "datetime", "image", "stt", "time"].includes(column.type);
    },
    resourceLabel(row: ResourceRow): string {
      return resourceIdentity(row);
    },
    canUpdate(row: ResourceRow): boolean {
      return this.allowUpdate && this.canUpdateRow(row);
    },
    canDelete(row: ResourceRow): boolean {
      return this.allowDelete && this.canDeleteRow(row);
    },
    valueFor(row: ResourceRow, column: ColumnDefinition): unknown {
      return cellValue(row, column);
    },
    emitCellAction(
      row: ResourceRow,
      column: ColumnDefinition,
      action: unknown,
    ): void {
      this.$emit("cell-action", { row, column, action });
    },
  },
});
</script>
