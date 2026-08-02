<template><div ref="chart" class="w-100" style="min-height: 22rem;" role="img" aria-label="Biểu đồ doanh thu 30 ngày" /></template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { EChartsType } from "echarts/core";
import type { DashboardSeriesPoint } from "@/views/Dashboard/types";

let echartsModulePromise: Promise<typeof import("echarts/core")> | null = null;

async function loadEChartsCore(): Promise<typeof import("echarts/core")> {
  if (!echartsModulePromise) {
    echartsModulePromise = Promise.all([
      import("echarts/core"),
      import("echarts/charts"),
      import("echarts/components"),
      import("echarts/renderers"),
    ]).then(([core, charts, components, renderers]) => {
      core.use([
        charts.LineChart,
        components.GridComponent,
        components.LegendComponent,
        components.TooltipComponent,
        renderers.CanvasRenderer,
      ]);
      return core;
    });
  }

  return echartsModulePromise;
}

export default defineComponent({
  name: "RevenueChart",
  props: { series: { type: Array as PropType<DashboardSeriesPoint[]>, default: () => [] } },
  data() { return { chart: null as EChartsType | null, disposed: false }; },
  watch: { series: { deep: true, handler() { void this.renderChart(); } } },
  mounted() { window.addEventListener("resize", this.resize); void this.renderChart(); },
  beforeUnmount() { this.disposed = true; window.removeEventListener("resize", this.resize); this.chart?.dispose(); },
  methods: {
    resize(): void { this.chart?.resize(); },
    async renderChart(): Promise<void> {
      const element = this.$refs.chart as HTMLElement | undefined;
      if (!element) return;
      const echarts = await loadEChartsCore();
      if (this.disposed) return;
      this.chart ||= echarts.init(element);
      this.chart.setOption({
        animationDuration: 450,
        color: ["#3874ff", "#e5780b", "#00a76f"],
        tooltip: { trigger: "axis" },
        legend: { data: ["Bán", "Đổi trả", "Thực thu"] },
        grid: { left: 14, right: 14, top: 44, bottom: 16, containLabel: true },
        xAxis: { type: "category", boundaryGap: false, data: this.series.map((point) => point.date.slice(5)) },
        yAxis: { type: "value" },
        series: [
          { name: "Bán", type: "line", smooth: true, areaStyle: { opacity: 0.08 }, data: this.series.map((point) => point.sales) },
          { name: "Đổi trả", type: "line", smooth: true, data: this.series.map((point) => point.returns) },
          { name: "Thực thu", type: "line", smooth: true, data: this.series.map((point) => point.net) },
        ],
      });
    },
  },
});
</script>
