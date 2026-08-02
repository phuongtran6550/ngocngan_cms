import type { WarehouseSkuFormModel } from "@/views/WarehousedGoods/types";

export interface SkuCodeSource {
  category: string;
  material: string;
  pattern: string;
  weight: number;
  size: string;
}

function ascii(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase();
}

export function normalizeSkuCode(value: unknown): string {
  return ascii(value)
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function abbreviateSkuPart(value: unknown): string {
  const tokens = ascii(value).match(/[A-Z0-9]+/g) || [];
  if (!tokens.length) return "";

  const numbered = tokens.filter((token) => /\d/.test(token));
  const words = tokens.filter((token) => !/\d/.test(token));
  if (numbered.length) {
    const initials = words
      .map((word) => word[0])
      .join("")
      .slice(0, 3);
    return `${initials}${numbered.join("")}`;
  }
  if (words.length === 1) return words[0].slice(0, 2);
  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 3);
}

export function formatSkuWeight(value: unknown): string {
  const weight = Number(value);
  if (!Number.isFinite(weight) || weight <= 0) return "";
  return `${String(weight).replace(".", "P")}C`;
}

export function formatSkuSize(value: unknown): string {
  const normalized = ascii(value).trim();
  if (!normalized) return "";
  const numeric = normalized.match(/\d+(?:[.,]\d+)?/);
  if (numeric) return `N${numeric[0].replace(/[.,]/g, "P")}`;

  return normalizeSkuCode(
    normalized
      .replace(/\bNI\s*TAY\b/g, "")
      .replace(/\bKICH\s*CO\b/g, "")
      .replace(/\bSIZE\b/g, ""),
  ).replace(/-/g, "");
}

export function buildSkuCode(source: SkuCodeSource): string {
  return [
    abbreviateSkuPart(source.category),
    abbreviateSkuPart(source.material),
    abbreviateSkuPart(source.pattern),
    formatSkuWeight(source.weight),
    formatSkuSize(source.size),
  ]
    .filter(Boolean)
    .join("-");
}

function availableCode(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix <= 9999; suffix += 1) {
    const candidate = `${base}-${String(suffix).padStart(2, "0")}`;
    if (!used.has(candidate)) return candidate;
  }
  return base;
}

export function suggestSkuCodes(
  skus: WarehouseSkuFormModel[],
  context: Omit<SkuCodeSource, "weight" | "size">,
): WarehouseSkuFormModel[] {
  const used = new Set(
    skus
      .filter((sku) => sku.codeMode === "manual")
      .map((sku) => normalizeSkuCode(sku.code))
      .filter(Boolean),
  );

  return skus.map((sku) => {
    if (sku.codeMode === "manual") return sku;
    const base = buildSkuCode({
      ...context,
      weight: sku.weight,
      size: sku.size,
    });
    if (!base) return { ...sku, code: "", codeSource: "" };
    const codeSource = availableCode(base, used);
    const code =
      sku.codeSource === codeSource && normalizeSkuCode(sku.code)
        ? normalizeSkuCode(sku.code)
        : codeSource;
    used.add(codeSource);
    used.add(code);
    return { ...sku, code, codeSource };
  });
}
