export type ProductStatus = "active" | "inactive";
export interface BarcodeResolutionFeedback {
  ok: boolean;
  message: string;
}
export type ProductSortField =
  | "name"
  | "skuCode"
  | "price"
  | "stock"
  | "weight"
  | "size"
  | "printCount"
  | "updatedAt";

export interface ProductOption {
  id: string;
  name: string;
  type: "category" | "material" | "pattern";
}

export interface ProductSku {
  id: string;
  productId: string;
  barcode: string;
  skuCode: string;
  name: string;
  thumbnail: string;
  images: string[];
  categoryId: string;
  category: string;
  materialId: string;
  material: string;
  patternId: string;
  pattern: string;
  pricingType: string;
  size: string;
  weight: number;
  price: number;
  stock: number;
  laborCost: number;
  platingCost: number;
  importPrice: number | null;
  status: ProductStatus;
  printCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListParams {
  page: number;
  limit: number;
  query?: string;
  categoryId?: string;
  materialId?: string;
  patternId?: string;
  sortBy?: ProductSortField;
  sortDirection?: "asc" | "desc";
}

export interface ProductListResponse {
  items: ProductSku[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductOptionsResponse {
  categories: ProductOption[];
  materials: ProductOption[];
  patterns: ProductOption[];
}

export type ProductSkuHistoryAction =
  | "created"
  | "updated"
  | "deleted"
  | "silver_price_updated";

export type ProductSkuHistoryField =
  | "code"
  | "size"
  | "weight"
  | "laborCost"
  | "platingCost"
  | "importPrice"
  | "price"
  | "stock";

export type ProductSkuHistoryValue = string | number | null;

export interface ProductSkuHistoryChange {
  field: ProductSkuHistoryField;
  before: ProductSkuHistoryValue;
  after: ProductSkuHistoryValue;
}

export interface ProductSkuHistoryActor {
  id: string;
  name: string;
  username: string;
}

export interface ProductSkuHistoryItem {
  id: string;
  skuId: string;
  skuCode: string;
  action: ProductSkuHistoryAction;
  changes: ProductSkuHistoryChange[];
  silverPriceBefore: number | null;
  silverPriceAfter: number | null;
  actor: ProductSkuHistoryActor | null;
  changedAt: string;
}

export interface ProductSkuHistoryParams {
  page: number;
  limit: number;
}

export interface ProductSkuHistoryResponse extends ProductSkuHistoryParams {
  items: ProductSkuHistoryItem[];
  total: number;
  totalPages: number;
}
