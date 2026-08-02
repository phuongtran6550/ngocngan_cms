import { request } from "@/request";
import type {
  CustomerListParams,
  CustomerListResponse,
  CustomerMode,
  CustomerDetailResponse,
} from "@/views/Customers/types";

export const customerService = {
  async list(mode: CustomerMode, params: CustomerListParams, signal?: AbortSignal): Promise<CustomerListResponse> {
    const endpoint = mode === "history" ? "/customers/history" : "/customers";
    const { data } = await request.get<CustomerListResponse>(endpoint, { params, signal });
    return data;
  },
  async detail(phone: string, page = 1, limit = 10, signal?: AbortSignal): Promise<CustomerDetailResponse> {
    const { data } = await request.get<CustomerDetailResponse>(`/customers/${encodeURIComponent(phone)}`, {
      params: { page, limit },
      signal,
    });
    return data;
  },
};
