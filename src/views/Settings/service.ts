import { request } from "@/request";
import type { SilverPriceApplyResult, SilverPriceStatus } from "@/views/Settings/types";

export const silverPriceService = {
  async status(signal?: AbortSignal): Promise<SilverPriceStatus> {
    const { data } = await request.get<SilverPriceStatus>("/settings/silver-price", { signal });
    return data;
  },
  async apply(silverPrice: number): Promise<SilverPriceApplyResult> {
    const { data } = await request.put<SilverPriceApplyResult>("/settings/silver-price", { silverPrice });
    return data;
  },
};
