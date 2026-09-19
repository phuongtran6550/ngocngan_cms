import { defineStore } from "pinia";
import { apiError } from "@/request";
import { roleService } from "@/views/Administrator/Roles/service";
import { userService } from "@/views/Administrator/User/service";
import { emptyUserForm, userFormFromItem } from "@/views/Administrator/User/types";
import type {
  UserFormModel,
  UserItem,
  UserListParams,
  UserRoleFilter,
  UserRoleOption,
} from "@/views/Administrator/User/types";

function normalizeRoleId(value: string): string | null {
  const trimmed = String(value || "").trim();
  return trimmed.length ? trimmed : null;
}

export const useUserStore = defineStore("users", {
  state: () => ({
    items: [] as UserItem[],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    query: "",
    role: "" as UserRoleFilter,
    sortBy: "updatedAt" as NonNullable<UserListParams["sortBy"]>,
    sortDirection: "desc" as NonNullable<UserListParams["sortDirection"]>,
    selectedColumns: ["name", "username", "role", "assignedRoleName", "permissionCount", "updatedAt"],
    roleOptions: [] as UserRoleOption[],
    loading: false,
    roleOptionsLoading: false,
    submitting: false,
    error: "",
    message: "",
    drawerOpen: false,
    editing: null as UserItem | null,
    form: emptyUserForm(),
    deleteTarget: null as UserItem | null,
    listController: null as AbortController | null,
    roleController: null as AbortController | null,
    listRequestId: 0,
    roleRequestId: 0,
  }),
  actions: {
    async load(page?: number): Promise<void> {
      page ??= this.pagination.page;
      this.listController?.abort();
      this.listController = new AbortController();
      const requestId = ++this.listRequestId;
      this.loading = true;
      this.error = "";
      try {
        const result = await userService.list({
          page,
          limit: this.pagination.limit,
          query: this.query || undefined,
          role: this.role || undefined,
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
    async loadRoleOptions(): Promise<void> {
      if (this.roleOptions.length) return;
      this.roleController?.abort();
      this.roleController = new AbortController();
      const requestId = ++this.roleRequestId;
      this.roleOptionsLoading = true;
      try {
        const items = await roleService.options(this.roleController.signal);
        if (requestId !== this.roleRequestId) return;
        this.roleOptions = items.map((item) => ({ id: item.id, name: item.name }));
      } catch (error) {
        if (requestId !== this.roleRequestId) return;
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED") this.error = normalized.message;
      } finally {
        if (requestId === this.roleRequestId) this.roleOptionsLoading = false;
      }
    },
    async applySearch(query: string): Promise<void> {
      this.query = query.trim();
      await this.load(1);
    },
    async applyRole(role: UserRoleFilter): Promise<void> {
      this.role = role;
      await this.load(1);
    },
    async applySort(key: string): Promise<void> {
      const sortableFields = ["name", "username", "role", "updatedAt", "createdAt"] as string[];
      if (!sortableFields.includes(key)) return;
      if (this.sortBy === key) this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      else {
        this.sortBy = key as NonNullable<UserListParams["sortBy"]>;
        this.sortDirection = "asc";
      }
      await this.load(1);
    },
    openCreate(): void {
      this.editing = null;
      this.form = emptyUserForm();
      this.drawerOpen = true;
      this.error = "";
    },
    openEdit(item: UserItem): void {
      this.editing = item;
      this.form = userFormFromItem(item);
      this.drawerOpen = true;
      this.error = "";
    },
    closeDrawer(): void {
      this.drawerOpen = false;
      this.editing = null;
    },
    async save(input: UserFormModel): Promise<void> {
      this.submitting = true;
      this.error = "";
      try {
        if (this.editing) {
          const updateInput = {
            name: input.name,
            role: input.role,
            roleId: normalizeRoleId(input.roleId),
            ...(input.password ? { password: input.password } : {}),
          };
          await userService.update(this.editing.id, updateInput);
          this.message = "Đã cập nhật nhân sự";
        } else {
          await userService.create({
            name: input.name,
            username: input.username,
            password: input.password,
            role: input.role,
            roleId: normalizeRoleId(input.roleId),
          });
          this.message = "Đã thêm nhân sự";
        }
        this.closeDrawer();
        await this.load(this.pagination.page);
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.submitting = false;
      }
    },
    requestDelete(item: UserItem): void {
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
        await userService.remove(target.id);
        this.message = "Đã xóa nhân sự";
        const nextPage = this.items.length === 1 && this.pagination.page > 1
          ? this.pagination.page - 1
          : this.pagination.page;
        await this.load(nextPage);
      } catch (error) {
        const normalized = apiError(error);
        if (normalized.code === "SELF_DELETE_NOT_ALLOWED") {
          this.error = "Không thể xóa tài khoản đang đăng nhập.";
        } else if (normalized.code === "LAST_ADMINISTRATOR_REQUIRED") {
          this.error = "Hệ thống phải luôn còn ít nhất một quản trị viên.";
        } else {
          this.error = normalized.message;
        }
      }
    },
  },
});
