import { PERMISSIONS } from "@/config/permissions";
import {
  defineResource,
  type ResourceListInput,
} from "@/components/resource/contracts";
import { createJsonCrudTransport } from "@/components/resource/json-crud-transport";
import type { ResourceDefinition } from "@/config/resource";
import type { Material, MaterialFormModel } from "@/views/Materials/types";

export const materialDefinition: ResourceDefinition = {
  key: "materials",
  title: "Quản lý chất liệu",
  description: "Quản lý danh sách chất liệu.",
  breadcrumbs: [
    { text: "Trang chủ", link: "/" },
    { text: "Danh mục" },
    { text: "Chất liệu" },
  ],
  endpoint: "/materials",
  permission: {
    view: PERMISSIONS.materialsView,
    create: PERMISSIONS.materialsCreate,
    update: PERMISSIONS.materialsUpdate,
    delete: PERMISSIONS.materialsDelete,
  },
  columns: [
    { key: "name", label: "Tên chất liệu", type: "text", sortable: true },
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
        label: "Tên chất liệu",
        type: "text",
        required: true,
        maxLength: 120,
        placeholder: "Nhập tên chất liệu",
      },
      {
        key: "description",
        label: "Mô tả chất liệu",
        type: "textarea",
        rows: 4,
        maxLength: 500,
        placeholder: "Nhập mô tả chất liệu",
      },
    ],
  },
  actions: {
    create: true,
    update: true,
    delete: true,
    refresh: true,
  },
};

type MaterialFilters = Record<string, never>;

function materialListParams(input: ResourceListInput<MaterialFilters>) {
  return {
    page: input.page,
    limit: input.limit,
    query: input.query || undefined,
    sortBy: input.sortBy || undefined,
    sortDirection: input.sortDirection,
  };
}

export const materialResource = defineResource<
  Material,
  MaterialFormModel,
  MaterialFilters
>({
  key: "materials",
  definition: materialDefinition,
  initialFilters: {},
  selectedColumns: ["name", "productCount", "createdBy"],
  initialSort: { by: "name", direction: "asc" },
  emptyForm: () => ({ name: "", description: "" }),
  formFromRow: (row) => ({
    name: row.name,
    description: row.description || "",
  }),
  labels: {
    singular: "chất liệu",
    create: "Đã thêm chất liệu",
    update: "Đã cập nhật chất liệu",
    delete: "Đã xóa chất liệu",
  },
  transport: createJsonCrudTransport("/materials", materialListParams),
});
