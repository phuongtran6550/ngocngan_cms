import type { PermissionCatalog } from "@/views/Administrator/Roles/types";

export type UserRole = "ADMINISTRATOR" | "USER";
export type UserRoleFilter = "" | UserRole;

export interface UserAssignedRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface UserItem {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  roleId: string;
  assignedRole: UserAssignedRole | null;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRow extends UserItem {
  assignedRoleName: string;
  permissionCount: number;
}

export interface UserRoleOption {
  id: string;
  name: string;
}

export interface UserFormModel {
  name: string;
  username: string;
  password: string;
  role: UserRole;
  roleId: string;
}

export interface UserCreateInput {
  name: string;
  username: string;
  password: string;
  role: UserRole;
  roleId: string | null;
}

export interface UserUpdateInput {
  name: string;
  password?: string;
  role: UserRole;
  roleId: string | null;
}

export interface UserListParams {
  page: number;
  limit: number;
  query?: string;
  role?: UserRole;
  sortBy?: "name" | "username" | "role" | "updatedAt" | "createdAt";
  sortDirection?: "asc" | "desc";
}

export interface UserListResponse {
  items: UserItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserItemResponse {
  item: UserItem;
}

export type UserPermissionCatalog = PermissionCatalog;

export function emptyUserForm(): UserFormModel {
  return { name: "", username: "", password: "", role: "USER", roleId: "" };
}

export function userFormFromItem(item: UserItem): UserFormModel {
  return {
    name: item.name,
    username: item.username,
    password: "",
    role: item.role,
    roleId: item.roleId || "",
  };
}

export function userWithDisplayFields(item: UserItem): UserRow {
  return {
    ...item,
    assignedRoleName: item.assignedRole?.name || (item.role === "ADMINISTRATOR" ? "Toàn quyền hệ thống" : "Chưa gán vai trò"),
    permissionCount: item.permissions.length,
  };
}
