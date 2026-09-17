import type { WarehouseSkuFormModel } from "@/views/WarehousedGoods/types";

export interface SkuCodeSource {
  pricingType?: string;
  name?: string;
  category?: string;
  material?: string;
  pattern?: string;
  weight: number;
  size: string;
}

export function ascii(value: unknown): string {
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

export function getMaterialPrefix(name?: string, material?: string): string {
  const normName = ascii(name);

  if (/(?:^|[^A-Z0-9])XV(?=[^A-Z0-9]|N\d+|$)/.test(normName)) {
    return "V";
  }
  if (/(?:^|[^A-Z0-9])XK(?=[^A-Z0-9]|N\d+|$)/.test(normName)) {
    return "K";
  }

  const normMat = ascii(material);
  if (normMat.includes("XI VANG") || normMat.includes("VANG")) {
    return "V";
  }
  if (normMat.includes("XI KIM") || normMat.includes("KIM")) {
    return "K";
  }
  if (normMat.includes("BAC")) {
    return "B";
  }

  if (normMat.trim()) {
    const firstChar = normMat.trim().charAt(0);
    return /[A-Z]/.test(firstChar) ? firstChar : "B";
  }

  return "";
}

export function getNNumber(name?: string): string {
  const normName = ascii(name);
  const match = normName.match(/(?:^|[^A-Z0-9]|XV|XK)N\s*(\d+)(?=[^A-Z0-9]|$)/);
  if (!match) return "";
  return `N${match[1]}`;
}

export function getAbbreviatedName(
  name?: string,
  isPiece?: boolean,
  fallback?: string,
): string {
  const normName = ascii(name);
  if (normName.trim()) {
    let text = normName.replace(
      /(?:^|[^A-Z0-9])(?:XV|XK)(?=[^A-Z0-9]|N\d+|$)/g,
      " ",
    );
    if (isPiece) {
      text = text.replace(/(?:^|[^A-Z0-9])N\s*\d+(?=[^A-Z0-9]|$)/g, " ");
    }
    const tokens = text.match(/[A-Z0-9]+/g) || [];
    const initials = tokens.map((t) => (/\d/.test(t) ? t : t[0])).join("");
    if (initials) return initials;
  }

  const normFallback = ascii(fallback);
  const fallbackTokens = normFallback.match(/[A-Z0-9]+/g) || [];
  return fallbackTokens.map((t) => (/\d/.test(t) ? t : t[0])).join("");
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
  if (value === null || value === undefined || value === "") return "";
  const num = Number(String(value).replace(",", "."));
  if (!Number.isFinite(num) || num <= 0) return "";

  const rounded = Number(num.toFixed(4));
  const str = String(rounded);
  const parts = str.split(".");
  if (parts.length === 1) {
    return `${parts[0]}C`;
  }
  return `${parts[0]}C${parts[1]}`;
}

export function formatSkuSize(value: unknown): string {
  const str = String(value ?? "").trim();
  if (!str) return "";

  const normalized = ascii(str)
    .replace(/\b(?:NI\s*TAY|NI|KICH\s*CO|SIZE)\b/g, "")
    .trim();

  const clean = normalized.replace(/^NI\s*/i, "").trim();
  return clean.replace(/[^A-Z0-9]+/g, "");
}

export function buildSkuCode(source: SkuCodeSource): string {
  const isPiece =
    source.pricingType === "Đồ món" ||
    ascii(source.pricingType).includes("MON");

  const matPrefix = getMaterialPrefix(source.name, source.material);

  let firstPart = matPrefix;
  if (isPiece) {
    const nPart = getNNumber(source.name);
    if (nPart) {
      firstPart = `${matPrefix}${nPart}`;
    }
  }

  const nameAbbr = getAbbreviatedName(
    source.name,
    isPiece,
    source.category || source.pattern,
  );

  const sizePart = formatSkuSize(source.size);
  const weightPart = formatSkuWeight(source.weight);

  const restPart = `${nameAbbr}${sizePart}${weightPart}`;

  if (!firstPart && !restPart) {
    return "";
  }
  if (!firstPart) {
    return restPart;
  }
  if (!restPart) {
    return firstPart;
  }

  return `${firstPart}-${restPart}`;
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
