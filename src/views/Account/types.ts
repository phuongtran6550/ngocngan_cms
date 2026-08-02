export type UserRole = "ADMINISTRATOR" | "USER";

/**
 * Backend-driven navigation follows the YTPlus menu shape while accepting
 * Ngoc Chau's route names and paths.
 */
export interface AuthMenuItem {
  id?: string | number;
  key?: string;
  name?: string;
  title?: string;
  label?: string;
  lable?: string;
  link?: string;
  route?: string;
  path?: string;
  url?: string;
  icon?: string;
  isHeader?: boolean;
  isHeadr?: boolean;
  children?: AuthMenuItem[];
}

export interface AuthTokenMetadata {
  access_token?: string;
  refresh_token?: string;
  expires_time?: string;
  expires_in?: number;
}

export interface AssignedRole {
  id?: string;
  name?: string;
  description?: string;
  permissions?: string[];
  menu?: AuthMenuItem[];
}

export interface AuthUser {
  id?: string;
  name?: string;
  username?: string;
  role?: UserRole;
  roleId?: string;
  assignedRole?: AssignedRole | null;
  permissions?: string[];
  avatar?: string;
  menu?: AuthMenuItem[];
  authen?: AuthTokenMetadata;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  access_token?: string;
  authen?: AuthTokenMetadata;
  user?: AuthUser;
  menu?: AuthMenuItem[];
  detail?: LoginResponse;
  data?: LoginResponse;
}

export interface AuthMeResponse {
  user?: AuthUser;
  menu?: AuthMenuItem[];
  detail?: AuthMeResponse;
  data?: AuthMeResponse;
}
