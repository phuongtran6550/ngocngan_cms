<template>
  <div v-if="catalogError" class="alert alert-subtle-danger" role="alert">
    {{ catalogError }}
  </div>

  <ListLayout
    :resource="resource"
    @create="loadPermissions"
    @edit="loadPermissions"
    @refresh="loadPermissions"
  >
    <template #filters="{ filters, setFilter }">
      <div class="d-flex align-items-center gap-2">
        <label class="text-body-tertiary fs-10" for="role-system-filter"
          >Phân loại</label
        >
        <select
          id="role-system-filter"
          class="form-select form-select-sm w-auto"
          :value="filters.system"
          @change="
            setFilter('system', ($event.target as HTMLSelectElement).value)
          "
        >
          <option value="all">Tất cả</option>
          <option value="system">Hệ thống</option>
          <option value="custom">Tùy chỉnh</option>
        </select>
      </div>
    </template>

    <template #drawer="drawer">
      <RoleFormDrawer
        v-if="isRoleFormModel(drawer.form)"
        :open="drawer.open"
        :editing="drawer.editing"
        :model-value="drawer.form"
        :catalog="catalog"
        :catalog-loading="catalogLoading"
        :submitting="drawer.submitting"
        :error="drawer.error || catalogError"
        @close="drawer.close"
        @update:model-value="drawer.patch"
        @submit="drawer.save"
      />
    </template>
  </ListLayout>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ListLayout from "@/components/ListLayout/index.vue";
import RoleFormDrawer from "@/views/Administrator/Roles/components/RoleFormDrawer.vue";
import { roleResource } from "@/views/Administrator/Roles/config";
import { roleService } from "@/views/Administrator/Roles/service";
import { apiError } from "@/request";
import type {
  PermissionCatalog,
  RoleFormModel,
} from "@/views/Administrator/Roles/types";

function emptyCatalog(): PermissionCatalog {
  return { items: [], groups: [] };
}

function isRoleFormModel(
  value: object,
): value is RoleFormModel {
  return (
    "name" in value &&
    typeof value.name === "string" &&
    "description" in value &&
    typeof value.description === "string" &&
    "permissions" in value &&
    Array.isArray(value.permissions) &&
    value.permissions.every((permission) => typeof permission === "string")
  );
}

export default defineComponent({
  name: "RoleListPage",
  components: { ListLayout, RoleFormDrawer },
  data() {
    return {
      resource: roleResource,
      catalog: emptyCatalog(),
      catalogLoading: false,
      catalogError: "",
      catalogController: null as AbortController | null,
      catalogRequestId: 0,
    };
  },
  mounted() {
    void this.loadPermissions();
  },
  beforeUnmount() {
    this.catalogController?.abort();
    this.catalogRequestId += 1;
  },
  methods: {
    isRoleFormModel,
    async loadPermissions(): Promise<void> {
      if (this.catalog.items.length) return;

      this.catalogController?.abort();
      this.catalogController = new AbortController();
      const controller = this.catalogController;
      const requestId = ++this.catalogRequestId;
      this.catalogLoading = true;
      this.catalogError = "";

      try {
        const catalog = await roleService.permissions(controller.signal);
        if (requestId !== this.catalogRequestId) return;
        this.catalog = catalog;
      } catch (error) {
        if (requestId !== this.catalogRequestId) return;
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED")
          this.catalogError = normalized.message;
      } finally {
        if (requestId === this.catalogRequestId) this.catalogLoading = false;
      }
    },
  },
});
</script>
