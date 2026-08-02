export interface SourceItem {
  id: string;
  name: string;
  phone: string;
  itemCount: number;
  totalImportValue: number;
  price: number;
  latestImportAt?: string;
}

export interface SourceListParams {
  page: number;
  limit: number;
  query?: string;
  sortBy?: "name" | "itemCount" | "totalImportValue" | "latestImportAt";
  sortDirection?: "asc" | "desc";
}

export interface SourceListResponse {
  items: SourceItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

