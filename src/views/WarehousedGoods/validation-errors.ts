import type { ApiErrorShape } from "@/request";

const PRODUCT_FIELDS = new Set([
  "name",
  "thumbnail",
  "categoryId",
  "materialId",
  "patternId",
  "pricingType",
]);

const SKU_FIELDS = new Set([
  "code",
  "size",
  "weight",
  "price",
  "laborCost",
  "platingCost",
  "importPrice",
  "stock",
]);

const IMAGE_ERROR_CODES = new Set([
  "IMAGE_REQUIRED",
  "INVALID_IMAGE_TYPE",
  "INVALID_IMAGE_CONTENT",
  "IMAGE_TOO_LARGE",
]);

function errorMessage(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "msg" in value) {
    return String(value.msg || "").trim();
  }
  return "";
}

function fieldKey(value: string): string {
  const key = value.replace(/\[(\d+)\]/g, ".$1");
  if (PRODUCT_FIELDS.has(key)) return key;

  const sku = key.match(/^skus\.(\d+)\.([A-Za-z]+)$/);
  if (sku && SKU_FIELDS.has(sku[2])) return `skus.${sku[1]}.${sku[2]}`;
  if (sku?.[2] === "codeMode") return `skus.${sku[1]}.code`;

  if (SKU_FIELDS.has(key)) return `skus.0.${key}`;
  if (key === "code") return "skus.0.code";
  return "";
}

export function warehouseValidationErrors(
  error: ApiErrorShape,
): Record<string, string> {
  const result: Record<string, string> = {};
  const apiFields = { ...(error.details || {}), ...(error.errors || {}) };
  Object.entries(apiFields).forEach(([rawKey, rawMessage]) => {
    const key = fieldKey(rawKey);
    const message = errorMessage(rawMessage);
    if (key && message) result[key] = message;
  });

  if (error.code && IMAGE_ERROR_CODES.has(error.code)) {
    result.thumbnail = error.message;
  }
  return result;
}
