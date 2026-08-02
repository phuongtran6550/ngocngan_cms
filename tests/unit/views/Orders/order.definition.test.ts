import { orderDefinition } from "@/views/Orders/config";

describe("order definition", () => {
  it("declares the complete order permission contract", () => {
    expect(orderDefinition.permission).toEqual({
      view: "orders.view",
      create: "orders.create",
      update: "orders.update",
      delete: "orders.delete",
    });
  });

  it("keeps the Phoenix list responsive across desktop, tablet and mobile", () => {
    expect(orderDefinition.columns.map((column) => column.key)).toEqual([
      "thumbnail",
      "name",
      "phone",
      "price",
      "status",
      "createdByName",
      "createdAt",
      "updatedAt",
    ]);
    expect("responsive" in orderDefinition).toBe(false);
  });
});
