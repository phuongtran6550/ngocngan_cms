import { PERMISSIONS } from "@/config/permissions";
import type { ResourceDefinition } from "@/config/resource";

export const orderDefinition: ResourceDefinition = {
  key: "orders",
  title: "Quản lý đơn hàng",
  description: "Theo dõi đơn bán, đổi trả và các đơn chờ bổ sung thông tin trong một luồng thống nhất.",
  endpoint: "/orders",
  permission: {
    view: PERMISSIONS.ordersView,
    create: PERMISSIONS.ordersCreate,
    update: PERMISSIONS.ordersUpdate,
    delete: PERMISSIONS.ordersDelete,
    restore: PERMISSIONS.ordersDelete,
  },
  columns: [
    { key: "thumbnail", label: "Ảnh", type: "image", width: "5rem", display: { url: "/orders/:id" } },
    { key: "orderCode", label: "Mã đơn", type: "text", display: { url: "/orders/:id" } },
    { key: "customerDisplay", label: "Khách hàng", type: "text" },
    { key: "phone", label: "Điện thoại", type: "text", sortable: true, displayIn: "table" },
    { key: "productSummary", label: "Sản phẩm", type: "text", display: { url: "/orders/:id" } },
    { key: "itemQuantity", label: "Số món", type: "number" },
    { key: "price", label: "Thành tiền", type: "money", sortable: true },
    { key: "customerInfoStatus", label: "Thông tin khách", type: "status" },
    { key: "status", label: "Giao dịch", type: "status", sortable: true },
    { key: "createdByName", label: "Người tạo", type: "text" },
    { key: "createdAt", label: "Ngày tạo", type: "datetime", sortable: true },
    { key: "updatedAt", label: "Cập nhật", type: "datetime", sortable: true, displayIn: "table" },
  ],
  actions: { view: true, create: true, delete: true, restore: true, refresh: true, fieldSelector: true },
};
