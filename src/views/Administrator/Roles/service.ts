import { request } from "@/request";
import type {
  PermissionCatalog,
  RoleFormModel,
  RoleItem,
  RoleItemResponse,
  RoleListParams,
  RoleListResponse,
} from "@/views/Administrator/Roles/types";

export const roleService = {
  async list(params: RoleListParams, signal?: AbortSignal): Promise<RoleListResponse> {
    const { data } = await request.get<RoleListResponse>("/roles", { params, signal });
    return data;
  },
  async permissions(signal?: AbortSignal): Promise<PermissionCatalog> {
    const { data } = await request.get<PermissionCatalog>("/roles/permissions", { signal });
    return data;
  },
  async options(signal?: AbortSignal): Promise<RoleItem[]> {
    const { data } = await request.get<RoleItem[]>("/roles/options", { signal });
    return data;
  },
  async create(input: RoleFormModel): Promise<RoleItem> {
    const { data } = await request.post<RoleItemResponse>("/roles", input);
    return data.item;
  },
  async update(id: string, input: RoleFormModel): Promise<RoleItem> {
    const { data } = await request.patch<RoleItemResponse>(`/roles/${id}`, input);
    return data.item;
  },
  async remove(id: string): Promise<void> {
    await request.delete(`/roles/${id}`);
  },
};
