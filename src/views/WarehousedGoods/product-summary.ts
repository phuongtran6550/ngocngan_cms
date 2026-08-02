import { formatMoney } from "@/utils/resource-display";
import type { WarehouseSku } from "@/views/WarehousedGoods/types";

const decimalFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 3,
});

function finiteNumbers(values: unknown[]): number[] {
  return values.flatMap((value) => {
    if (value === null || value === undefined || value === "") return [];
    const numeric = Number(value);
    return Number.isFinite(numeric) ? [numeric] : [];
  });
}

function numericBounds(values: number[]): { min: number; max: number } | null {
  if (!values.length) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

function formattedRange(
  values: number[],
  formatter: (value: number) => string,
): string {
  const bounds = numericBounds(values);
  if (!bounds) return "—";
  return bounds.min === bounds.max
    ? formatter(bounds.min)
    : `${formatter(bounds.min)} – ${formatter(bounds.max)}`;
}

function weightRange(skus: WarehouseSku[]): string {
  const bounds = numericBounds(finiteNumbers(skus.map((sku) => sku.weight)));
  if (!bounds) return "—";
  const value =
    bounds.min === bounds.max
      ? decimalFormatter.format(bounds.min)
      : `${decimalFormatter.format(bounds.min)} – ${decimalFormatter.format(bounds.max)}`;
  return `${value} chỉ`;
}

function sizeRange(skus: WarehouseSku[]): string {
  const values = [
    ...new Set(
      skus.map((sku) => String(sku.size ?? "").trim()).filter(Boolean),
    ),
  ];
  if (!values.length) return "Không áp dụng";

  const numeric = values.map(Number);
  if (numeric.every(Number.isFinite)) {
    return `Ni ${formattedRange(numeric, (value) => decimalFormatter.format(value))}`;
  }
  return values.join(", ");
}

export function productSkuSummary(skus: WarehouseSku[]) {
  return {
    price: formattedRange(
      finiteNumbers(skus.map((sku) => sku.price)),
      formatMoney,
    ),
    weight: weightRange(skus),
    size: sizeRange(skus),
    skuCount: skus.length,
    stock: skus.reduce(
      (total, sku) => total + (Number.isFinite(sku.stock) ? sku.stock : 0),
      0,
    ),
  };
}
