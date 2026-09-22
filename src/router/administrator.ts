import { PERMISSIONS } from "@/config/permissions";
import type { ClientRoute } from "@/router/client";

const administratorRoutes: ClientRoute[] = [
  {
    path: "/roles",
    name: "roles",
    meta: {
      auth: true,
      title: "Vai trò",
      permission: PERMISSIONS.rolesManage,
      navigation: {
        group: "system",
        groupLabel: "Quản trị",
        icon: "shield",
        order: 10,
      },
    },
    component: () => import("@/views/Administrator/Roles/index.vue"),
  },
  {
    path: "/users",
    name: "users",
    meta: {
      auth: true,
      title: "Nhân sự",
      permission: PERMISSIONS.usersManage,
      navigation: {
        group: "system",
        groupLabel: "Quản trị",
        icon: "user-check",
        order: 20,
      },
    },
    component: () => import("@/views/Administrator/User/index.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    meta: {
      auth: true,
      title: "Cài đặt",
      permission: PERMISSIONS.settingsManage,
      navigation: {
        group: "system",
        groupLabel: "Quản trị",
        icon: "settings",
        order: 30,
      },
    },
    component: () => import("@/views/Settings/index.vue"),
  },
  {
    path: "/price-roundings",
    name: "price-roundings",
    meta: {
      auth: true,
      title: "Mốc làm tròn",
      permission: PERMISSIONS.settingsManage,
      navigation: {
        group: "system",
        groupLabel: "Quản trị",
        icon: "dollar-sign",
        order: 40,
      },
    },
    component: () => import("@/views/PriceRoundings/index.vue"),
  },
  {
    path: "/zalo",
    name: "zalo",
    meta: {
      auth: true,
      title: "Cài đặt",
      permission: PERMISSIONS.settingsManage,
    },
    redirect: { path: "/settings", hash: "#zalo" },
  },
  {
    path: "/zalo/callback",
    name: "zalo-callback",
    meta: {
      auth: true,
      title: "Zalo Callback",
      permission: PERMISSIONS.settingsManage,
    },
    component: () => import("@/views/Zalo/callback.vue"),
  },
];

export default administratorRoutes;
