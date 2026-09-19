import { createRouter, createWebHistory } from "vue-router";
import {
  navigationAllowsPath,
  requiresNavigationAccess,
  visibleNavigation,
} from "@/config/navigation";
import { brandPageTitle } from "@/config/brand";
import administratorRoutes from "@/router/administrator";
import clientRoutes from "@/router/client";
import type { PermissionRequirement } from "@/config/permissions";
import { authenStore } from "@/stores/app-authen";

export function createCmsRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: "/login",
        name: "login",
        component: () => import("@/views/Account/login.vue"),
        meta: { guestOnly: true, title: "Đăng nhập" },
      },
      { path: "/", redirect: "/dashboard" },
      ...clientRoutes,
      ...administratorRoutes,
      { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
    ],
    scrollBehavior: (to) => to.hash ? { el: to.hash } : { top: 0 },
  });

  router.beforeEach(async (to) => {
    const auth = authenStore();
    try {
      await auth.initialize();
    } catch {
      // Keep the token during outages, but do not route using cached permissions.
      return to.name === "login"
        ? true
        : { name: "login", query: { redirect: to.fullPath } };
    }

    const requiresAuth = to.matched.some((record) => record.meta.auth === true);
    if (requiresAuth && !auth.isAuthenticated) {
      return { name: "login", query: { redirect: to.fullPath } };
    }

    if (to.meta.guestOnly && auth.isAuthenticated) {
      return (
        visibleNavigation(auth.permissions, auth.user?.role, auth.menu)[0]?.path ||
        "/profile"
      );
    }

    const permission = to.meta.permission as PermissionRequirement | undefined;
    if (permission && !auth.can(permission)) {
      const fallback = visibleNavigation(auth.permissions, auth.user?.role, auth.menu)[0]
        ?.path;
      if (fallback && fallback !== to.path) return fallback;
      return "/403";
    }

    if (
      auth.menu.length &&
      requiresNavigationAccess(to.path) &&
      !navigationAllowsPath(to.path, auth.permissions, auth.user?.role, auth.menu)
    ) {
      const fallback = visibleNavigation(auth.permissions, auth.user?.role, auth.menu)[0]
        ?.path;
      if (fallback && fallback !== to.path) return fallback;
      return "/403";
    }

    return true;
  });

  router.afterEach((to) => {
    document.title = brandPageTitle(to.meta.title ? String(to.meta.title) : undefined);
  });

  return router;
}
