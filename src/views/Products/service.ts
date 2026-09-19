import { request } from "@/request";
import type {
  ProductListParams,
  ProductListResponse,
  ProductOption,
  ProductOptionsResponse,
  ProductSku,
  ProductSkuHistoryAction,
  ProductSkuHistoryField,
  ProductSkuHistoryItem,
  ProductSkuHistoryParams,
  ProductSkuHistoryResponse,
  ProductSkuHistoryValue,
} from "@/views/Products/types";

const productEndpoint = "/products";
const stringFields: readonly (keyof ProductSku)[] = [
  "barcode",
  "skuCode",
  "name",
  "thumbnail",
  "categoryId",
  "category",
  "materialId",
  "material",
  "patternId",
  "pattern",
  "pricingType",
  "size",
];
const numberFields: readonly (keyof ProductSku)[] = [
  "weight",
  "price",
  "stock",
  "laborCost",
  "platingCost",
];
const historyActions: readonly ProductSkuHistoryAction[] = [
  "created",
  "updated",
  "deleted",
  "silver_price_updated",
];
const historyFields: readonly ProductSkuHistoryField[] = [
  "code",
  "size",
  "weight",
  "laborCost",
  "platingCost",
  "importPrice",
  "price",
  "stock",
];

function invalidProductResponse(): Error {
  const error = new Error("Máy chủ không trả về dữ liệu SKU hợp lệ");
  Object.assign(error, { code: "INVALID_PRODUCT_RESPONSE" });
  return error;
}

function normalizedProductSku(value: unknown): ProductSku {
  const item = value as Partial<ProductSku> | null | undefined;
  if (
    !item ||
    typeof item !== "object" ||
    typeof item.id !== "string" ||
    !item.id.trim() ||
    typeof item.productId !== "string" ||
    !item.productId.trim() ||
    stringFields.some((field) => typeof item[field] !== "string") ||
    numberFields.some(
      (field) =>
        typeof item[field] !== "number" ||
        !Number.isFinite(item[field] as number),
    ) ||
    !Array.isArray(item.images) ||
    item.images.some((image) => typeof image !== "string") ||
    (item.importPrice !== null &&
      (typeof item.importPrice !== "number" ||
        !Number.isFinite(item.importPrice))) ||
    (item.status !== "active" && item.status !== "inactive") ||
    (item.createdAt !== undefined && typeof item.createdAt !== "string") ||
    (item.updatedAt !== undefined && typeof item.updatedAt !== "string")
  ) {
    throw invalidProductResponse();
  }
  return item as ProductSku;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

interface UnknownPage {
  items?: unknown;
  page?: unknown;
  limit?: unknown;
  total?: unknown;
  totalPages?: unknown;
}

function normalizedPage<T>(
  value: unknown,
  normalizeItem: (item: unknown) => T,
): { items: T[]; page: number; limit: number; total: number; totalPages: number } {
  const data = value as UnknownPage | null | undefined;
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray(data.items) ||
    !Number.isInteger(data.page) ||
    Number(data.page) < 1 ||
    !Number.isInteger(data.limit) ||
    Number(data.limit) < 1 ||
    !isNonNegativeInteger(data.total) ||
    !isNonNegativeInteger(data.totalPages)
  ) {
    throw invalidProductResponse();
  }
  return {
    items: data.items.map(normalizeItem),
    page: data.page as number,
    limit: data.limit as number,
    total: data.total as number,
    totalPages: data.totalPages as number,
  };
}

function normalizedProductList(value: unknown): ProductListResponse {
  return normalizedPage(value, normalizedProductSku);
}

