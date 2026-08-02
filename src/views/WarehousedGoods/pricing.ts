const FIXED_PRICE_MARKS = [
  130_000, 150_000, 180_000, 200_000, 220_000, 250_000, 280_000, 300_000,
  320_000, 350_000, 380_000, 400_000, 420_000, 450_000, 480_000, 500_000,
  550_000, 600_000, 650_000, 700_000, 750_000, 800_000, 850_000, 900_000,
  950_000, 1_000_000, 1_100_000,
] as const;

function numeric(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundSellingPrice(value: number): number {
  const price = numeric(value);
  if (price <= 0) return 0;

  const lastFixedMark = FIXED_PRICE_MARKS[FIXED_PRICE_MARKS.length - 1];
  if (price <= lastFixedMark) {
    return FIXED_PRICE_MARKS.reduce((nearest, mark) => {
      const currentDistance = Math.abs(price - nearest);
      const nextDistance = Math.abs(price - mark);
      return nextDistance < currentDistance ? mark : nearest;
    });
  }

  const steps = Math.floor((price - lastFixedMark) / 100_000);
  const lower = lastFixedMark + steps * 100_000;
  const upper = lower + 100_000;
  return price - lower <= upper - price ? lower : upper;
}

export function piecePriceMultiplier(importPrice: number): number {
  const value = numeric(importPrice);
  if (value < 300_000) return 2;
  if (value < 400_000) return 1.9;
  if (value < 500_000) return 1.8;
  if (value <= 700_000) return 1.7;
  return 1.6;
}

export function calculatePiecePrice(importPrice: number): {
  rawPrice: number;
  price: number;
  multiplier: number;
  discountRate: number;
} {
  const multiplier = piecePriceMultiplier(importPrice);
  const rawPrice = Math.round(numeric(importPrice) * multiplier);
  return {
    rawPrice,
    price: roundSellingPrice(rawPrice),
    multiplier,
    discountRate: Number((1 - multiplier / 2).toFixed(2)),
  };
}

export function calculateWeightedPrice(input: {
  weight: number;
  silverPrice: number;
  laborCost: number;
  platingCost: number;
}): { rawPrice: number; price: number } {
  const rawPrice = Math.round(
    numeric(input.weight) * numeric(input.silverPrice) +
      numeric(input.laborCost) +
      numeric(input.platingCost),
  );
  return { rawPrice, price: roundSellingPrice(rawPrice) };
}
