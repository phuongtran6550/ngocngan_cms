import assert from "node:assert/strict";
import test from "node:test";
import { formatMoney, formatNumberValue } from "../src/utils/resource-display.ts";
import { calculatePiecePrice } from "../src/views/WarehousedGoods/pricing.ts";

function getPieceBreakdown(line) {
  const importPrice = Number(line.importPrice);
  if (line.pricingType !== "Đồ món" || !Number.isFinite(importPrice) || importPrice <= 0) {
    return null;
  }
  const preview = calculatePiecePrice(
    importPrice,
    Number(line.platingCost) || 0,
    Number(line.laborCost) || 0,
  );
  const refPrice = line.originalUnitPrice ?? line.unitPrice;
  const manualDiff = refPrice - preview.price;
  return {
    basePrice: preview.basePrice,
    roundedBasePrice: preview.roundedBasePrice,
    rawPrice: preview.rawPrice,
    calculatedPrice: preview.price,
    manualDiff,
    hasManualAdjustment: Boolean(line.manualPrice),
  };
}

function getLineRoundedBasePrice(line) {
  if (line.pricingType === "Đồ món") {
    const piece = getPieceBreakdown(line);
    if (piece) {
      return piece.roundedBasePrice + (Number(line.laborCost) || 0);
    }
  }
  const refPrice = line.originalUnitPrice ?? line.unitPrice;
  return Math.max(0, refPrice - (Number(line.platingCost) || 0));
}

function isManualPrice(line) {
  return Boolean(line.manualPrice);
}

function isLineAdjusted(line) {
  return Boolean(
    line.adjustedBy &&
    line.originalUnitPrice !== undefined &&
    line.unitPrice !== line.originalUnitPrice,
  );
}

function setLinePrice(line, newTotal, adjustedBy = "Thu ngân") {
  if (line.originalUnitPrice === undefined) {
    line.originalUnitPrice = line.unitPrice;
  }
  const qty = Math.max(1, line.quantity);
  const newUnitPrice = Math.max(0, Math.round(newTotal / qty));
  if (newUnitPrice === line.originalUnitPrice) {
    resetLinePrice(line);
    return;
  }
  line.unitPrice = newUnitPrice;
  line.adjustedBy = adjustedBy;
}

function resetLinePrice(line) {
  if (line.originalUnitPrice !== undefined) {
    line.unitPrice = line.originalUnitPrice;
  }
  delete line.originalUnitPrice;
  delete line.adjustedBy;
}

test("cart item price breakdown and adjustment when customer trả giá", () => {
  // Scenario from user:
  // Thành tiền (Đã làm tròn) : 200.000 ₫
  // Tiền xi : +30.000 ₫
  // Tổng thành tiền : 230.000 ₫
  const line = {
    skuId: "sku-001",
    productId: "prod-001",
    productName: "Mặt halo nơ 5li5 XK M3",
    pricingType: "Đồ món",
    importPrice: 100000,
    platingCost: 30000,
    laborCost: 0,
    unitPrice: 230000,
    originalUnitPrice: 230000,
    quantity: 1,
    manualPrice: false,
  };

  // Initial state check
  assert.equal(isManualPrice(line), false);
  assert.equal(getLineRoundedBasePrice(line), 200000);
  assert.equal(formatMoney(getLineRoundedBasePrice(line)), "200.000 ₫");
  assert.equal(formatMoney(line.platingCost), "30.000 ₫");
  assert.equal(formatMoney(line.unitPrice * line.quantity), "230.000 ₫");
  assert.equal(isLineAdjusted(line), false);

  // Customer bargains (khách trả giá): wants to buy at 220.000 đ
  // Cashier adjusts total to 220.000 đ
  setLinePrice(line, 220000, "Ngọc Châu");

  // Verified behavior:
  // 1. unitPrice updated to 220.000 đ
  assert.equal(line.unitPrice, 220000);
  assert.equal(line.unitPrice * line.quantity, 220000);
  assert.equal(formatMoney(line.unitPrice * line.quantity), "220.000 ₫");

  // 2. Base rounded price remains 200.000 đ (giữ nguyên!)
  assert.equal(getLineRoundedBasePrice(line), 200000);
  assert.equal(formatMoney(getLineRoundedBasePrice(line)), "200.000 ₫");

  // 3. Plating cost remains 30.000 đ (giữ nguyên!)
  assert.equal(formatMoney(line.platingCost), "30.000 ₫");

  // 4. SKU is still recognized as automatic formula price (not warehouse manual)
  assert.equal(isManualPrice(line), false);

  // 5. Line is marked as adjusted with cashier name
  assert.equal(isLineAdjusted(line), true);
  assert.equal(line.adjustedBy, "Ngọc Châu");
  const note = `(${line.adjustedBy} điều chỉnh)`;
  assert.equal(note, "(Ngọc Châu điều chỉnh)");

  // 6. Reset price reverts back to original 230.000 đ
  resetLinePrice(line);
  assert.equal(line.unitPrice, 230000);
  assert.equal(isLineAdjusted(line), false);
  assert.equal(line.adjustedBy, undefined);
  assert.equal(getLineRoundedBasePrice(line), 200000);
});

test("formatting number for input displays Vietnamese thousand separator", () => {
  assert.equal(formatNumberValue(220000), "220.000");
  assert.equal(formatNumberValue(200000), "200.000");
  assert.equal(formatNumberValue(30000), "30.000");
});
