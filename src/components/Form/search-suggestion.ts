import { request, assetUrl } from "@/request";

export interface SearchSuggestionItem {
  id: string;
  title: string;
  code: string;
  barcode?: string;
  category?: string;
  material?: string;
  pattern?: string;
  price?: number;
  stock?: number;
  size?: string;
  weight?: number;
  thumbnail?: string;
  url: string;
  subtitle?: string;
  badge?: string;
  pricingType?: string;
}

export type SearchSuggestMode = "products" | "warehoused-goods";

/**
 * Trích xuất và định dạng phụ đề gợi ý (subtitle) cho sản phẩm / SKU
 */
export function formatSuggestionSubtitle(item: {
  category?: string;
  material?: string;
  pattern?: string;
  size?: string;
  weight?: number;
}): string {
  const parts: string[] = [];
  if (item.category) parts.push(item.category);
  if (item.material) parts.push(item.material);
  if (item.pattern) parts.push(item.pattern);
  if (item.size) {
    const raw = item.size.trim();
    parts.push(/^ni\b/i.test(raw) ? raw : `Ni ${raw}`);
  }
  if (typeof item.weight === "number" && item.weight > 0) {
    parts.push(`${item.weight} chỉ`);
  }
  return parts.join(" · ");
}

/**
 * Tìm kiếm gợi ý SKU sản phẩm từ cơ sở dữ liệu
 */
export async function fetchProductSuggestions(
  query: string,
  signal?: AbortSignal,
  limit = 6,
): Promise<SearchSuggestionItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data } = await request.get<{
    data?: Array<Record<string, unknown>>;
    items?: Array<Record<string, unknown>>;
  }>("/products", {
    params: {
      query: trimmed,
      limit,
      page: 1,
    },
    signal,
  });

  const rawList = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? (data as Array<Record<string, unknown>>)
        : [];

  return rawList.map((item) => {
    const id = String(item.id || item._id || "");
    const title = String(item.name || "Sản phẩm");
    const code = String(item.skuCode || item.code || "");
    const barcode = item.barcode ? String(item.barcode) : undefined;
    const category = item.category ? String(item.category) : undefined;
    const material = item.material ? String(item.material) : undefined;
    const pattern = item.pattern ? String(item.pattern) : undefined;
    const size = item.size ? String(item.size) : undefined;
    const weight = typeof item.weight === "number" ? item.weight : undefined;
    const price = typeof item.price === "number" ? item.price : undefined;
    const stock = typeof item.stock === "number" ? item.stock : undefined;
    const rawThumbnail = item.thumbnail ? String(item.thumbnail) : "";
    const thumbnail = rawThumbnail ? assetUrl(rawThumbnail) : "";
    const pricingType = item.pricingType ? String(item.pricingType) : undefined;

    return {
      id,
      title,
      code,
      barcode,
      category,
      material,
      pattern,
      size,
      weight,
      price,
      stock,
      thumbnail,
      pricingType,
      url: `/products/${id}`,
      subtitle: formatSuggestionSubtitle({ category, material, pattern, size, weight }),
      badge: code || barcode || "",
    };
  });
}

/**
 * Tìm kiếm gợi ý Hàng nhập kho từ cơ sở dữ liệu
 */
export async function fetchWarehouseSuggestions(
  query: string,
  signal?: AbortSignal,
  limit = 6,
): Promise<SearchSuggestionItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data } = await request.get<{
    data?: Array<Record<string, unknown>>;
    items?: Array<Record<string, unknown>>;
  }>("/warehoused-goods", {
    params: {
      query: trimmed,
      limit,
      page: 1,
    },
    signal,
  });

  const rawList = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? (data as Array<Record<string, unknown>>)
        : [];

  return rawList.map((item) => {
    const id = String(item.id || item._id || "");
    const title = String(item.name || "Hàng nhập kho");
    const skus = Array.isArray(item.skus) ? item.skus : [];
    const primarySku = skus[0] || {};
    const code = String(item.code || primarySku.code || "");
    const barcode = primarySku.barcode ? String(primarySku.barcode) : undefined;
    const category = item.category ? String(item.category) : undefined;
    const material = item.material ? String(item.material) : undefined;
    const pattern = item.pattern ? String(item.pattern) : undefined;
    const pricingType = item.pricingType ? String(item.pricingType) : undefined;
    const rawThumbnail = item.thumbnail ? String(item.thumbnail) : "";
    const thumbnail = rawThumbnail ? assetUrl(rawThumbnail) : "";

    const price = typeof primarySku.price === "number"
      ? primarySku.price
      : typeof item.price === "number"
        ? item.price
        : undefined;

    const stock = typeof item.stock === "number"
      ? item.stock
      : skus.reduce((sum: number, s: Record<string, unknown>) => sum + (Number(s?.stock) || 0), 0);

    return {
      id,
      title,
      code,
      barcode,
      category,
      material,
      pattern,
      price,
      stock,
      thumbnail,
      pricingType,
      url: `/warehoused-goods/${id}`,
      subtitle: formatSuggestionSubtitle({ category, material, pattern }),
      badge: code || `${skus.length} SKU`,
    };
  });
}

/**
 * Điều phối tìm nạp gợi ý theo mode
 */
export async function fetchSearchSuggestions(
  mode: SearchSuggestMode,
  query: string,
  signal?: AbortSignal,
  limit = 6,
): Promise<SearchSuggestionItem[]> {
  if (mode === "products") {
    return fetchProductSuggestions(query, signal, limit);
  }
  return fetchWarehouseSuggestions(query, signal, limit);
}
