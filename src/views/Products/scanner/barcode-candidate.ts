import { isInventoryBarcode } from "@/utils/inventory-barcode";

const DEFAULT_STABILITY_WINDOW_MS = 1_200;

export class BarcodeCandidateStabilizer {
  private candidate = "";
  private observedAt = 0;
  private observations = 0;

  constructor(
    private readonly windowMs: number = DEFAULT_STABILITY_WINDOW_MS,
  ) {}

  observe(value: unknown, now: number): string | null {
    const barcode = String(value || "").trim();
    if (!isInventoryBarcode(barcode)) {
      this.reset();
      return null;
    }

    const sameCandidate = barcode === this.candidate;
    const insideWindow = now - this.observedAt <= this.windowMs;
    if (sameCandidate && insideWindow) {
      this.observations += 1;
    } else {
      this.candidate = barcode;
      this.observations = 1;
    }
    this.observedAt = now;

    if (this.observations < 2) return null;
    this.reset();
    return barcode;
  }

  reset(): void {
    this.candidate = "";
    this.observedAt = 0;
    this.observations = 0;
  }
}
