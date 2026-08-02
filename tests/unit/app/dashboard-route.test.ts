import { PERMISSIONS } from "@/config/permissions";
import clientRoutes from "@/router/client";

describe("dashboard route", () => {
  it("uses the real dashboard page and declares export permission", () => {
    const route = clientRoutes.find((item) => item.name === "dashboard");
    expect(route?.component).not.toBeUndefined();
    expect(PERMISSIONS.exportOrders).toBe("export.orders");
  });
});
