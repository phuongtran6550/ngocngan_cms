import type { OrderCartLine } from "@/views/Orders/types";

const CART_STORAGE_KEY = "ngocchau.cms2.sales-cart.v1";
const CART_VERSION = 1;

interface StoredCart {
  version: number;
  lines: unknown[];
}

function validLine(value: unknown): value is OrderCartLine {
  const line = value as Partial<OrderCartLine> | null;
  return Boolean(
    line
      && typeof line === "object"
      && typeof line.skuId === "string"
      && line.skuId
      && typeof line.productId === "string"
      && typeof line.productName === "string"
      && typeof line.unitPrice === "number"
      && Number.isFinite(line.unitPrice)
      && line.unitPrice >= 0
      && Number.isInteger(line.stock)
      && Number(line.stock) >= 0
      && Number.isInteger(line.quantity)
      && Number(line.quantity) >= 1
      && (line.status === "active" || line.status === "inactive")
  );
}

export function readStoredCart(storage: Storage = window.localStorage): OrderCartLine[] {
  try {
    const parsed = JSON.parse(storage.getItem(CART_STORAGE_KEY) || "null") as StoredCart | null;
    if (!parsed || parsed.version !== CART_VERSION || !Array.isArray(parsed.lines)) return [];
    return parsed.lines.filter(validLine).map((line) => ({
      ...line,
      quantity: Math.min(line.quantity, Math.max(line.stock, 1)),
    }));
  } catch {
    return [];
  }
}

export function writeStoredCart(
  lines: OrderCartLine[],
  storage: Storage = window.localStorage,
): void {
  try {
    if (!lines.length) {
      storage.removeItem(CART_STORAGE_KEY);
      return;
    }
    storage.setItem(CART_STORAGE_KEY, JSON.stringify({
      version: CART_VERSION,
      lines,
    }));
  } catch {
    // Browser storage is an optimization; checkout and in-memory cart state stay usable without it.
  }
}
