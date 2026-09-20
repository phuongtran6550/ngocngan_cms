export type CategoryType = "category" | "material";
export type CategoryStatus = "active" | "inactive";

export interface CatalogResource {
  key: "categories" | "materials";
  type: CategoryType;
  endpoint: "/categories" | "/materials";
  label: string;
  objectName: string;
  description: string;
}

export interface CategoryCreator {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
}

export interface CategoryGroup {
  id?: string;
  _id?: string;
  name: string;
  fromPrice: number;
  toPrice: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  groups?: CategoryGroup[];
  groupCount?: number;
  groupSummary?: string | number;
  createdBy: CategoryCreator;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryFormModel {
  name: string;
  description: string;
  groups?: CategoryGroup[];
}

export interface CategoryListParams {
  page: number;
  limit: number;
  query?: string;
  sortBy?: "name";
  sortDirection?: "asc" | "desc";
}

export interface CategoryListResponse {
  items: Category[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CategoryItemResponse { item: Category }

export interface ProductCategory {
  id: string;
  name: string;
  type: CategoryType;
  status: CategoryStatus;
  sortOrder: number;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategoryFormModel {
  name: string;
  status: CategoryStatus;
  sortOrder: number;
}

export interface ProductCategoryListParams {
  page: number;
  limit: number;
  query?: string;
  status?: CategoryStatus | "";
  sortBy?: "name" | "sortOrder" | "updatedAt";
  sortDirection?: "asc" | "desc";
}

export interface ProductCategoryListResponse {
  items: ProductCategory[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductCategoryItemResponse { item: ProductCategory }

export interface CategorySummaryData {
  activeCategories: number;
  activeMaterials: number;
  totalUsage: number;
}
