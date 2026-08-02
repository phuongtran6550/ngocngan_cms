import { PERMISSIONS, canAccess } from "@/config/permissions";

describe("order permissions", () => {
  it("declares view, create, update and delete permissions", () => {
    expect(PERMISSIONS).toEqual(expect.objectContaining({
      ordersView: "orders.view",
      ordersCreate: "orders.create",
      ordersUpdate: "orders.update",
      ordersDelete: "orders.delete",
      settingsManage: "zalo.manage",
      materialsView: "materials.view",
      materialsCreate: "materials.create",
      materialsUpdate: "materials.update",
      materialsDelete: "materials.delete",
    }));
  });

  it("does not escalate warehouse permissions into category permissions", () => {
    expect(canAccess([PERMISSIONS.warehouseView], PERMISSIONS.categoriesView, "USER")).toBe(false);
    expect(canAccess([PERMISSIONS.categoriesView], PERMISSIONS.categoriesView, "USER")).toBe(true);
  });

  it("keeps Materials permissions independent from category permissions", () => {
    expect(canAccess([PERMISSIONS.categoriesView], PERMISSIONS.materialsView, "USER")).toBe(false);
    expect(canAccess([PERMISSIONS.materialsView], PERMISSIONS.materialsView, "USER")).toBe(true);
  });
});
