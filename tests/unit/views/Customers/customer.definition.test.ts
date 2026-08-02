import { customerDefinition } from "@/views/Customers/config";

describe("customer definition", () => {
  it("declares aggregate fields without mutable client counters", () => {
    expect(customerDefinition("current").columns.map((column) => column.key)).toEqual([
      "name",
      "phone",
      "price",
      "priceReturn",
      "orderCount",
      "latestOrderAt",
    ]);
    expect(customerDefinition("current").permission.view).toBe("customers.view");
  });

  it("uses explicit current and history copy with native Phoenix table behavior", () => {
    expect(customerDefinition("current").title).toBe("Khách hàng");
    expect(customerDefinition("history").title).toBe("Lịch sử đổi trả");
    expect("responsive" in customerDefinition("history")).toBe(false);
  });
});
