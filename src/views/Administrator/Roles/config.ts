import { PERMISSIONS } from "@/config/permissions";
import type { ResourceDefinition, ResourceRow } from "@/config/resource";
import {
  defineResource,
  type ResourceDeclaration,
  type ResourceListInput,
} from "@/components/resource/contracts";
import { apiError } from "@/request";
import { roleService } from "@/views/Administrator/Roles/service";
import type {
  RoleFormModel,
  RoleItem,
  RoleListParams,
  RoleListResponse,
  RoleSystemFilter,
} from "@/views/Administrator/Roles/types";

export const roleDefinition: ResourceDefinition = {
  key: "roles",
  title: "Quản lý vai trò",
  description: "Tổ chức quyền truy cập theo nhóm nghiệp vụ và kiểm soát vai trò hệ thống.",
  breadcrumbs: [
    { text: "Trang chủ", link: "/" },
    { text: "Quản trị hệ thống" },
    { text: "Vai trò" },
  ],
  endpoint: "/roles",
  permission: {
    view: PERMISSIONS.rolesManage,
    create: PERMISSIONS.rolesManage,
    update: PERMISSIONS.rolesManage,
    delete: PERMISSIONS.rolesManage,
  },
  columns: [
    { key: "name", label: "Vai trò", type: "text", sortable: true },
    {
      key: "roleKind",
      label: "Phân loại",
      type: "badge",
      options: [
        { label: "Hệ thống", value: "system" },
        { label: "Tùy chỉnh", value: "custom" },
      ],
    },
    { key: "permissionCount", label: "Quyền", type: "number" },
    { key: "assignedUserCount", label: "Nhân sự", type: "number" },
    { key: "updatedAt", label: "Cập nhật", type: "datetime", sortable: true },
  ],
  filters: [
    {
      key: "system",
      label: "Phân loại",
      type: "select",
      options: [
        { label: "Tất cả", value: "all" },
        { label: "Hệ thống", value: "system" },
        { label: "Tùy chỉnh", value: "custom" },
      ],
    },
  ],
  form: {
    fields: [
      { key: "name", label: "Tên vai trò", type: "text", required: true, placeholder: "Ví dụ: Nhân viên bán hàng" },
      { key: "description", label: "Mô tả", type: "textarea", placeholder: "Phạm vi công việc của vai trò" },
    ],
  },
  actions: { create: true, update: true, delete: true, refresh: true, fieldSelector: true },
};

interface RoleFilters {
  system: RoleSystemFilter;
}

function emptyRoleForm(): RoleFormModel {
  return { name: "", description: "", permissions: [] };
}

function roleFormFromItem(item: RoleItem): RoleFormModel {
  return {
    name: item.name,
    description: item.description,
    permissions: [...item.permissions],
  };
}

function roleListParams(input: ResourceListInput<RoleFilters>): RoleListParams {
  return {
    page: input.page,
    limit: input.limit,
    query: input.query || undefined,
    system: input.filters.system,
    sortBy: input.sortBy as NonNullable<RoleListParams["sortBy"]>,
    sortDirection: input.sortDirection,
  };
}

function roleTableRow(item: RoleItem): ResourceRow {
  return {
    ...item,
    roleKind: item.isSystem ? "system" : "custom",
    permissionCount: item.permissions.length,
  };
}

function roleDeleteMessage(row: RoleItem): string | undefined {
  if (row.isSystem) return "Không thể xóa vai trò hệ thống.";
  if (Number(row.assignedUserCount || 0) > 0) {
    return `Vai trò đang được gán cho ${row.assignedUserCount} nhân sự nên không thể xóa.`;
  }
  return undefined;
}

function roleErrorMessage(error: unknown, row?: RoleItem): string | undefined {
  const normalized = apiError(error);
  if (normalized.code === "SYSTEM_ROLE_IMMUTABLE") {
    return "Không thể xóa vai trò hệ thống.";
  }
  if (normalized.code === "ROLE_IN_USE") {
    const count = Number(normalized.errors?.assignedUserCount || row?.assignedUserCount || 0);
    return `Vai trò đang được gán cho ${count} nhân sự nên không thể xóa.`;
  }
  return undefined;
}

export const roleResource: ResourceDeclaration<
  RoleItem,
  RoleFormModel,
  RoleFilters
> = defineResource({
  key: "roles",
  definition: roleDefinition,
  initialFilters: { system: "all" },
  selectedColumns: ["name", "roleKind", "permissionCount", "assignedUserCount", "updatedAt"],
  initialSort: { by: "name", direction: "asc" },
  emptyForm: emptyRoleForm,
  formFromRow: roleFormFromItem,
  labels: {
    singular: "vai trò",
    create: "Đã thêm vai trò",
    update: "Đã cập nhật vai trò",
    delete: "Đã xóa vai trò",
  },
  rowForTable: roleTableRow,
  canUpdate: (row) => !row.isSystem,
  canDelete: roleDeleteMessage,
  errorMessage: roleErrorMessage,
  transport: {
    list(input, signal): Promise<RoleListResponse> {
      return roleService.list(roleListParams(input), signal);
    },
    create(input): Promise<RoleItem> {
      return roleService.create(input);
    },
    update(id, input): Promise<RoleItem> {
      return roleService.update(id, input);
    },
    remove(id): Promise<void> {
      return roleService.remove(id);
    },
  },
});