function normalizedHistoryValue(value: unknown): ProductSkuHistoryValue {
  if (value === null || typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw invalidProductResponse();
}

function normalizedHistoryItem(value: unknown): ProductSkuHistoryItem {
  const item = value as Partial<ProductSkuHistoryItem> | null | undefined;
  if (
    !item ||
    typeof item !== "object" ||
    typeof item.id !== "string" ||
    !item.id.trim() ||
    typeof item.skuId !== "string" ||
    !item.skuId.trim() ||
    typeof item.skuCode !== "string" ||
    !historyActions.includes(item.action as ProductSkuHistoryAction) ||
    !Array.isArray(item.changes) ||
    typeof item.changedAt !== "string" ||
    !item.changedAt ||
    (item.silverPriceBefore !== null &&
      (typeof item.silverPriceBefore !== "number" ||
        !Number.isFinite(item.silverPriceBefore))) ||
    (item.silverPriceAfter !== null &&
      (typeof item.silverPriceAfter !== "number" ||
        !Number.isFinite(item.silverPriceAfter))) ||
    (item.actor !== null &&
      (!item.actor ||
        typeof item.actor.id !== "string" ||
        typeof item.actor.name !== "string" ||
        typeof item.actor.username !== "string"))
  ) {
    throw invalidProductResponse();
  }
  return {
    ...item,
    changes: item.changes.map((change) => {
      if (
        !change ||
        typeof change !== "object" ||
        !historyFields.includes(change.field as ProductSkuHistoryField)
      ) {
        throw invalidProductResponse();
      }
      const field = change.field as ProductSkuHistoryField;
      return {
        field,
        before: normalizedHistoryValue(change.before),
        after: normalizedHistoryValue(change.after),
      };
    }),
  } as ProductSkuHistoryItem;
}

function normalizedProductHistory(value: unknown): ProductSkuHistoryResponse {
  return normalizedPage(value, normalizedHistoryItem);
}

function normalizedOptions(
  value: unknown,
  type: ProductOption["type"],
): ProductOption[] {
  if (!Array.isArray(value)) throw invalidProductResponse();
  return value.map((option) => {
    const item = option as Partial<ProductOption> | null | undefined;
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.id !== "string" ||
      !item.id.trim() ||
      typeof item.name !== "string" ||
      item.type !== type
    ) {
      throw invalidProductResponse();
    }
    return item as ProductOption;
  });
}

export const productService = {
  async list(
    params: ProductListParams,
    signal?: AbortSignal,
  ): Promise<ProductListResponse> {
    const { data } = await request.get<ProductListResponse>(productEndpoint, {
      params,
      signal,
    });
    return normalizedProductList(data);
  },

  async detail(skuId: string, signal?: AbortSignal): Promise<ProductSku> {
    const { data } = await request.get<ProductSku>(
      `${productEndpoint}/${encodeURIComponent(skuId)}`,
      { signal },
    );
    return normalizedProductSku(data);
  },

  async history(
    skuId: string,
    params: ProductSkuHistoryParams,
    signal?: AbortSignal,
  ): Promise<ProductSkuHistoryResponse> {
    const { data } = await request.get<ProductSkuHistoryResponse>(
      `${productEndpoint}/${encodeURIComponent(skuId)}/history`,
      { params, signal },
    );
    return normalizedProductHistory(data);
  },

  async byBarcode(
    barcode: string,
    signal?: AbortSignal,
  ): Promise<ProductSku> {
    const { data } = await request.get<ProductSku>(
      `${productEndpoint}/barcode/${encodeURIComponent(barcode)}`,
      { signal },
    );
    return normalizedProductSku(data);
  },

  async options(signal?: AbortSignal): Promise<ProductOptionsResponse> {
    const { data } = await request.get<ProductOptionsResponse>(
      "/warehoused-goods/options",
      { signal },
    );
    return {
      silverPrice: typeof data?.silverPrice === "number" && Number.isFinite(data.silverPrice)
        ? data.silverPrice
        : null,
      categories: normalizedOptions(data?.categories, "category"),
      materials: normalizedOptions(data?.materials, "material"),
      patterns: normalizedOptions(data?.patterns, "pattern"),
    };
  },

  async bulkDelete(
    ids: string[],
    signal?: AbortSignal,
  ): Promise<{ deletedCount: number }> {
    const { data } = await request.post<{
      deletedCount: number;
      message: string;
    }>(
      `${productEndpoint}/bulk-delete`,
      { ids },
      { signal },
    );
    return { deletedCount: Number(data?.deletedCount) || 0 };
  },

  async delete(skuId: string, signal?: AbortSignal): Promise<void> {
    await request.delete(`${productEndpoint}/${encodeURIComponent(skuId)}`, {
      signal,
    });
  },
};
