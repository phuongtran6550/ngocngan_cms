import type { RouteRecordRaw } from "vue-router";
import { PERMISSIONS, type PermissionRequirement } from "@/config/permissions";

export type NavigationGroupKey = "overview" | "commerce" | "system";

export interface ClientNavigationMeta {
  group: NavigationGroupKey;
  groupLabel?: string;
  icon: string;
  order: number;
  parent?: {
    key: string;
    label: string;
    icon: string;
    order: number;
  };
}

export interface ClientRouteMeta {
  auth: true;
  title: string;
  permission?: PermissionRequirement;
  navigation?: ClientNavigationMeta;
}

export interface ClientRoute extends Omit<
  RouteRecordRaw,
  "meta" | "path" | "name"
> {
  path: string;
  name: string;
  meta: ClientRouteMeta;
}

const clientRoutes: ClientRoute[] = [
  {
    path: "/dashboard",
    name: "dashboard",
    meta: {
      auth: true,
      title: "Tổng quan",
      permission: PERMISSIONS.dashboardView,
      navigation: { group: "overview", icon: "pie-chart", order: 10 },
    },
    component: () => import("@/views/Dashboard/index.vue"),
  },
  {
    path: "/orders",
    name: "orders",
    meta: {
      auth: true,
      title: "Đơn hàng",
      permission: PERMISSIONS.ordersView,
      navigation: {
        group: "commerce",
        groupLabel: "Nghiệp vụ",
        icon: "shopping-cart",
        order: 10,
      },
    },
    component: () => import("@/views/Orders/index.vue"),
  },
  {
    path: "/orders/create",
    name: "orders-create",
    meta: {
      auth: true,
      title: "Tạo đơn hàng",
      permission: [PERMISSIONS.ordersView, PERMISSIONS.ordersCreate],
    },
    component: () => import("@/views/Orders/add.vue"),
  },
  {
    path: "/orders/missing",
    name: "orders-missing",
    meta: {
      auth: true,
      title: "Đơn chờ bổ sung",
      permission: PERMISSIONS.ordersView,
    },
    component: () => import("@/views/Orders/missing.vue"),
  },
  {
    path: "/orders/:id",
    name: "orders-detail",
    meta: {
      auth: true,
      title: "Chi tiết đơn hàng",
      permission: PERMISSIONS.ordersView,
    },
    component: () => import("@/views/Orders/detail.vue"),
  },
  {
    path: "/categories",
    name: "categories",
    meta: {
      auth: true,
      title: "Danh mục",
      permission: PERMISSIONS.categoriesView,
      navigation: {
        group: "commerce",
        groupLabel: "Nghiệp vụ",
        icon: "folder",
        order: 10,
        parent: { key: "catalog", label: "Danh mục", icon: "tag", order: 20 },
      },
    },
    component: () => import("@/views/Categories/index.vue"),
  },
  {
    path: "/materials",
    name: "materials",
    meta: {
      auth: true,
      title: "Chất liệu",
      permission: PERMISSIONS.materialsView,
      navigation: {
        group: "commerce",
        groupLabel: "Nghiệp vụ",
        icon: "layers",
        order: 20,
        parent: { key: "catalog", label: "Danh mục", icon: "tag", order: 20 },
      },
    },
    component: () => import("@/views/Materials/index.vue"),
  },
  {
    path: "/patterns",
    name: "patterns",
    meta: {
      auth: true,
      title: "Mẫu",
      permission: PERMISSIONS.categoriesView,
      navigation: {
        group: "commerce",
        groupLabel: "Nghiệp vụ",
        icon: "grid",
        order: 30,
        parent: { key: "catalog", label: "Danh mục", icon: "tag", order: 20 },
      },
    },
    component: () => import("@/views/Patterns/index.vue"),
  },
  {
    path: "/products",
    name: "products",
    meta: {
      auth: true,
      title: "Sản phẩm",
      permission: PERMISSIONS.warehouseView,
      navigation: {
        group: "commerce",
        groupLabel: "Nghiệp vụ",
        icon: "gem",
        order: 25,
      },
    },
    component: () => import("@/views/Products/index.vue"),
  },
  {
    path: "/products/:skuId",
    name: "products-detail",
    meta: {
      auth: true,
      title: "Chi tiết sản phẩm",
      permission: PERMISSIONS.warehouseView,
    },
    component: () => import("@/views/Products/detail.vue"),
  },
  {
    path: "/warehoused-goods",
    name: "warehoused-goods",
    meta: {
      auth: true,
      title: "Hàng nhập kho",
      permission: PERMISSIONS.warehouseView,
      navigation: {
        group: "commerce",
        groupLabel: "Nghiệp vụ",
        icon: "archive",
        order: 30,
      },
    },
    component: () => import("@/views/WarehousedGoods/index.vue"),
  },
  {
    path: "/warehoused-goods/create",
    name: "warehoused-goods-create",
    meta: {
      auth: true,
      title: "Thêm hàng nhập kho",
      permission: [PERMISSIONS.warehouseView, PERMISSIONS.warehouseCreate],
    },
    component: () => import("@/views/WarehousedGoods/add.vue"),
  },
  {
    path: "/warehoused-goods/:id/edit",
    name: "warehoused-goods-edit",
    meta: {
      auth: true,
      title: "Cập nhật hàng nhập kho",
      permission: [PERMISSIONS.warehouseView, PERMISSIONS.warehouseUpdate],
    },
    component: () => import("@/views/WarehousedGoods/edit.vue"),
  },
  {
    path: "/warehoused-goods/:id",
    name: "warehoused-goods-detail",
    meta: {
      auth: true,
      title: "Chi tiết hàng nhập kho",
      permission: PERMISSIONS.warehouseView,
    },
    component: () => import("@/views/WarehousedGoods/detail.vue"),
  },
  {
    path: "/print-devices",
    name: "print-devices",
    meta: {
      auth: true,
      title: "Ứng dụng in",
      permission: PERMISSIONS.warehouseView,
      navigation: {
        group: "commerce",
        groupLabel: "Nghiệp vụ",
        icon: "download",
        order: 60,
      },
    },
    component: () => import("@/views/PrintDevices/guide.vue"),
  },
  {
    path: "/print-guide",
    name: "print-guide",
    meta: {
      auth: true,
      title: "Hướng dẫn cài đặt máy in",
      permission: PERMISSIONS.warehouseView,
    },
    component: () => import("@/views/PrintDevices/guide.vue"),
  },
  {
    path: "/source-of-goods",
    name: "source-of-goods",
    meta: {
      auth: true,
      title: "Nguồn hàng",
      permission: PERMISSIONS.sourceGoodsView,
      navigation: {
        group: "commerce",
        groupLabel: "Nghiệp vụ",
        icon: "truck",
        order: 40,
      },
    },
    component: () => import("@/views/Sources/index.vue"),
  },
  {
    path: "/customers",
    name: "customers",
    meta: {
      auth: true,
      title: "Khách hàng",
      permission: PERMISSIONS.customersView,
      navigation: {
        group: "commerce",
        groupLabel: "Nghiệp vụ",
        icon: "users",
        order: 50,
      },
    },
    component: () => import("@/views/Customers/index.vue"),
  },
  {
    path: "/customers/history",
    name: "customers-history",
    meta: {
      auth: true,
      title: "Lịch sử đổi trả",
      permission: PERMISSIONS.customersView,
    },
    component: () => import("@/views/Customers/history.vue"),
  },
  {
    path: "/customers/:phone",
    name: "customers-detail",
    meta: {
      auth: true,
      title: "Chi tiết khách hàng",
      permission: PERMISSIONS.customersView,
    },
    component: () => import("@/views/Customers/detail.vue"),
  },
  {
    path: "/profile",
    name: "profile",
    meta: { auth: true, title: "Hồ sơ cá nhân" },
    component: () => import("@/views/Account/Profile.vue"),
  },
  {
    path: "/profile/change-password",
    name: "change-password",
    meta: { auth: true, title: "Đổi mật khẩu" },
    component: () => import("@/views/Account/ChangePassword.vue"),
  },
  {
    path: "/403",
    name: "forbidden",
    meta: { auth: true, title: "Không có quyền truy cập" },
    component: () => import("@/views/Page403.vue"),
  },
];

export default clientRoutes;
