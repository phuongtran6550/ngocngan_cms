import { PERMISSIONS } from "@/config/permissions";
import {
  defineResource,
  type ResourceDeclaration,
  type ResourceListInput,
  type ResourceTransport,
} from "@/components/resource/contracts";
import type { ResourceDefinition } from "@/config/resource";
import { apiError } from "@/request";
import { resourceRequest } from "@/request/resource-client";
import type {
  CatalogResource,
  Category,
  CategoryFormModel,
  CategoryItemResponse,
  CategoryListParams,
  CategoryListResponse,
  CategoryStatus,
  CategoryType,
  ProductCategory,
  ProductCategoryFormModel,
  ProductCategoryItemResponse,
  ProductCategoryListParams,
  ProductCategoryListResponse,
} from "@/views/Categories/types";

type CategoryFilters = Record<string, never>;

export interface CatalogFilters {
  status: CategoryStatus | "";
}

const categoryPermission = {
  view: PERMISSIONS.categoriesView,
  create: PERMISSIONS.categoriesCreate,
  update: PERMISSIONS.categoriesUpdate,
  delete: PERMISSIONS.categoriesDelete,
};

export const catalogResources: Record<CategoryType, CatalogResource> = {
  category: {
    key: "categories",
    type: "category",
    endpoint: "/categories",
    label: "Danh mục",
    objectName: "danh mục",
    description: "Quản lý danh mục sản phẩm.",
  },
  material: {
    key: "materials",
    type: "material",
    endpoint: "/materials",
    label: "Chất liệu",
    objectName: "chất liệu",
    description: "Quản lý chất liệu được gán trực tiếp cho sản phẩm.",
  },
};

function breadcrumbs(resource: CatalogResource) {
  return [
    { text: "Trang chủ", link: "/" },
    { text: "Danh mục", link: resource.endpoint },
    { text: `Quản lý ${resource.objectName}` },
  ];
}

