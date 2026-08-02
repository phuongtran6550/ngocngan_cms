import { request } from "@/request";
import type { SourceListParams, SourceListResponse } from "@/views/Sources/types";

export const sourceService = {
  async list(params: SourceListParams, signal?: AbortSignal): Promise<SourceListResponse> {
    const { data } = await request.get<SourceListResponse>("/source-of-goods", { params, signal });
    return data;
  },
};
