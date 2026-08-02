import { describe, expect, it } from "vitest";
import { BarcodeCandidateStabilizer } from "@/views/Products/scanner/barcode-candidate";

describe("BarcodeCandidateStabilizer", () => {
  it("accepts the same current barcode twice inside the stability window", () => {
    const stabilizer = new BarcodeCandidateStabilizer();

    expect(stabilizer.observe("10000000", 100)).toBeNull();
    expect(stabilizer.observe("10000000", 500)).toBe("10000000");
  });

  it("accepts legacy barcodes and resets after acceptance", () => {
    const stabilizer = new BarcodeCandidateStabilizer();

    expect(stabilizer.observe("100000000000", 100)).toBeNull();
    expect(stabilizer.observe("100000000000", 200)).toBe("100000000000");
    expect(stabilizer.observe("100000000000", 300)).toBeNull();
  });

  it("resets for invalid different or expired candidates", () => {
    const stabilizer = new BarcodeCandidateStabilizer();

    expect(stabilizer.observe("10000000", 0)).toBeNull();
    expect(stabilizer.observe("20000000", 100)).toBeNull();
    expect(stabilizer.observe("20000000", 1400)).toBeNull();
    expect(stabilizer.observe("invalid", 1500)).toBeNull();
    expect(stabilizer.observe("20000000", 1600)).toBeNull();
  });
});
