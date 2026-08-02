import { PERMISSIONS } from "@/config/permissions";
import {
  defineResource,
  type ResourceListInput,
} from "@/components/resource/contracts";
import { createJsonCrudTransport } from "@/components/resource/json-crud-transport";
import type { ResourceDefinition } from "@/config/resource";
import type { PatternFormModel, PatternItem } from "@/views/Patterns/types";

export const patternDefinition: ResourceDefinition = {
  key: "patterns",
  title: "Quản lý mẫu",
  description: "Quản lý danh sách mẫu.",
  breadcrumbs: [
    { text: "Trang chủ", link: "/" },
    { text: "Danh mục" },
    { text: "Mẫu" },
  ],
  endpoint: "/patterns",
  permission: {
    view: PERMISSIONS.categoriesView,
    create: PERMISSIONS.categoriesCreate,
    update: PERMISSIONS.categoriesUpdate,
    delete: PERMISSIONS.categoriesDelete,
  },
  columns: [
    { key: "name", label: "Tên danh mục", type: "text", sortable: true },
    { key: "skuCount", label: "Số SKU", type: "number" },
    {
      key: "createdBy",
      label: "Người tạo",
      type: "profile",
      display: { avatar: "createdBy.avatar", title: "createdBy.name" },
    },
  ],
  form: {
    fields: [
      {
        key: "name",
        label: "Tên danh mục",
        type: "text",
        placeholder: "Nhập tên danh mục",
      },
      {
        key: "description",
        label: "Mô tả danh mục",
        type: "textarea",
        rows: 4,
        placeholder: "Nhập mô tả danh mục",
      },
    ],
  },
  actions: {
    create: true,
    update: true,
    delete: true,
  },
};

type PatternFilters = Record<string, never>;

function patternListParams(input: ResourceListInput<PatternFilters>) {
  return {
    page: input.page,
    limit: input.limit,
    query: input.query || undefined,
    sortBy: input.sortBy || undefined,
    sortDirection: input.sortDirection,
  };
}

export const patternResource = defineResource<
  PatternItem,
  PatternFormModel,
  PatternFilters
>({
  key: "patterns",
  definition: patternDefinition,
  initialFilters: {},
  selectedColumns: ["name", "skuCount", "createdBy"],
  initialSort: { by: "name", direction: "asc" },
  emptyForm: () => ({ name: "", description: "" }),
  formFromRow: (row) => ({
    name: row.name,
    description: row.description || "",
  }),
  labels: {
    singular: "mẫu",
    create: "Đã thêm mẫu",
    update: "Đã cập nhật mẫu",
    delete: "Đã xóa mẫu",
  },
  transport: createJsonCrudTransport("/patterns", patternListParams),
});
