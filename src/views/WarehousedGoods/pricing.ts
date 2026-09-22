const FIXED_PRICE_MARKS = [
  130_000, 150_000, 180_000, 200_000, 220_000, 250_000, 280_000, 300_000,
  320_000, 350_000, 380_000, 400_000, 420_000, 450_000, 480_000, 500_000,
  550_000, 600_000, 650_000, 700_000, 750_000, 800_000, 850_000, 900_000,
  950_000, 1_000_000, 1_100_000,
] as const;

const PIECE_PRICE_MULTIPLIERS = [2, 1.9, 1.8, 1.7, 1.6] as const;

export interface PieceImportPriceCandidate {
  importPrice: number;
  multiplier: number;
  discountRate: number;
}

function numeric(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundSellingPrice(value: number, customMarks?: readonly number[]): number {
  const price = numeric(value);
  if (price <= 0) return 0;

  const marks = customMarks && customMarks.length > 0 ? customMarks : FIXED_PRICE_MARKS;
  const lastFixedMark = marks[marks.length - 1];
  if (price <= lastFixedMark) {
    return marks.reduce((nearest, mark) => {
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

export const WEIGHTED_FIXED_PRICE_MARKS = [
  60_000, 80_000, 100_000, 130_000, 150_000, 180_000, 200_000, 220_000,
  250_000, 280_000, 300_000, 320_000, 350_000, 380_000, 400_000, 420_000,
  450_000, 480_000, 500_000, 550_000, 600_000, 650_000, 700_000, 750_000,
  800_000, 850_000, 900_000, 950_000, 1_000_000, 1_100_000,
] as const;

export function roundWeightedSellingPrice(value: number, customMarks?: readonly number[]): number {
  const price = numeric(value);
  if (price <= 0) return 0;

  const marks = customMarks && customMarks.length > 0 ? customMarks : WEIGHTED_FIXED_PRICE_MARKS;
  const lastFixedMark = marks[marks.length - 1];
  if (price <= lastFixedMark) {
    return marks.reduce((nearest, mark) => {
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

export function weightedPriceMarkupRate(silverCost: number): number {
  const value = numeric(silverCost);
  if (value <= 200_000) return 0.6;
  if (value <= 400_000) return 0.5;
  if (value <= 600_000) return 0.4;
  if (value <= 1_000_000) return 0.3;
  return 0.2;
}

export function piecePriceMultiplier(importPrice: number): number {
  const value = numeric(importPrice);
  if (value <= 300_000) return 2;
  if (value <= 400_000) return 1.9;
  if (value <= 500_000) return 1.8;
  if (value <= 700_000) return 1.7;
  return 1.6;
}

export function calculatePiecePrice(
  importPrice: number,
  platingCost: number = 0,
  laborCost: number = 0,
  customMarks?: readonly number[],
): {
  basePrice: number;
  roundedBasePrice: number;
  rawPrice: number;
  price: number;
  multiplier: number;
  discountRate: number;
} {
  const multiplier = piecePriceMultiplier(importPrice);
  const basePrice = Math.round(numeric(importPrice) * multiplier);
  const roundedBasePrice = roundSellingPrice(basePrice, customMarks);
  const plating = Math.max(0, numeric(platingCost));
  const labor = Math.max(0, numeric(laborCost));
  const price = roundedBasePrice + plating + labor;
  return {
    basePrice,
    roundedBasePrice,
    rawPrice: basePrice + plating + labor,
    price,
    multiplier,
    discountRate: Number((1 - multiplier / 2).toFixed(2)),
  };
}

export function estimatePieceImportPrices(
  sellingPrice: number,
  platingCost: number = 0,
  laborCost: number = 0,
): PieceImportPriceCandidate[] {
  const price = numeric(sellingPrice);
  const plating = Math.max(0, numeric(platingCost));
  const labor = Math.max(0, numeric(laborCost));
  const basePrice = price - plating - labor;
  if (basePrice <= 0) return [];

  return PIECE_PRICE_MULTIPLIERS.map((multiplier) => ({
    importPrice: Math.round(basePrice / multiplier),
    multiplier,
    discountRate: Number((1 - multiplier / 2).toFixed(2)),
  }))
    .filter(
      (candidate) =>
        candidate.importPrice > 0 &&
        piecePriceMultiplier(candidate.importPrice) === candidate.multiplier,
    )
    .filter(
      (candidate, index, rows) =>
        rows.findIndex(
          (row) => row.importPrice === candidate.importPrice,
        ) === index,
    );
}

export function estimatePieceImportPrice(
  sellingPrice: number,
  currentImportPrice = 0,
  platingCost: number = 0,
  laborCost: number = 0,
): PieceImportPriceCandidate | null {
  const candidates = estimatePieceImportPrices(sellingPrice, platingCost, laborCost);
  if (!candidates.length) return null;

  const currentMultiplier =
    numeric(currentImportPrice) > 0
      ? piecePriceMultiplier(currentImportPrice)
      : null;
  return (
    candidates.find(
      (candidate) => candidate.multiplier === currentMultiplier,
    ) || candidates[0]
  );
}

export interface WeightedPriceResult {
  silverCost: number;
  markupRate: number;
  basePrice: number;
  roundedBasePrice: number;
  rawPrice: number;
  price: number;
}

export function calculateWeightedPrice(input: {
  weight: number;
  silverPrice: number;
  laborCost: number;
  platingCost: number;
  customMarks?: readonly number[];
}): WeightedPriceResult {
  const silverCost = Math.round(
    numeric(input.weight) * numeric(input.silverPrice),
  );
  const markupRate = weightedPriceMarkupRate(silverCost);
  const basePrice = Math.round(silverCost + silverCost * markupRate);
  const roundedBasePrice = roundWeightedSellingPrice(basePrice, input.customMarks);
  const plating = Math.max(0, numeric(input.platingCost));
  const labor = Math.max(0, numeric(input.laborCost));
  const price = roundedBasePrice + plating + labor;
  return {
    silverCost,
    markupRate,
    basePrice,
    roundedBasePrice,
    rawPrice: basePrice + plating + labor,
    price,
  };
}

export function calculateSkuRawPrice(
  sku: {
    pricingType?: string;
    weight?: number;
    laborCost?: number;
    platingCost?: number;
    importPrice?: number | null;
    price?: number;
  },
  silverPrice?: number | null,
  customMarks?: readonly number[],
): number | null {
  const pricingType = sku.pricingType || "";
  const importPrice = Number(sku.importPrice);
  if (pricingType === "Đồ món" || (importPrice > 0 && !pricingType)) {
    if (importPrice > 0) {
      const preview = calculatePiecePrice(
        importPrice,
        Number(sku.platingCost) || 0,
        Number(sku.laborCost) || 0,
        customMarks,
      );
      return preview.rawPrice;
    }
  }

  const weight = Number(sku.weight);
  const sp = Number(silverPrice);
  if (pricingType === "Đồ cân" || (weight > 0 && !pricingType)) {
    if (weight > 0 && sp > 0) {
      const { rawPrice } = calculateWeightedPrice({
        weight,
        silverPrice: sp,
        laborCost: Number(sku.laborCost) || 0,
        platingCost: Number(sku.platingCost) || 0,
        customMarks,
      });
      return rawPrice;
    }
  }

  return null;
}

