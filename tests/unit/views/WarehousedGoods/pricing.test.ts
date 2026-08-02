import {
  calculatePiecePrice,
  calculateWeightedPrice,
  piecePriceMultiplier,
  roundSellingPrice,
} from "@/views/WarehousedGoods/pricing";

describe("warehouse pricing", () => {
  it.each([
    [132_000, 130_000],
    [140_000, 130_000],
    [141_000, 150_000],
    [164_000, 150_000],
    [166_000, 180_000],
    [167_000, 180_000],
    [1_149_000, 1_100_000],
    [1_151_000, 1_200_000],
    [1_682_000, 1_700_000],
  ])(
    "rounds %i to the nearest configured selling-price mark",
    (input, expected) => {
      expect(roundSellingPrice(input)).toBe(expected);
    },
  );

  it.each([
    [299_999, 2],
    [300_000, 1.9],
    [399_999, 1.9],
    [400_000, 1.8],
    [499_999, 1.8],
    [500_000, 1.7],
    [700_000, 1.7],
    [700_001, 1.6],
  ])("uses the correct Đồ món multiplier at %i", (importPrice, expected) => {
    expect(piecePriceMultiplier(importPrice)).toBe(expected);
  });

  it("calculates and rounds Đồ món selling prices", () => {
    expect(calculatePiecePrice(350_000)).toEqual({
      rawPrice: 665_000,
      price: 650_000,
      multiplier: 1.9,
      discountRate: 0.05,
    });
  });

  it("calculates and rounds Đồ cân selling prices", () => {
    expect(
      calculateWeightedPrice({
        silverPrice: 220_000,
        weight: 1.5,
        laborCost: 200_000,
        platingCost: 50_000,
      }),
    ).toEqual({ rawPrice: 580_000, price: 600_000 });
  });
});
