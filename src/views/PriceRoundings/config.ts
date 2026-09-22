import { PERMISSIONS } from "@/config/permissions";
import {
  defineResource,
  type ResourceListInput,
} from "@/components/resource/contracts";
import { createJsonCrudTransport } from "@/components/resource/json-crud-transport";
import type { ResourceDefinition, SelectOption } from "@/config/resource";
import type {
  PriceRounding,
  PriceRoundingFormModel,
  AppliesToType,
  StatusType,
} from "@/views/PriceRoundings/types";

export const APPLIES_TO_OPTIONS: SelectOption[] = [
  { label: "Tất cả", value: "all" },
  { label: "Đồ cân", value: "weighted" },
  { label: "Đồ món", value: "piece" },
];

export const STATUS_OPTIONS: SelectOption[] = [
  { label: "Bật", value: "active" },
  { label: "Tắt", value: "inactive" },
];

export const priceRoundingDefinition: ResourceDefinition = {
  key: "price-roundings",
  title: "Mốc làm tròn",
  description: "Cấu hình danh sách các mốc làm tròn giá bán cho Đồ cân và Đồ món.",
  breadcrumbs: [
    { text: "Trang chủ", link: "/" },
    { text: "Quản trị" },
    { text: "Mốc làm tròn" },
  ],
  endpoint: "/price-roundings",
  permission: {
    view: PERMISSIONS.settingsManage,
    create: PERMISSIONS.settingsManage,
    update: PERMISSIONS.settingsManage,
    delete: PERMISSIONS.settingsManage,
  },
  columns: [
    { key: "price", label: "Giá làm tròn", type: "money", sortable: true },
    {
      key: "appliesTo",
      label: "Áp dụng",
      type: "badge",
      options: APPLIES_TO_OPTIONS,
    },
    {
      key: "status",
      label: "Trạng thái",
      type: "status",
    },
    { key: "description", label: "Ghi chú", type: "text" },
    { key: "updatedAt", label: "Cập nhật", type: "datetime", sortable: true },
  ],
  filters: [
    {
      key: "appliesTo",
      label: "Áp dụng",
      type: "select",
      options: [{ label: "Tất cả", value: "" }, ...APPLIES_TO_OPTIONS],
    },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      options: [{ label: "Tất cả", value: "" }, ...STATUS_OPTIONS],
    },
  ],
  form: {
    fields: [
      {
        key: "price",
        label: "Giá làm tròn (₫)",
        type: "money",
        required: true,
        placeholder: "Nhập giá làm tròn (ví dụ: 150000)",
      },
      {
        key: "appliesTo",
        label: "Áp dụng cho",
        type: "select",
        required: true,
        options: APPLIES_TO_OPTIONS,
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        required: true,
        options: STATUS_OPTIONS,
      },
      {
        key: "description",
        label: "Ghi chú",
        type: "textarea",
        rows: 3,
        maxLength: 250,
        placeholder: "Nhập ghi chú mốc giá (không bắt buộc)",
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

export interface PriceRoundingFilters {
  appliesTo?: AppliesToType | "";
  status?: StatusType | "";
}

function priceRoundingListParams(
  input: ResourceListInput<PriceRoundingFilters>,
) {
  return {
    page: input.page,
    limit: input.limit,
    query: input.query || undefined,
    appliesTo: input.filters?.appliesTo || undefined,
    status: input.filters?.status || undefined,
    sortBy: input.sortBy || "price",
    sortDirection: input.sortDirection || "asc",
  };
}

export const priceRoundingResource = defineResource<
  PriceRounding,
  PriceRoundingFormModel,
  PriceRoundingFilters
>({
  key: "price-roundings",
  definition: priceRoundingDefinition,
  initialFilters: {
    appliesTo: "",
    status: "",
  },
  selectedColumns: ["price", "appliesTo", "status", "description", "updatedAt"],
  initialSort: { by: "price", direction: "asc" },
  emptyForm: () => ({
    price: null,
    appliesTo: "all",
    status: "active",
    description: "",
  }),
  formFromRow: (row) => ({
    price: row.price,
    appliesTo: row.appliesTo,
    status: row.status,
    description: row.description || "",
  }),
  labels: {
    singular: "mốc làm tròn",
    create: "Đã thêm mốc làm tròn",
    update: "Đã cập nhật mốc làm tròn",
    delete: "Đã xóa mốc làm tròn",
  },
  transport: createJsonCrudTransport(
    "/price-roundings",
    priceRoundingListParams,
  ),
});
