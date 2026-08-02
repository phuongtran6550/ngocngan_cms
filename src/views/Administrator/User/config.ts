import { PERMISSIONS } from "@/config/permissions";
import type {
  FormDefinition,
  FormFieldDefinition,
  ResourceDefinition,
  ResourceRow,
} from "@/config/resource";
import {
  defineResource,
  type ResourceDeclaration,
  type ResourceListInput,
} from "@/components/resource/contracts";
import { apiError } from "@/request";
import { authenStore } from "@/stores/app-authen";
import { userService } from "@/views/Administrator/User/service";
import {
  emptyUserForm,
  userFormFromItem,
  userWithDisplayFields,
  type UserFormModel,
  type UserItem,
  type UserListParams,
  type UserListResponse,
  type UserRoleFilter,
  type UserRoleOption,
} from "@/views/Administrator/User/types";

export const userRoleOptions = [
  { label: "Nhân sự", value: "USER" },
  { label: "Quản trị viên", value: "ADMINISTRATOR" },
];

const baseUserFormFields: FormFieldDefinition[] = [
  { key: "name", label: "Họ tên", type: "text", required: true, placeholder: "Nhập họ tên nhân sự" },
  { key: "username", label: "Tên đăng nhập", type: "text", required: true, placeholder: "Ví dụ: banhang01" },
  { key: "password", label: "Mật khẩu", type: "password", required: true, placeholder: "Tối thiểu 6 ký tự" },
  {
    key: "role",
    label: "Loại tài khoản",
    type: "select",
    required: true,
    options: userRoleOptions,
    helpText: "Quản trị viên có toàn quyền hệ thống.",
  },
  {
    key: "roleId",
    label: "Vai trò được gán",
    type: "select",
    helpText: "Quyền thao tác nghiệp vụ được kế thừa từ vai trò này.",
  },
];

export const userDefinition: ResourceDefinition = {
  key: "users",
  title: "Quản lý nhân sự",
  description: "Tạo tài khoản, gán vai trò và kiểm soát quyền truy cập CMS theo từng nhân sự.",
  breadcrumbs: [
    { text: "Trang chủ", link: "/" },
    { text: "Quản trị hệ thống" },
    { text: "Nhân sự" },
  ],
  endpoint: "/users",
  permission: {
    view: PERMISSIONS.usersManage,
    create: PERMISSIONS.usersManage,
    update: PERMISSIONS.usersManage,
    delete: PERMISSIONS.usersManage,
  },
  columns: [
    { key: "name", label: "Nhân sự", type: "text", sortable: true },
    { key: "username", label: "Tên đăng nhập", type: "text", sortable: true },
    {
      key: "role",
      label: "Loại tài khoản",
      type: "badge",
      sortable: true,
      options: userRoleOptions,
    },
    { key: "assignedRoleName", label: "Vai trò gán", type: "text" },
    { key: "permissionCount", label: "Quyền hiệu lực", type: "number" },
    { key: "updatedAt", label: "Cập nhật", type: "datetime", sortable: true },
  ],
  filters: [
    {
      key: "role",
      label: "Loại tài khoản",
      type: "select",
      options: [{ label: "Tất cả", value: "" }, ...userRoleOptions],
    },
  ],
  form: { fields: baseUserFormFields },
  actions: { create: true, update: true, delete: true, refresh: true, fieldSelector: true },
};

export function createUserFormDefinition({
  editing,
  roleOptions,
  loading,
}: {
  editing: boolean;
  roleOptions: UserRoleOption[];
  loading: boolean;
}): FormDefinition {
  const roleFieldOptions = roleOptions.map((role) => ({ label: role.name, value: role.id }));
  return {
    fields: baseUserFormFields
      .map((field) => {
        if (field.key === "username") {
          return {
            ...field,
            disabled: editing,
            helpText: editing ? "Tên đăng nhập không thể thay đổi sau khi tạo." : undefined,
          };
        }
        if (field.key === "password" && editing) {
          return {
            ...field,
            required: false,
            placeholder: "Để trống nếu không đổi",
            helpText: "Chỉ nhập khi cần đặt mật khẩu mới cho nhân sự.",
          };
        }
        if (field.key === "roleId") {
          return {
            ...field,
            disabled: loading,
            options: roleFieldOptions,
            helpText: loading ? "Đang tải danh sách vai trò..." : field.helpText,
          };
        }
        return { ...field };
      }),
  };
}

interface UserFilters {
  role: UserRoleFilter;
}

function normalizeRoleId(value: string): string | null {
  const trimmed = String(value || "").trim();
  return trimmed.length ? trimmed : null;
}

function userListParams(input: ResourceListInput<UserFilters>): UserListParams {
  return {
    page: input.page,
    limit: input.limit,
    query: input.query || undefined,
    role: input.filters.role || undefined,
    sortBy: input.sortBy as NonNullable<UserListParams["sortBy"]>,
    sortDirection: input.sortDirection,
  };
}

function userErrorMessage(error: unknown): string | undefined {
  const normalized = apiError(error);
  if (normalized.code === "SELF_DELETE_NOT_ALLOWED") {
    return "Không thể xóa tài khoản đang đăng nhập.";
  }
  if (normalized.code === "LAST_ADMINISTRATOR_REQUIRED") {
    return "Hệ thống phải luôn còn ít nhất một quản trị viên.";
  }
  return undefined;
}

export const userResource: ResourceDeclaration<
  UserItem,
  UserFormModel,
  UserFilters
> = defineResource({
  key: "users",
  definition: userDefinition,
  initialFilters: { role: "" },
  selectedColumns: ["name", "username", "role", "assignedRoleName", "permissionCount", "updatedAt"],
  initialSort: { by: "updatedAt", direction: "desc" },
  emptyForm: emptyUserForm,
  formFromRow: userFormFromItem,
  labels: {
    singular: "nhân sự",
    create: "Đã thêm nhân sự",
    update: "Đã cập nhật nhân sự",
    delete: "Đã xóa nhân sự",
  },
  rowForTable: (row) => userWithDisplayFields(row) as unknown as ResourceRow,
  canDelete: (row) => String(row.id) === String(authenStore().user?.id || "")
    ? "Không thể xóa tài khoản đang đăng nhập."
    : undefined,
  errorMessage: (error) => userErrorMessage(error),
  transport: {
    list(input, signal): Promise<UserListResponse> {
      return userService.list(userListParams(input), signal);
    },
    create(input): Promise<UserItem> {
      return userService.create({
        name: input.name,
        username: input.username,
        password: input.password,
        role: input.role,
        roleId: normalizeRoleId(input.roleId),
      });
    },
    update(id, input): Promise<UserItem> {
      return userService.update(id, {
        name: input.name,
        role: input.role,
        roleId: normalizeRoleId(input.roleId),
        ...(input.password ? { password: input.password } : {}),
      });
    },
    remove(id): Promise<void> {
      return userService.remove(id);
    },
  },
});
