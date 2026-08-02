export interface SilverPriceStatus {
  silverPrice: number | null;
  weightedProductCount: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SilverPriceApplyResult {
  previousSilverPrice: number | null;
  silverPrice: number;
  updatedCount: number;
  updatedAt: string | null;
  updatedBy: string | null;
}
