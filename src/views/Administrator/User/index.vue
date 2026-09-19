<template>
  <div v-if="roleOptionsError" class="alert alert-subtle-danger" role="alert">
    {{ roleOptionsError }}
  </div>

  <ListLayout
    :resource="resource"
    @create="loadRoleOptions"
    @edit="loadRoleOptions"
    @refresh="loadRoleOptions"
  >
    <template #filters="{ filters, setFilter }">
      <div class="d-flex align-items-center gap-2">
        <label class="text-body-tertiary fs-10" for="user-role-filter"
          >Loại tài khoản</label
        >
        <select
          id="user-role-filter"
          class="form-select form-select-sm w-auto"
          :value="filters.role"
          @change="
            setFilter('role', ($event.target as HTMLSelectElement).value)
          "
        >
          <option value="">Tất cả</option>
          <option value="USER">Nhân sự</option>
          <option value="ADMINISTRATOR">Quản trị viên</option>
        </select>
      </div>
    </template>

    <template #drawer="drawer">
      <UserFormDrawer
        v-if="isUserFormModel(drawer.form)"
        :open="drawer.open"
        :editing="drawer.editing"
        :model-value="drawer.form"
        :role-options="roleOptions"
        :role-options-loading="roleOptionsLoading"
        :submitting="drawer.submitting"
        :error="drawer.error || roleOptionsError"
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
import UserFormDrawer from "@/views/Administrator/User/components/UserFormDrawer.vue";
import { userResource } from "@/views/Administrator/User/config";
import { roleService } from "@/views/Administrator/Roles/service";
import { apiError } from "@/request";
import type {
  UserFormModel,
  UserRoleOption,
} from "@/views/Administrator/User/types";

function isUserFormModel(
  value: object,
): value is UserFormModel {
  return (
    "name" in value &&
    typeof value.name === "string" &&
    "username" in value &&
    typeof value.username === "string" &&
    "password" in value &&
    typeof value.password === "string" &&
    "role" in value &&
    (value.role === "ADMINISTRATOR" || value.role === "USER") &&
    "roleId" in value &&
    typeof value.roleId === "string"
  );
}

export default defineComponent({
  name: "UserListPage",
  components: { ListLayout, UserFormDrawer },
  data() {
    return {
      resource: userResource,
      roleOptions: [] as UserRoleOption[],
      roleOptionsLoading: false,
      roleOptionsError: "",
      roleController: null as AbortController | null,
      roleRequestId: 0,
    };
  },
  mounted() {
    void this.loadRoleOptions();
  },
  beforeUnmount() {
    this.roleController?.abort();
    this.roleRequestId += 1;
  },
  methods: {
    isUserFormModel,
    async loadRoleOptions(): Promise<void> {
      if (this.roleOptions.length) return;

      this.roleController?.abort();
      this.roleController = new AbortController();
      const controller = this.roleController;
      const requestId = ++this.roleRequestId;
      this.roleOptionsLoading = true;
      this.roleOptionsError = "";

      try {
        const items = await roleService.options(controller.signal);
        if (requestId !== this.roleRequestId) return;
        this.roleOptions = items.map((item) => ({
          id: item.id,
          name: item.name,
        }));
      } catch (error) {
        if (requestId !== this.roleRequestId) return;
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED")
          this.roleOptionsError = normalized.message;
      } finally {
        if (requestId === this.roleRequestId) this.roleOptionsLoading = false;
      }
    },
  },
});
</script>
