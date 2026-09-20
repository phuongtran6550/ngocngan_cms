import { PERMISSIONS } from "@/config/permissions";
import type { ResourceDefinition } from "@/config/resource";

export const warehouseDefinition: ResourceDefinition = {
  key: "warehoused-goods",
  title: "Hàng nhập kho",
  description: "Theo dõi phân loại, quy cách SKU, giá bán và tồn kho sản phẩm.",
  endpoint: "/warehoused-goods",
  permission: {
    view: PERMISSIONS.warehouseView,
    create: PERMISSIONS.warehouseCreate,
    update: PERMISSIONS.warehouseUpdate,
    delete: PERMISSIONS.warehouseDelete,
  },
  columns: [
    {
      key: "name",
      label: "Sản phẩm",
      type: "product",
      sortable: true,
      width: "350px",
      display: { url: "/warehoused-goods/:id" },
    },
    { key: "price", label: "Giá bán", type: "money", sortable: true },
    { key: "classificationTags", label: "Phân loại", type: "tags" },
    { key: "stock", label: "Tồn kho", type: "number", sortable: true },
    { key: "updatedAt", label: "Cập nhật", type: "datetime", sortable: true },
  ],
  tableMinWidth: "70rem",
  actions: {
    view: true,
    create: true,
    update: true,
    delete: true,
    refresh: true,
    fieldSelector: true,
  },
};
