export type InventoryStatus = "active" | "inactive";
export type StockLevelFilter = "" | "low";
export type InventoryCreatePricingType = "Đồ cân" | "Đồ món";
export type InventoryPricingType = InventoryCreatePricingType | "Đồ hột" | "";

export interface InventoryOption {
  id: string;
  name: string;
  type: "category" | "material" | "pattern";
}

export interface WarehouseSku {
  id: string;
  barcode: string;
  code: string;
  size: string;
  weight: number;
  price: number;
  laborCost: number;
  platingCost: number;
  importPrice: number | null;
  stock: number;
  printCount?: number;
}

export interface WarehouseSkuFormModel
  extends Omit<WarehouseSku, "id" | "barcode"> {
  clientId: string;
  id?: string;
  codeMode: "auto" | "manual";
  codeSource: string;
}

export interface WarehouseSkuCodeCheckInput {
  code: string;
}

export type WarehouseSkuCodeCheckItem = WarehouseSkuCodeCheckInput;

export interface WarehouseSkuCodeCheckResponse {
  items: WarehouseSkuCodeCheckItem[];
}

export interface WarehouseItem {
  id: string;
  name: string;
  thumbnail: string;
  images: string[];
  categoryId: string;
  category: string;
  materialId: string;
  material: string;
  patternId: string;
  pattern: string;
  pricingType: InventoryPricingType;
  skus: WarehouseSku[];
  price: number;
  stock: number;
  sold: number;
  pending: number;
  status: InventoryStatus;
  createdBy?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface WarehouseFormModel {
  name: string;
  categoryId: string;
  materialId: string;
  patternId: string;
  pricingType: InventoryCreatePricingType | "";
  skus: WarehouseSkuFormModel[];
  thumbnail: File | null;
}

export interface WarehouseListParams {
  page: number;
  limit: number;
  query?: string;
  categoryId?: string;
  materialId?: string;
  patternId?: string;
  pricingType?: InventoryPricingType;
  stockLevel?: Exclude<StockLevelFilter, "">;
  sortBy?: "name" | "code" | "importPrice" | "price" | "stock" | "updatedAt";
  sortDirection?: "asc" | "desc";
}

export interface WarehouseListResponse {
  items: WarehouseItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WarehouseOptionsResponse {
  categories: InventoryOption[];
  materials: InventoryOption[];
  patterns: InventoryOption[];
  silverPrice: number | null;
}

export interface WarehouseLabelPrintResponse {
  queued: boolean;
  printer: string;
  jobId?: string;
  quantity: number;
  transport: "cups" | "agent";
  status: "queued" | "processing" | "completed" | "failed";
}

let skuSequence = 0;

export function warehouseSkuStockTotal(
  skus: Array<Pick<WarehouseSku, "stock">>,
): number {
  return skus.reduce(
    (total, sku) =>
      total + (Number.isFinite(sku.stock) ? Number(sku.stock) : 0),
    0,
  );
}

export function emptyWarehouseSku(
  input: Partial<WarehouseSkuFormModel> = {},
): WarehouseSkuFormModel {
  skuSequence += 1;
  const code = input.code || "";
  const codeMode = input.codeMode || (code ? "manual" : "auto");
  return {
    clientId: input.clientId || `warehouse-sku-${skuSequence}`,
    ...(input.id ? { id: input.id } : {}),
    code,
    codeMode,
    codeSource: input.codeSource || (codeMode === "auto" ? code : ""),
    size: input.size || "",
    weight: Number(input.weight) || 0,
    price: Number(input.price) || 0,
    laborCost: Number(input.laborCost) || 0,
    platingCost: Number(input.platingCost) || 0,
    importPrice:
      input.importPrice === null || input.importPrice === undefined
        ? null
        : Number(input.importPrice) || 0,
    stock:
      input.stock === null || input.stock === undefined
        ? 0
        : Number(input.stock) || 0,
    printCount: Number(input.printCount) || 0,
  };
}

export function emptyWarehouseForm(): WarehouseFormModel {
  return {
    name: "",
    categoryId: "",
    materialId: "",
    patternId: "",
    pricingType: "",
    skus: [emptyWarehouseSku()],
    thumbnail: null,
  };
}

export function warehouseFormFromItem(item: WarehouseItem): WarehouseFormModel {
  const skus = (item.skus || []).map((sku) =>
    emptyWarehouseSku({
      ...sku,
      clientId: sku.id,
      codeMode: "manual",
      codeSource: sku.code,
    }),
  );
  return {
    name: item.name,
    categoryId: item.categoryId,
    materialId: item.materialId,
    patternId: item.patternId,
    pricingType:
      item.pricingType === "Đồ cân" || item.pricingType === "Đồ món"
        ? item.pricingType
        : "",
    skus: skus.length ? skus : [emptyWarehouseSku()],
    thumbnail: null,
  };
}
