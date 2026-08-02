import { createPinia, setActivePinia } from "pinia";
import { authenStore } from "@/stores/app-authen";
import { createCmsRouter } from "@/router";
import { visibleNavigation } from "@/config/navigation";

describe("CMS router and navigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setActivePinia(createPinia());
  });

  it("redirects unauthenticated protected navigation to login", async () => {
    const router = createCmsRouter();

    await router.push("/categories");

    expect(router.currentRoute.value.path).toBe("/login");
  });

  it("filters navigation by the same permission used by the route", () => {
    const entries = visibleNavigation(["categories.view"]);

    expect(entries.some((entry) => entry.path === "/categories")).toBe(true);
    expect(entries.some((entry) => entry.path === "/orders")).toBe(false);
  });

  it("makes Materials visible and routable only through materials.view", async () => {
    const auth = authenStore();
    auth.token = "material-reader-token";
    auth.user = { role: "USER", permissions: ["materials.view"] };
    const router = createCmsRouter();

    expect(
      visibleNavigation(["categories.view"]).some(
        (entry) => entry.path === "/materials",
      ),
    ).toBe(false);
    expect(
      visibleNavigation(["materials.view"]).some(
        (entry) => entry.path === "/materials",
      ),
    ).toBe(true);
    await router.push("/materials");
    expect(router.currentRoute.value.path).toBe("/materials");
  });

  it("allows an administrator to open protected navigation", async () => {
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    const router = createCmsRouter();

    await router.push("/categories");

    expect(router.currentRoute.value.path).toBe("/categories");
  });

  it("keeps inventory create and detail workflows protected without adding duplicate menu entries", async () => {
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    const router = createCmsRouter();

    await router.push("/warehoused-goods/create");

    expect(router.currentRoute.value.path).toBe("/warehoused-goods/create");
    expect(
      visibleNavigation([], "ADMINISTRATOR").filter((entry) =>
        entry.path?.startsWith("/warehoused-goods"),
      ).length,
    ).toBe(1);
    expect(
      router
        .getRoutes()
        .filter((route) => route.path.startsWith("/warehoused-goods")),
    ).toHaveLength(4);
  });

  it("registers the full-page inventory edit workflow", async () => {
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    const router = createCmsRouter();

    await router.push("/warehoused-goods/warehouse-1/edit");

    expect(router.currentRoute.value.path).toBe(
      "/warehoused-goods/warehouse-1/edit",
    );
    expect(router.currentRoute.value.name).toBe("warehoused-goods-edit");
  });

  it("registers one read-only Product menu entry and exact SKU detail route", async () => {
    const auth = authenStore();
    auth.token = "warehouse-reader-token";
    auth.user = { role: "USER", permissions: ["warehouse.view"] };
    const router = createCmsRouter();

    await router.push("/products/507f1f77bcf86cd799439011");

    expect(router.currentRoute.value.name).toBe("products-detail");
    expect(
      visibleNavigation(["warehouse.view"]).filter((entry) =>
        entry.path?.startsWith("/products"),
      ),
    ).toHaveLength(1);
    expect(
      router.getRoutes().filter((entry) => entry.path.startsWith("/products")),
    ).toHaveLength(2);
  });

  it("registers every order workflow without adding duplicate menu entries", async () => {
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    const router = createCmsRouter();

    for (const path of [
      "/orders",
      "/orders/create",
      "/orders/missing",
      "/orders/order-1",
    ]) {
      await router.push(path);
      expect(router.currentRoute.value.path).toBe(path);
    }

    expect(
      visibleNavigation([], "ADMINISTRATOR").filter((entry) =>
        entry.path?.startsWith("/orders"),
      ).length,
    ).toBe(1);
  });

  it("registers customer current and history pages with one menu entry", async () => {
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    const router = createCmsRouter();

    await router.push("/customers/history");

    expect(router.currentRoute.value.path).toBe("/customers/history");
    expect(
      visibleNavigation([], "ADMINISTRATOR").filter((entry) =>
        entry.path?.startsWith("/customers"),
      ).length,
    ).toBe(1);
  });

  it("requires both read and write access before opening create workflows", async () => {
    const auth = authenStore();
    auth.token = "user-token";
    auth.user = { role: "USER", permissions: ["orders.create"] };
    const router = createCmsRouter();

    await router.push("/orders/create");

    expect(router.currentRoute.value.path).toBe("/403");
  });

  it("registers the three catalog resource pages as separately addressable protected routes", async () => {
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    const router = createCmsRouter();

    for (const path of ["/categories", "/materials", "/patterns"]) {
      await router.push(path);
      expect(router.currentRoute.value.path).toBe(path);
    }
  });

  it("keeps the legacy Zalo URL as a hidden redirect to the Settings section", async () => {
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    const router = createCmsRouter();

    await router.push("/zalo");

    expect(router.currentRoute.value.path).toBe("/settings");
    expect(router.currentRoute.value.hash).toBe("#zalo");
  });
});
