import { PERMISSIONS } from "@/config/permissions";
import type { ResourceDefinition } from "@/config/resource";

export const productDefinition: ResourceDefinition = {
  key: "products",
  title: "Sản phẩm",
  description: "Tra cứu nhanh từng SKU, giá bán, tồn kho và quy cách.",
  breadcrumbs: [
    { text: "Trang chủ", link: "/" },
    { text: "Sản phẩm" },
  ],
  endpoint: "/products",
  permission: { view: PERMISSIONS.productsView },
  columns: [
    {
      key: "name",
      label: "Sản phẩm",
      type: "product",
      sortable: true,
      width: "350px",
    },
    { key: "price", label: "Giá bán", type: "money", sortable: true },
    { key: "stock", label: "Tồn kho", type: "number", sortable: true },
    {
      key: "weight",
      label: "Trọng lượng",
      type: "text",
      sortable: true,
    },
    { key: "size", label: "Ni", type: "text", sortable: true },
    {
      key: "printCount",
      label: "Số lần in",
      type: "number",
      sortable: true,
    },
    { key: "classificationTags", label: "Phân loại", type: "tags" },
    {
      key: "updatedAt",
      label: "Cập nhật",
      type: "datetime",
      sortable: true,
      displayIn: "table",
    },
  ],
  tableMinWidth: "78rem",
  actions: {
    view: true,
    create: false,
    update: false,
    delete: false,
    refresh: true,
    fieldSelector: false,
  },
};
