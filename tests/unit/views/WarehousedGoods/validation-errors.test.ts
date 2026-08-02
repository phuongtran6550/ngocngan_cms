import { warehouseValidationErrors } from "@/views/WarehousedGoods/validation-errors";

describe("warehouseValidationErrors", () => {
  it("maps a nested SKU stock error to the exact stock input", () => {
    expect(
      warehouseValidationErrors({
        message: "Dữ liệu không hợp lệ",
        errors: {
          "skus.1.stock": "SKU 2: Tồn kho phải là số nguyên không âm",
        },
      }),
    ).toEqual({
      "skus.1.stock": "SKU 2: Tồn kho phải là số nguyên không âm",
    });
  });

  it("maps an exact SKU field from API details when errors are absent", () => {
    expect(
      warehouseValidationErrors({
        message: "SKU 2: Tiền xi không hợp lệ",
        details: {
          "skus.1.platingCost": "SKU 2: Tiền xi không hợp lệ",
        },
      }),
    ).toEqual({
      "skus.1.platingCost": "SKU 2: Tiền xi không hợp lệ",
    });
  });

  it("keeps an exact SKU selling-price error instead of dropping it", () => {
    expect(
      warehouseValidationErrors({
        message: "SKU 1: Giá bán không hợp lệ",
        errors: {
          "skus.0.price": "SKU 1: Giá bán không hợp lệ",
        },
      }),
    ).toEqual({
      "skus.0.price": "SKU 1: Giá bán không hợp lệ",
    });
  });
});
