export const CURRENT_INVENTORY_BARCODE_PATTERN = /^\d{8}$/;
export const LEGACY_INVENTORY_BARCODE_PATTERN = /^\d{12}$/;
export const INVENTORY_BARCODE_PATTERN = /^(?:\d{8}|\d{12})$/;

export function isInventoryBarcode(value: unknown): value is string {
  return typeof value === "string" && INVENTORY_BARCODE_PATTERN.test(value);
}

export function isCurrentInventoryBarcode(value: unknown): value is string {
  return (
    typeof value === "string" &&
    CURRENT_INVENTORY_BARCODE_PATTERN.test(value)
  );
}
