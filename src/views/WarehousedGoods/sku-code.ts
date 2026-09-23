import type { CategoryGroup } from "@/views/Categories/types";
import type { WarehouseSkuFormModel } from "@/views/WarehousedGoods/types";

export interface SkuCodeSource {
  pricingType?: string;
  name?: string;
  category?: string;
  categoryGroups?: CategoryGroup[];
  material?: string;
  pattern?: string;
  weight: number;
  size: string;
  price?: number;
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

  if (/(?:^|[^A-Z0-9])XV(?=[^A-Z0-9]|$)/.test(normName)) {
    return "V";
  }
  if (/(?:^|[^A-Z0-9])(?:XK|VK)(?=[^A-Z0-9]|$)/.test(normName)) {
    return "K";
  }

  const normMat = ascii(material);
  if (normMat.includes("XI VANG") || normMat.includes("VANG")) {
    return "V";
  }
  if (normMat.includes("XI KIM") || normMat.includes("VANG KIM") || normMat.includes("KIM")) {
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
  const match = normName.match(/(?:^|[^A-Z0-9]|XV|XK|VK)N\s*(\d+)(?=[^A-Z0-9]|$)/);
  if (!match) return "";
  return `N${match[1]}`;
}

export function getAbbreviatedName(
  name?: string,
  _isPiece?: boolean,
  fallback?: string,
): string {
  const normName = ascii(name).trim();
  if (normName) {
    // Trong tên chỉ loại bỏ: XV, VK, XK, N1, N2, N3, N4, N5, N6, N7, N8, N9
    let text = normName;
    for (let i = 0; i < 3; i++) {
      text = text.replace(
        /(?:^|[^A-Z0-9])(?:XV|VK|XK|N\s*[1-9]|N\s*\d+)(?=[^A-Z0-9]|XV|VK|XK|N\s*[1-9]|$)/gi,
        " ",
      );
    }
    text = text.trim();

    // Còn lại giữ nguyên viết tắt, nếu là số thì viết toàn bộ số đó ra
    const tokens = text.match(/[A-Z]+|\d+/g) || [];
    if (tokens.length) {
      return tokens
        .map((token) => {
          if (/^\d+$/.test(token)) {
            return token;
          }
          return token[0];
        })
        .join("");
    }
  }

  const normFallback = ascii(fallback).trim();
  if (normFallback) {
    const fallbackTokens = normFallback.match(/[A-Z]+|\d+/g) || [];
    return fallbackTokens
      .map((token) => (/^\d+$/.test(token) ? token : token[0]))
      .join("");
  }

  return "";
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

export function matchCategoryGroup(
  groups?: CategoryGroup[],
  price?: number,
): CategoryGroup | null {
  if (!Array.isArray(groups) || !groups.length) return null;
  const num = Number(price) || 0;
  for (const group of groups) {
    const from = Number(group.fromPrice) || 0;
    const to = Number(group.toPrice) || 0;
    if (to > 0) {
      if (num >= from && num <= to) return group;
    } else {
      if (num >= from) return group;
    }
  }
  return null;
}

export function formatGroupName(name?: string): string {
  if (!name) return "";
  const norm = ascii(name).trim();
  const stripped = norm.replace(/^NHOM\s*/i, "N").replace(/[^A-Z0-9]/g, "");
  if (/^\d+$/.test(stripped)) {
    return `N${stripped}`;
  }
  return stripped;
}

export function buildSkuCode(source: SkuCodeSource): string {
  const isPiece =
    source.pricingType === "Đồ món" ||
    ascii(source.pricingType).includes("MON");

  const matPrefix = getMaterialPrefix(source.name, source.material);

  // Đồ món: lấy mã nhóm theo khoảng giá danh mục và ghép trước dấu "-" (ví dụ: VN7-...)
  const groupPart = isPiece
    ? (() => {
        const matchedGroup = matchCategoryGroup(
          source.categoryGroups,
          source.price,
        );
        return matchedGroup ? formatGroupName(matchedGroup.name) : "";
      })()
    : "";

  const firstPart = isPiece ? `${matPrefix}${groupPart}` : matPrefix;

  const nameAbbr = getAbbreviatedName(
    source.name,
    isPiece,
    source.category || source.pattern,
  );

  const sizePart = formatSkuSize(source.size);
  const weightPart = isPiece ? "" : formatSkuWeight(source.weight);

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
  context: Omit<SkuCodeSource, "weight" | "size" | "price">,
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
      price: sku.price,
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
