import assert from "node:assert/strict";
import test from "node:test";
import { formatMoney } from "../src/utils/resource-display.ts";

function getStockStatus(stock) {
  const stockCount = typeof stock === "number" && Number.isFinite(stock) ? Math.max(0, stock) : 0;
  if (stockCount <= 0) {
    return {
      stockCount,
      label: "Hết hàng",
      badgeClass: "badge-phoenix-danger",
      cardClass: "is-out-of-stock",
    };
  }
  if (stockCount <= 2) {
    return {
      stockCount,
      label: "Sắp hết hàng",
      badgeClass: "badge-phoenix-warning",
      cardClass: "is-low-stock",
    };
  }
  return {
    stockCount,
    label: "Còn hàng",
    badgeClass: "badge-phoenix-success",
    cardClass: "is-in-stock",
  };
}

function getPlatingCostLabel(platingCost) {
  if (platingCost == null || !Number.isFinite(platingCost)) return "—";
  return formatMoney(platingCost);
}

test("product SKU card computes stock status correctly", () => {
  // In stock (> 2)
  const inStock = getStockStatus(4);
  assert.equal(inStock.stockCount, 4);
  assert.equal(inStock.label, "Còn hàng");
  assert.equal(inStock.badgeClass, "badge-phoenix-success");
  assert.equal(inStock.cardClass, "is-in-stock");

  // Low stock (1 <= stock <= 2)
  const lowStock = getStockStatus(2);
  assert.equal(lowStock.stockCount, 2);
  assert.equal(lowStock.label, "Sắp hết hàng");
  assert.equal(lowStock.badgeClass, "badge-phoenix-warning");
  assert.equal(lowStock.cardClass, "is-low-stock");

  const lowStock1 = getStockStatus(1);
  assert.equal(lowStock1.stockCount, 1);
  assert.equal(lowStock1.label, "Sắp hết hàng");

  // Out of stock (<= 0)
  const outOfStock = getStockStatus(0);
  assert.equal(outOfStock.stockCount, 0);
  assert.equal(outOfStock.label, "Hết hàng");
  assert.equal(outOfStock.badgeClass, "badge-phoenix-danger");
  assert.equal(outOfStock.cardClass, "is-out-of-stock");

  const negativeStock = getStockStatus(-5);
  assert.equal(negativeStock.stockCount, 0);
  assert.equal(negativeStock.label, "Hết hàng");
});

test("product SKU card formats plating cost correctly", () => {
  assert.equal(getPlatingCostLabel(20000), "20.000 ₫");
  assert.equal(getPlatingCostLabel(0), "0 ₫");
  assert.equal(getPlatingCostLabel(null), "—");
  assert.equal(getPlatingCostLabel(undefined), "—");
});
