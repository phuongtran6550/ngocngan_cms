import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

describe("RevenueChart bundle contract", () => {
  it("uses the modular ECharts build instead of importing the full package", () => {
    const source = readFileSync(
      resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../../../../../src/views/Dashboard/components/RevenueChart.vue",
      ),
      "utf8",
    );

    expect(source).not.toContain('from "echarts"');
    expect(source).not.toContain('import("echarts")');
    expect(source).toContain('"echarts/core"');
    expect(source).toContain('"echarts/charts"');
    expect(source).toContain('"echarts/components"');
    expect(source).toContain('"echarts/renderers"');
  });
});
