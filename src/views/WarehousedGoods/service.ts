import { request } from "@/request";
import type {
  WarehouseFormModel,
  WarehouseItem,
  WarehouseLabelPrintResponse,
  WarehouseListParams,
  WarehouseListResponse,
  WarehouseOptionsResponse,
  WarehouseSkuCodeCheckInput,
  WarehouseSkuCodeCheckResponse,
} from "@/views/WarehousedGoods/types";

function multipart(input: WarehouseFormModel): FormData {
  const body = new FormData();
  body.append("name", input.name);
  body.append("categoryId", input.categoryId);
  body.append("materialId", input.materialId);
  body.append("patternId", input.patternId);
  body.append("pricingType", input.pricingType);
  body.append(
    "skus",
    JSON.stringify(
      input.skus.map(
        ({
          id,
          code,
          codeMode,
          size,
          weight,
          price,
          laborCost,
          platingCost,
          importPrice,
          stock,
        }) => ({
          ...(id ? { id } : {}),
          code,
          codeMode,
          size,
          weight,
          price,
          laborCost,
          platingCost,
          importPrice,
          stock,
        }),
      ),
    ),
  );
  if (input.thumbnail instanceof File)
    body.append("thumbnail", input.thumbnail);
  return body;
}

const multipartConfig = { headers: { "Content-Type": "multipart/form-data" } };
const warehouseEndpoint = "/warehoused-goods";

function normalizedWarehouseItem(value: unknown): WarehouseItem {
  const item = value as Partial<WarehouseItem> | null | undefined;
  if (
    !item ||
    typeof item !== "object" ||
    typeof item.id !== "string" ||
    !item.id.trim()
  ) {
    const error = new Error(
      "Máy chủ không trả về dữ liệu hàng nhập kho hợp lệ",
    );
    Object.assign(error, { code: "INVALID_WAREHOUSE_RESPONSE" });
    throw error;
  }
  return item as WarehouseItem;
}

export const warehouseService = {
  async list(
    params: WarehouseListParams,
    signal?: AbortSignal,
  ): Promise<WarehouseListResponse> {
    const { data } = await request.get<WarehouseListResponse>(
      warehouseEndpoint,
      { params, signal },
    );
    return data;
  },
  async options(signal?: AbortSignal): Promise<WarehouseOptionsResponse> {
    const { data } = await request.get<WarehouseOptionsResponse>(
      `${warehouseEndpoint}/options`,
      { signal },
    );
    return data;
  },
  async checkSkuCodes(
    skus: WarehouseSkuCodeCheckInput[],
    signal?: AbortSignal,
  ): Promise<WarehouseSkuCodeCheckResponse> {
    const { data } = await request.post<WarehouseSkuCodeCheckResponse>(
      `${warehouseEndpoint}/sku-codes/check`,
      { skus },
      { signal },
    );
    return data;
  },
  async detail(id: string, signal?: AbortSignal): Promise<WarehouseItem> {
    const { data } = await request.get<WarehouseItem>(
      `${warehouseEndpoint}/${id}`,
      { signal },
    );
    return normalizedWarehouseItem(data);
  },
  async printLabel(
    id: string,
    skuId: string,
    quantity: number,
  ): Promise<WarehouseLabelPrintResponse> {
    const { data } = await request.post<WarehouseLabelPrintResponse>(
      `${warehouseEndpoint}/${id}/skus/${skuId}/print-label`,
      { quantity },
    );
    return data;
  },
  async create(input: WarehouseFormModel): Promise<WarehouseItem> {
    const { data } = await request.post<WarehouseItem>(
      warehouseEndpoint,
      multipart(input),
      multipartConfig,
    );
    return normalizedWarehouseItem(data);
  },
  async update(id: string, input: WarehouseFormModel): Promise<WarehouseItem> {
    const { data } = await request.patch<WarehouseItem>(
      `${warehouseEndpoint}/${id}`,
      multipart(input),
      multipartConfig,
    );
    return normalizedWarehouseItem(data);
  },
  async remove(id: string): Promise<void> {
    await request.delete(`${warehouseEndpoint}/${id}`);
  },
};
