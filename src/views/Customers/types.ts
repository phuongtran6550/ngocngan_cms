import type { Order } from "@/views/Orders/types";

export type CustomerMode = "current" | "history";

export interface CustomerAggregate {
  id: string;
  name: string;
  phone: string;
  price: number;
  priceReturn: number;
  orderCount: number;
  completedOrderCount: number;
  returnedOrderCount: number;
  averageOrderValue: number;
  latestOrderAt?: string;
  firstOrderAt?: string;
}

export interface CustomerProductTotal {
  productId: string | null;
  skuId: string | null;
  barcode: string;
  skuCode: string;
  productName: string;
  thumbnail: string;
  category: string;
  quantity: number;
  returnedQuantity: number;
  spend: number;
  returnedValue: number;
  latestPurchaseAt?: string;
}

export interface CustomerCategoryTotal {
  categoryId: string | null;
  category: string;
  quantity: number;
  returnedQuantity: number;
  spend: number;
  returnedValue: number;
}

export interface CustomerDetailResponse {
  customer: Omit<CustomerAggregate, "id">;
  orders: Order[];
  products: CustomerProductTotal[];
  categories: CustomerCategoryTotal[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CustomerListParams {
  page: number;
  limit: number;
  query?: string;
  customerCohort?: "new";
  from?: string;
  to?: string;
  sortBy?: "name" | "phone" | "price" | "priceReturn" | "orderCount" | "latestOrderAt";
  sortDirection?: "asc" | "desc";
}

export interface CustomerReportFilter {
  customerCohort?: "new";
  from?: string;
  to?: string;
}

export interface CustomerListResponse {
  items: CustomerAggregate[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
