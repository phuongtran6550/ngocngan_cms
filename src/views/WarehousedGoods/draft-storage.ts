import type { WarehouseFormModel } from "@/views/WarehousedGoods/types";
import { emptyWarehouseSku } from "@/views/WarehousedGoods/types";

const DRAFT_STORAGE_KEY = "ngocchau.cms2.warehouse-create-draft.v1";
const DRAFT_VERSION = 1;
let draftWriteVersion = 0;

export interface StoredWarehouseSkuDraft {
  clientId?: string;
  code?: string;
  codeMode?: "auto" | "manual";
  codeSource?: string;
  size?: string;
  weight?: number;
  price?: number;
  laborCost?: number;
  platingCost?: number;
  importPrice?: number | null;
  stock?: number;
  printCount?: number;
}

export interface StoredWarehouseDraftPayload {
  name: string;
  categoryId: string;
  materialId: string;
  patternId: string;
  pricingType: WarehouseFormModel["pricingType"];
  skus: StoredWarehouseSkuDraft[];
  thumbnailBase64?: string | null;
  thumbnailName?: string | null;
  thumbnailType?: string | null;
}

export interface StoredWarehouseDraft {
  version: number;
  savedAt: string;
  data: StoredWarehouseDraftPayload;
}

export interface RestoredWarehouseDraftResult {
  form: WarehouseFormModel;
  savedAt: Date;
}

export function isWarehouseDraftEmpty(form: WarehouseFormModel): boolean {
  if (!form) return true;
  const hasName = Boolean(form.name && form.name.trim());
  const hasCategory = Boolean(form.categoryId);
  const hasMaterial = Boolean(form.materialId);
  const hasPattern = Boolean(form.patternId);
  const hasThumbnail = Boolean(form.thumbnail);
  const hasPricingType = Boolean(form.pricingType);

  const hasCustomSkus =
    form.skus.length > 1 ||
    form.skus.some((sku) => {
      return Boolean(
        (sku.code && sku.code.trim()) ||
          (sku.size && sku.size.trim()) ||
          Number(sku.weight) > 0 ||
          Number(sku.price) > 0 ||
          Number(sku.laborCost) > 0 ||
          Number(sku.platingCost) > 0 ||
          (sku.importPrice !== null && Number(sku.importPrice) > 0) ||
          Number(sku.stock) > 0,
      );
    });

  return (
    !hasName &&
    !hasCategory &&
    !hasMaterial &&
    !hasPattern &&
    !hasThumbnail &&
    !hasPricingType &&
    !hasCustomSkus
  );
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function dataUrlToFile(
  dataUrl: string,
  filename: string,
  mimeType: string,
): File | null {
  try {
    const arr = dataUrl.split(",");
    const bstr = atob(arr[1] || "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
  } catch {
    return null;
  }
}

export async function writeStoredWarehouseDraft(
  form: WarehouseFormModel,
  storage: Storage = window.localStorage,
): Promise<boolean> {
  const writeVersion = ++draftWriteVersion;
  try {
    if (isWarehouseDraftEmpty(form)) {
      storage.removeItem(DRAFT_STORAGE_KEY);
      return false;
    }

    let thumbnailBase64: string | null = null;
    let thumbnailName: string | null = null;
    let thumbnailType: string | null = null;

    if (form.thumbnail instanceof File) {
      thumbnailName = form.thumbnail.name;
      thumbnailType = form.thumbnail.type;
      // Only serialize image if <= 1.5MB to protect LocalStorage quota limits
      if (form.thumbnail.size <= 1.5 * 1024 * 1024) {
        try {
          thumbnailBase64 = await fileToDataUrl(form.thumbnail);
        } catch {
          thumbnailBase64 = null;
        }
      }
    }

    // A newer save or discard invalidates an image read that is still pending.
    if (writeVersion !== draftWriteVersion) return false;

    const payload: StoredWarehouseDraft = {
      version: DRAFT_VERSION,
      savedAt: new Date().toISOString(),
      data: {
        name: form.name || "",
        categoryId: form.categoryId || "",
        materialId: form.materialId || "",
        patternId: form.patternId || "",
        pricingType: form.pricingType || "",
        skus: (form.skus || []).map((sku) => ({
          clientId: sku.clientId,
          code: sku.code || "",
          codeMode: sku.codeMode || "auto",
          codeSource: sku.codeSource || "",
          size: sku.size || "",
          weight: Number(sku.weight) || 0,
          price: Number(sku.price) || 0,
          laborCost: Number(sku.laborCost) || 0,
          platingCost: Number(sku.platingCost) || 0,
          importPrice:
            sku.importPrice === null ? null : Number(sku.importPrice) || 0,
          stock: Number(sku.stock) || 0,
          printCount: Number(sku.printCount) || 0,
        })),
        thumbnailBase64,
        thumbnailName,
        thumbnailType,
      },
    };

    try {
      storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      // Graceful degradation: if QuotaExceededError occurs, save without thumbnailBase64
      if (thumbnailBase64) {
        payload.data.thumbnailBase64 = null;
        try {
          storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  } catch {
    return false;
  }
}

export function readStoredWarehouseDraft(
  storage: Storage = window.localStorage,
): RestoredWarehouseDraftResult | null {
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredWarehouseDraft | null;
    if (!parsed || parsed.version !== DRAFT_VERSION || !parsed.data) return null;

    const d = parsed.data;
    let thumbnail: File | null = null;
    if (d.thumbnailBase64 && d.thumbnailName && d.thumbnailType) {
      thumbnail = dataUrlToFile(
        d.thumbnailBase64,
        d.thumbnailName,
        d.thumbnailType,
      );
    }

    const skus =
      Array.isArray(d.skus) && d.skus.length
        ? d.skus.map((s) =>
            emptyWarehouseSku({
              clientId: s.clientId,
              code: s.code || "",
              codeMode: s.codeMode || "auto",
              codeSource: s.codeSource || "",
              size: s.size || "",
              weight: Number(s.weight) || 0,
              price: Number(s.price) || 0,
              laborCost: Number(s.laborCost) || 0,
              platingCost: Number(s.platingCost) || 0,
              importPrice:
                s.importPrice === null || s.importPrice === undefined
                  ? null
                  : Number(s.importPrice) || 0,
              stock: Number(s.stock) || 0,
              printCount: Number(s.printCount) || 0,
            }),
          )
        : [emptyWarehouseSku()];

    const form: WarehouseFormModel = {
      name: typeof d.name === "string" ? d.name : "",
      categoryId: typeof d.categoryId === "string" ? d.categoryId : "",
      materialId: typeof d.materialId === "string" ? d.materialId : "",
      patternId: typeof d.patternId === "string" ? d.patternId : "",
      pricingType:
        d.pricingType === "Đồ cân" || d.pricingType === "Đồ món"
          ? d.pricingType
          : "",
      skus,
      thumbnail,
    };

    if (isWarehouseDraftEmpty(form)) {
      storage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    return {
      form,
      savedAt: new Date(parsed.savedAt || Date.now()),
    };
  } catch {
    return null;
  }
}

export function clearStoredWarehouseDraft(
  storage: Storage = window.localStorage,
): void {
  draftWriteVersion += 1;
  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Storage access can be restricted in private browser modes
  }
}

export function formatDraftSavedTime(date: Date): string {
  try {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  } catch {
    return "";
  }
}
