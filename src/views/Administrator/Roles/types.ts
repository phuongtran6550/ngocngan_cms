export type SystemRole = "ADMINISTRATOR" | "USER";
export type RoleSystemFilter = "all" | "system" | "custom";

export interface PermissionItem {
  key: string;
  label: string;
  group: string;
}

export interface PermissionGroup {
  name: string;
  permissions: string[];
}

export interface PermissionCatalog {
  items: PermissionItem[];
  groups: PermissionGroup[];
}

export interface RoleItem {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  systemRole: SystemRole;
  isSystem: boolean;
  assignedUserCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleFormModel {
  name: string;
  description: string;
  permissions: string[];
}

export interface RoleListParams {
  page: number;
  limit: number;
  query?: string;
  system?: RoleSystemFilter;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortDirection?: "asc" | "desc";
}

export interface RoleListResponse {
  items: RoleItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RoleItemResponse {
  item: RoleItem;
}
