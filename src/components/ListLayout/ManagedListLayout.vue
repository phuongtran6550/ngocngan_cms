<template>
  <div
    v-if="controller.message.value"
    class="alert alert-subtle-success"
    role="status"
  >
    {{ controller.message.value }}
  </div>

  <ListShell
    :definition="effectiveDefinition"
    :rows="rows"
    :pagination="controller.pagination.value"
    :loading="controller.loading.value"
    :error="controller.error.value"
    :selected-columns="controller.selectedColumns.value"
    :can-update-row="canUpdateRow"
    :can-delete-row="canDeleteRow"
    @create="createRow"
    @refresh="refresh"
    @fields="controller.setSelectedColumns"
    @sort="sort"
    @view="viewRow"
    @edit="editRow"
    @delete="deleteRow"
    @cell-action="handleCellAction"
    @page="controller.load"
  >
    <template v-if="$slots.tabs" #tabs>
      <slot name="tabs" />
    </template>
    <template v-if="$slots.action" #action>
      <slot name="action" />
    </template>
    <template v-if="$slots.filters || filterFields.length" #filters>
      <slot
        v-if="$slots.filters"
        name="filters"
        :filters="controller.filters.value"
        :set-filter="controller.setFilter"
      />
      <div v-else class="d-flex flex-wrap gap-3">
        <div
          v-for="field in filterFields"
          :key="field.key"
          class="flex-shrink-0"
        >
          <DynamicField
            compact
            :field="field"
            :model-value="controller.filters.value[field.key]"
            @update:model-value="controller.setFilter(field.key, $event)"
          />
        </div>
      </div>
    </template>
  </ListShell>

  <slot
    v-if="controller.isMutable && effectiveDefinition.form"
    name="drawer"
    :open="controller.drawerOpen.value"
    :editing="Boolean(controller.editing.value)"
    :form="formModel"
    :submitting="controller.submitting.value"
    :error="controller.error.value"
    :close="controller.closeDrawer"
    :patch="updateForm"
    :save="save"
  >
    <DrawerPanel
      :open="controller.drawerOpen.value"
      :title="drawerTitle"
      @close="controller.closeDrawer"
    >
      <div
        v-if="controller.error.value"
        class="alert alert-subtle-danger"
        role="alert"
      >
        {{ controller.error.value }}
      </div>
      <FormLayout
        :definition="effectiveDefinition.form"
        :model-value="formModel"
        :submitting="controller.submitting.value"
        :submit-label="submitLabel"
        @update:model-value="updateForm"
        @submit="save"
        @cancel="controller.closeDrawer"
      />
    </DrawerPanel>
  </slot>

  <ConfirmDialog
    v-if="controller.isMutable"
    :open="Boolean(controller.deleteTarget.value)"
    :title="`Xóa ${singularLabel}`"
    :message="deleteMessage"
    :confirm-label="`Xóa ${singularLabel}`"
    @cancel="controller.cancelDelete"
    @confirm="controller.confirmDelete"
  />
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, onUnmounted } from "vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import DynamicField from "@/components/Form/DynamicField.vue";
import FormLayout from "@/components/FormLayout/index.vue";
import ListShell from "@/components/ListLayout/ListShell.vue";
import type {
  ResourceRowModel,
  ResourceRuntimeDeclaration,
} from "@/components/resource/contracts";
import { useResourceController } from "@/components/resource/useResourceController";
import type { ResourceDefinition, ResourceRow } from "@/config/resource";
import { authenStore } from "@/stores/app-authen";
import { searchQueryFromRoute } from "@/utils/global-search";

type ManagedRow = ResourceRowModel & Record<string, unknown>;
type ManagedForm = Record<string, unknown>;
type ManagedFilters = Record<string, unknown>;
type ManagedResource = ResourceRuntimeDeclaration<
  ManagedRow,
  ManagedForm,
  ManagedFilters
>;

const props = defineProps<{ resource: object }>();
const emit = defineEmits<{
  create: [];
  edit: [row: ResourceRow];
  refresh: [];
  view: [row: ResourceRow];
  cellAction: [payload: unknown];
}>();

const resource = props.resource as ManagedResource;
const controller = useResourceController(resource);
const auth = authenStore();

const effectiveDefinition = computed<ResourceDefinition>(() => ({
  ...resource.definition,
  columns: resource.definition.columns.map((column) => ({
    ...column,
    visible: controller.selectedColumns.value.includes(column.key),
  })),
  actions: {
    ...resource.definition.actions,
    create:
      controller.isMutable &&
      Boolean(resource.definition.actions.create) &&
      can(resource.definition.permission.create),
    update:
      controller.isMutable &&
      Boolean(resource.definition.actions.update) &&
      can(resource.definition.permission.update),
    delete:
      controller.isMutable &&
      Boolean(resource.definition.actions.delete) &&
      can(resource.definition.permission.delete),
    view:
      Boolean(resource.definition.actions.view) &&
      (!resource.viewPermission || auth.can(resource.viewPermission)),
  },
}));
const rows = computed<ResourceRow[]>(() =>
  controller.items.value.map((row) =>
    resource.rowForTable ? resource.rowForTable(row) : (row as ResourceRow),
  ),
);
const filterFields = computed(() => resource.definition.filters || []);
const formModel = computed<ManagedForm>(() => controller.form.value || {});
const singularLabel = computed(() =>
  resource.mode === "readonly" ? "bản ghi" : resource.labels.singular,
);
const drawerTitle = computed(() =>
  controller.editing.value
    ? `Cập nhật ${singularLabel.value}`
    : `Thêm ${singularLabel.value}`,
);
const submitLabel = computed(() =>
  controller.editing.value ? "Cập nhật" : `Thêm ${singularLabel.value}`,
);
const deleteMessage = computed(() => {
  const name = String(
    controller.deleteTarget.value?.name || singularLabel.value,
  );
  return `Bạn có chắc muốn xóa “${name}”? Hành động này không thể hoàn tác.`;
});

function can(permission?: string): boolean {
  return !permission || auth.can(permission);
}

function canUpdateRow(row: ResourceRow): boolean {
  if (!effectiveDefinition.value.actions.update) return false;
  return resource.canUpdate?.(row as ManagedRow) !== false;
}

function canDeleteRow(row: ResourceRow): boolean {
  if (!effectiveDefinition.value.actions.delete) return false;
  return !resource.canDelete?.(row as ManagedRow);
}

function createRow(): void {
  controller.openCreate();
  emit("create");
}

function editRow(row: ResourceRow): void {
  controller.openEdit(row as ManagedRow);
  emit("edit", row);
}

function deleteRow(row: ResourceRow): void {
  controller.requestDelete(row as ManagedRow);
}

function viewRow(row: ResourceRow): void {
  emit("view", row);
}

function refresh(): void {
  void controller.load();
  emit("refresh");
}

function sort(key: string): void {
  void controller.applySort(key);
}

function updateForm(value: ManagedForm): void {
  controller.form.value = value;
}

function save(value: ManagedForm): void {
  void controller.save(value);
}

function handleCellAction(payload: unknown): void {
  emit("cellAction", payload);
}

onMounted(() => {
  const route = (getCurrentInstance()?.proxy?.$route || { query: {} }) as {
    query: Record<string, unknown>;
  };
  controller.query.value = searchQueryFromRoute(route.query.query);
  void controller.load(1);
});

onUnmounted(() => controller.dispose());
</script>