export const categoryDefinition: ResourceDefinition = {
  key: "categories",
  title: "Quản lý danh mục",
  description: catalogResources.category.description,
  breadcrumbs: breadcrumbs(catalogResources.category),
  endpoint: "/categories",
  permission: categoryPermission,
  columns: [
    { key: "name", label: "Tên danh mục", type: "text", sortable: true },
    { key: "productCount", label: "Số sản phẩm", type: "number" },
    {
      key: "createdBy",
      label: "Người tạo",
      type: "profile",
      display: {
        avatar: "createdBy.avatar",
        title: "createdBy.name",
        desc: "createdBy.description",
      },
    },
  ],
  form: {
    fields: [
      {
        key: "name",
        label: "Tên danh mục",
        type: "text",
        required: true,
        placeholder: "Nhập tên danh mục",
      },
      {
        key: "description",
        label: "Mô tả",
        type: "textarea",
        placeholder: "Nhập mô tả danh mục",
        rows: 4,
      },
    ],
  },
  actions: {
    create: true,
    update: true,
    delete: true,
    refresh: true,
    fieldSelector: true,
  },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function listNumber(
  primary: Record<string, unknown>,
  fallback: Record<string, unknown>,
  key: "page" | "limit" | "total" | "totalPages",
): number {
  return Number(primary[key] ?? fallback[key] ?? 0);
}

function normalizeListResponse<Row>(payload: unknown): {
  items: Row[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} {
  const response = asRecord(payload);
  if (!response)
    throw new TypeError("Catalog list response must be an object.");

  if (Array.isArray(response.items)) {
    return response as unknown as {
      items: Row[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }

  const nested = asRecord(response.items);
  const items =
    nested &&
    (Array.isArray(nested.items)
      ? nested.items
      : Array.isArray(nested.data)
        ? nested.data
        : null);
  if (!nested || !items) {
    throw new TypeError(
      "Catalog list response must contain an array of items.",
    );
  }

  return {
    items: items as Row[],
    page: listNumber(nested, response, "page"),
    limit: listNumber(nested, response, "limit"),
    total: listNumber(nested, response, "total"),
    totalPages: listNumber(nested, response, "totalPages"),
  };
}

function categoryListParams(
  input: ResourceListInput<CategoryFilters>,
): CategoryListParams {
  const params: CategoryListParams = {
    page: input.page,
    limit: input.limit,
  };
  if (input.query) params.query = input.query;
  if (input.sortBy === "name") params.sortBy = "name";
  if (input.sortDirection) params.sortDirection = input.sortDirection;
  return params;
}

const categoryTransport: ResourceTransport<
  Category,
  CategoryFormModel,
  CategoryFilters
> = {
  async list(
    input: ResourceListInput<CategoryFilters>,
    signal?: AbortSignal,
  ): Promise<CategoryListResponse> {
    const result = await resourceRequest<CategoryListResponse>({
      method: "get",
      url: "/categories",
      params: categoryListParams(input),
      signal,
    });
    return normalizeListResponse<Category>(result.response);
  },
  async create(input: CategoryFormModel): Promise<Category> {
    const result = await resourceRequest<CategoryItemResponse>({
      method: "post",
      url: "/categories",
      data: { name: input.name, description: input.description },
    });
    return result.response.item;
  },
  async update(id: string, input: CategoryFormModel): Promise<Category> {
    const result = await resourceRequest<CategoryItemResponse>({
      method: "patch",
      url: `/categories/${id}`,
      data: { name: input.name, description: input.description },
    });
    return result.response.item;
  },
  async remove(id: string): Promise<void> {
    await resourceRequest({ method: "delete", url: `/categories/${id}` });
  },
};

export const categoryResource = defineResource<
  Category,
  CategoryFormModel,
  CategoryFilters
>({
  key: "categories",
  definition: categoryDefinition,
  initialFilters: {},
  selectedColumns: ["name", "productCount", "createdBy"],
  initialSort: { by: "name", direction: "asc" },
  emptyForm: () => ({ name: "", description: "" }),
  formFromRow: (row) => ({
    name: row.name,
    description: row.description || "",
  }),
  labels: {
    singular: "danh mục",
    create: "Đã thêm danh mục",
    update: "Đã cập nhật danh mục",
    delete: "Đã xóa danh mục",
  },
  transport: categoryTransport,
  errorMessage: (caught) => {
    const normalized = apiError(caught);
    if (normalized.code !== "CATEGORY_IN_USE") return undefined;
    const count = Number(normalized.errors?.usageCount || 0);
    return inUseMessage(
      catalogResources.category,
      count,
      normalized.errors,
    );
  },
});

function materialDefinitionFor(resource: CatalogResource): ResourceDefinition {
  return {
    key: resource.key,
    title: `Quản lý ${resource.objectName}`,
    description: resource.description,
    breadcrumbs: breadcrumbs(resource),
    endpoint: resource.endpoint,
    permission: categoryPermission,
    columns: [
      {
        key: "name",
        label: `Tên ${resource.objectName}`,
        type: "text",
        sortable: true,
      },
      { key: "usageCount", label: "Đang sử dụng", type: "number" },
      { key: "status", label: "Trạng thái", type: "status" },
      { key: "updatedAt", label: "Cập nhật", type: "datetime", sortable: true },
    ],
    filters: [
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        options: [
          { label: "Tất cả", value: "" },
          { label: "Đang hoạt động", value: "active" },
          { label: "Ngừng hoạt động", value: "inactive" },
        ],
      },
    ],
    form: {
      fields: [
        {
          key: "name",
          label: `Tên ${resource.objectName}`,
          type: "text",
          required: true,
          placeholder: `Nhập tên ${resource.objectName}`,
        },
        {
          key: "status",
          label: "Trạng thái",
          type: "select",
          required: true,
          options: [
            { label: "Đang hoạt động", value: "active" },
            { label: "Ngừng hoạt động", value: "inactive" },
          ],
        },
        {
          key: "sortOrder",
          label: "Thứ tự",
          type: "number",
          min: 0,
          max: 100000,
          step: 1,
        },
      ],
    },
    actions: {
      create: true,
      update: true,
      delete: true,
      refresh: true,
      fieldSelector: true,
    },
  };
}

function materialListParams(
  input: ResourceListInput<CatalogFilters>,
): ProductCategoryListParams {
  const params: ProductCategoryListParams = {
    page: input.page,
    limit: input.limit,
    sortBy: input.sortBy as ProductCategoryListParams["sortBy"],
    sortDirection: input.sortDirection,
  };
  if (input.query) params.query = input.query;
  if (input.filters.status) params.status = input.filters.status;
  return params;
}

function createMaterialTransport(
  resource: CatalogResource,
): ResourceTransport<
  ProductCategory,
  ProductCategoryFormModel,
  CatalogFilters
> {
  return {
    async list(
      input: ResourceListInput<CatalogFilters>,
      signal?: AbortSignal,
    ): Promise<ProductCategoryListResponse> {
      const result = await resourceRequest<ProductCategoryListResponse>({
        method: "get",
        url: resource.endpoint,
        params: materialListParams(input),
        signal,
      });
      return normalizeListResponse<ProductCategory>(result.response);
    },
    async create(input: ProductCategoryFormModel): Promise<ProductCategory> {
      const result = await resourceRequest<ProductCategoryItemResponse>({
        method: "post",
        url: resource.endpoint,
        data: input,
      });
      return result.response.item;
    },
    async update(
      id: string,
      input: ProductCategoryFormModel,
    ): Promise<ProductCategory> {
      const result = await resourceRequest<ProductCategoryItemResponse>({
        method: "patch",
        url: `${resource.endpoint}/${id}`,
        data: {
          name: input.name,
          status: input.status,
          sortOrder: input.sortOrder,
        },
      });
      return result.response.item;
    },
    async remove(id: string): Promise<void> {
      await resourceRequest({
        method: "delete",
        url: `${resource.endpoint}/${id}`,
      });
    },
  };
}

function inUseMessage(
  resource: CatalogResource,
  count: number,
  errors?: Record<string, unknown>,
): string {
  const inventory = Number(errors?.inventoryUsageCount || 0);
  const orders = Number(errors?.orderUsageCount || 0);
  if (inventory > 0 && orders > 0) {
    return `${resource.label} đang được sử dụng bởi ${inventory} sản phẩm và ${orders} đơn hàng nên không thể xóa.`;
  }
  if (orders > 0) {
    return `${resource.label} đang được sử dụng bởi ${orders} đơn hàng nên không thể xóa.`;
  }
  return `${resource.label} đang được sử dụng bởi ${count} sản phẩm nên không thể xóa.`;
}

function materialErrorMessage(
  resource: CatalogResource,
  caught: unknown,
  row?: ProductCategory,
): string | undefined {
  const normalized = apiError(caught);
  if (normalized.code !== "CATEGORY_IN_USE") return undefined;
  const count = Number(normalized.errors?.usageCount || row?.usageCount || 0);
  return inUseMessage(resource, count, normalized.errors);
}

function createMaterialResource(
  resource: CatalogResource,
): ResourceDeclaration<
  ProductCategory,
  ProductCategoryFormModel,
  CatalogFilters
> {
  return defineResource({
    key: resource.key,
    definition: materialDefinitionFor(resource),
    initialFilters: { status: "" },
    selectedColumns: ["name", "usageCount", "status", "updatedAt"],
    initialSort: { by: "sortOrder", direction: "asc" },
    emptyForm: () => ({ name: "", status: "active", sortOrder: 0 }),
    formFromRow: (row) => ({
      name: row.name,
      status: row.status,
      sortOrder: row.sortOrder,
    }),
    labels: {
      singular: resource.objectName,
      create: `Đã thêm ${resource.objectName}`,
      update: `Đã cập nhật ${resource.objectName}`,
      delete: `Đã xóa ${resource.objectName}`,
    },
    transport: createMaterialTransport(resource),
    canDelete: (row) =>
      Number(row.usageCount || 0) > 0
        ? inUseMessage(resource, Number(row.usageCount))
        : undefined,
    errorMessage: (caught, row) => materialErrorMessage(resource, caught, row),
  });
}

export const materialResource = createMaterialResource(
  catalogResources.material,
);
export const materialDefinition = materialResource.definition;
