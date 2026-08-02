import { request } from "@/request";
import type {
  UserCreateInput,
  UserItem,
  UserItemResponse,
  UserListParams,
  UserListResponse,
  UserPermissionCatalog,
  UserUpdateInput,
} from "@/views/Administrator/User/types";

export const userService = {
  async list(params: UserListParams, signal?: AbortSignal): Promise<UserListResponse> {
    const { data } = await request.get<UserListResponse>("/users", { params, signal });
    return data;
  },
  async permissions(signal?: AbortSignal): Promise<UserPermissionCatalog> {
    const { data } = await request.get<UserPermissionCatalog>("/users/permissions", { signal });
    return data;
  },
  async create(input: UserCreateInput): Promise<UserItem> {
    const { data } = await request.post<UserItemResponse>("/users", input);
    return data.item;
  },
  async update(id: string, input: UserUpdateInput): Promise<UserItem> {
    const { data } = await request.patch<UserItemResponse>(`/users/${id}`, input);
    return data.item;
  },
  async remove(id: string): Promise<void> {
    await request.delete(`/users/${id}`);
  },
};
