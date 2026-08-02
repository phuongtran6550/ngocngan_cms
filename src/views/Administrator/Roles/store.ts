import { defineStore } from "pinia";
import { apiError } from "@/request";
import { roleService } from "@/views/Administrator/Roles/service";
import type {
  PermissionCatalog,
  RoleFormModel,
  RoleItem,
  RoleSystemFilter,
} from "@/views/Administrator/Roles/types";

const emptyForm = (): RoleFormModel => ({ name: "", description: "", permissions: [] });
const emptyCatalog = (): PermissionCatalog => ({ items: [], groups: [] });

export const useRoleStore = defineStore("roles", {
  state: () => ({
    items: [] as RoleItem[],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    query: "",
    system: "all" as RoleSystemFilter,
    sortBy: "name" as "name" | "createdAt" | "updatedAt",
    sortDirection: "asc" as "asc" | "desc",
    selectedColumns: ["name", "roleKind", "permissionCount", "assignedUserCount", "updatedAt"],
    catalog: emptyCatalog(),
    loading: false,
    catalogLoading: false,
    submitting: false,
    error: "",
    message: "",
    drawerOpen: false,
    editing: null as RoleItem | null,
    form: emptyForm(),
    deleteTarget: null as RoleItem | null,
    listController: null as AbortController | null,
    catalogController: null as AbortController | null,
    listRequestId: 0,
    catalogRequestId: 0,
  }),
  actions: {
    async load(page = this.pagination.page): Promise<void> {
      this.listController?.abort();
      this.listController = new AbortController();
      const requestId = ++this.listRequestId;
      this.loading = true;
      this.error = "";
      try {
        const result = await roleService.list({
          page,
          limit: this.pagination.limit,
          query: this.query || undefined,
          system: this.system,
          sortBy: this.sortBy,
          sortDirection: this.sortDirection,
        }, this.listController.signal);
        if (requestId !== this.listRequestId) return;
        this.items = result.items;
        this.pagination = {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        };
      } catch (error) {
        if (requestId !== this.listRequestId) return;
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED") this.error = normalized.message;
      } finally {
        if (requestId === this.listRequestId) this.loading = false;
      }
    },
    async loadPermissions(): Promise<void> {
      if (this.catalog.items.length) return;
      this.catalogController?.abort();
      this.catalogController = new AbortController();
      const requestId = ++this.catalogRequestId;
      this.catalogLoading = true;
      try {
        const result = await roleService.permissions(this.catalogController.signal);
        if (requestId === this.catalogRequestId) this.catalog = result;
      } catch (error) {
        if (requestId !== this.catalogRequestId) return;
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED") this.error = normalized.message;
      } finally {
        if (requestId === this.catalogRequestId) this.catalogLoading = false;
      }
    },
    async applySearch(value: string): Promise<void> {
      this.query = value.trim();
      await this.load(1);
    },
    async applySystem(value: RoleSystemFilter): Promise<void> {
      this.system = value;
      await this.load(1);
    },
    async applySort(key: string): Promise<void> {
      if (!(this.sortBy === key) && !["name", "createdAt", "updatedAt"].includes(key)) return;
      if (this.sortBy === key) this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      else {
        this.sortBy = key as "name" | "createdAt" | "updatedAt";
        this.sortDirection = "asc";
      }
      await this.load(1);
    },
    openCreate(): void {
      this.editing = null;
      this.form = emptyForm();
      this.drawerOpen = true;
      this.error = "";
    },
    openEdit(item: RoleItem): void {
      if (item.isSystem) {
        this.error = "Không thể chỉnh sửa vai trò hệ thống.";
        return;
      }
      this.editing = item;
      this.form = {
        name: item.name,
        description: item.description,
        permissions: [...item.permissions],
      };
      this.drawerOpen = true;
      this.error = "";
    },
    closeDrawer(): void {
      this.drawerOpen = false;
      this.editing = null;
    },
    async save(input: RoleFormModel): Promise<void> {
      this.submitting = true;
      this.error = "";
      try {
        if (this.editing) {
          await roleService.update(this.editing.id, input);
          this.message = "Đã cập nhật vai trò";
        } else {
          await roleService.create(input);
          this.message = "Đã thêm vai trò";
        }
        this.closeDrawer();
        await this.load(this.pagination.page);
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.submitting = false;
      }
    },
    requestDelete(item: RoleItem): void {
      if (item.isSystem) {
        this.error = "Không thể xóa vai trò hệ thống.";
        return;
      }
      if (Number(item.assignedUserCount || 0) > 0) {
        this.deleteTarget = null;
        this.error = `Vai trò đang được gán cho ${item.assignedUserCount} nhân sự nên không thể xóa.`;
        return;
      }
      this.error = "";
      this.deleteTarget = item;
    },
    cancelDelete(): void {
      this.deleteTarget = null;
    },
    async confirmDelete(): Promise<void> {
      const target = this.deleteTarget;
      if (!target) return;
      this.deleteTarget = null;
      this.error = "";
      try {
        await roleService.remove(target.id);
        this.message = "Đã xóa vai trò";
        const nextPage = this.items.length === 1 && this.pagination.page > 1
          ? this.pagination.page - 1
          : this.pagination.page;
        await this.load(nextPage);
      } catch (error) {
        const normalized = apiError(error);
        if (normalized.code === "ROLE_IN_USE") {
          const count = Number(normalized.errors?.assignedUserCount || target.assignedUserCount || 0);
          this.error = `Vai trò đang được gán cho ${count} nhân sự nên không thể xóa.`;
        } else if (normalized.code === "SYSTEM_ROLE_IMMUTABLE") {
          this.error = "Không thể xóa vai trò hệ thống.";
        } else {
          this.error = normalized.message;
        }
      }
    },
  },
});
