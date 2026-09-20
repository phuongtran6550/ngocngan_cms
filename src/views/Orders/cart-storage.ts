import type { CheckoutAttempt, OrderCartLine } from "@/views/Orders/types";

const CART_STORAGE_KEY = "ngocchau.cms2.sales-cart.v1";
const CART_VERSION = 1;

interface StoredCart {
  version: number;
  lines: unknown[];
}

function validLine(value: unknown): value is OrderCartLine {
  const line = value as Partial<OrderCartLine> | null;
  return Boolean(
    line &&
    typeof line === "object" &&
    typeof line.skuId === "string" &&
    line.skuId &&
    typeof line.productId === "string" &&
    typeof line.productName === "string" &&
    typeof line.unitPrice === "number" &&
    Number.isFinite(line.unitPrice) &&
    line.unitPrice >= 0 &&
    Number.isInteger(line.stock) &&
    Number.isInteger(line.quantity) &&
    Number(line.quantity) >= 1 &&
    (line.status === "active" || line.status === "inactive"),
  );
}

export function readStoredCart(
  storage: Storage = window.localStorage,
): OrderCartLine[] {
  try {
    const parsed = JSON.parse(
      storage.getItem(CART_STORAGE_KEY) || "null",
    ) as StoredCart | null;
    if (
      !parsed ||
      parsed.version !== CART_VERSION ||
      !Array.isArray(parsed.lines)
    )
      return [];
    return parsed.lines.filter(validLine);
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
    storage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: CART_VERSION,
        lines,
      }),
    );
  } catch {
    // Browser storage is an optimization; checkout and in-memory cart state stay usable without it.
  }
}

// Keep the immutable request across reloads when its HTTP acknowledgement is lost.
export function readCheckoutAttempt(userId: string): CheckoutAttempt | null {
  const raw = window.sessionStorage.getItem(`ngocchau.checkout.${userId}`);
  if (!raw) return null;
  const value = JSON.parse(raw) as CheckoutAttempt;
  if (
    !value?.key ||
    !value.input?.imageId ||
    !Array.isArray(value.input.items)
  ) {
    throw new Error(
      "Không đọc được yêu cầu đang gửi. Vui lòng kiểm tra danh sách đơn trước khi tiếp tục.",
    );
  }
  return value;
}

export function writeCheckoutAttempt(
  userId: string,
  value: CheckoutAttempt | null,
): void {
  const key = `ngocchau.checkout.${userId}`;
  if (value) window.sessionStorage.setItem(key, JSON.stringify(value));
  else window.sessionStorage.removeItem(key);
}
