<template>
  <div class="revenue-chart">
    <div v-show="hasData" ref="chart" class="revenue-chart__canvas w-100" role="img" :aria-label="ariaLabel" />
    <div v-if="!hasData" class="revenue-chart__empty text-center" role="status">
      <span class="revenue-chart__empty-icon"><AppIcon name="pie-chart" /></span>
      <strong class="d-block mt-3 mb-1">Chưa có giao dịch trong kỳ</strong>
      <span class="text-body-tertiary fs-10">Biểu đồ sẽ xuất hiện khi có đơn hoàn tất hoặc đổi trả.</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { EChartsType } from "echarts/core";
import AppIcon from "@/components/ui/AppIcon.vue";
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
  components: { AppIcon },
  props: {
    series: { type: Array as PropType<DashboardSeriesPoint[]>, default: () => [] },
    ariaLabel: { type: String, default: "Biểu đồ doanh thu theo ngày" },
  },
  data() { return { chart: null as EChartsType | null, disposed: false }; },
  computed: {
    hasData(): boolean {
      return this.series.some((point) => point.sales || point.returns || point.net || point.orders);
    },
  },
  watch: { series: { deep: true, handler() { void this.renderChart(); } } },
  mounted() { window.addEventListener("resize", this.resize); void this.renderChart(); },
  beforeUnmount() { this.disposed = true; window.removeEventListener("resize", this.resize); this.chart?.dispose(); },
  methods: {
    resize(): void { this.chart?.resize(); },
    async renderChart(): Promise<void> {
      if (!this.hasData) {
        this.chart?.clear();
        return;
      }
      await this.$nextTick();
      const element = this.$refs.chart as HTMLElement | undefined;
      if (!element) return;
      const echarts = await loadEChartsCore();
      if (this.disposed) return;
      this.chart ||= echarts.init(element);
      this.chart.setOption({
        animationDuration: 450,
        color: ["#3874ff", "#e5780b", "#00a76f"],
        tooltip: {
          trigger: "axis",
          valueFormatter: (value: unknown) => `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)} ₫`,
        },
        legend: { data: ["Bán", "Đổi trả", "Thực thu"] },
        grid: { left: 14, right: 14, top: 44, bottom: 16, containLabel: true },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: this.series.map((point) => point.date.slice(5).split("-").reverse().join("/")),
        },
        yAxis: {
          type: "value",
          axisLabel: {
            formatter: (value: string | number) => new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(Number(value) || 0),
          },
        },
        series: [
          { name: "Bán", type: "line", smooth: true, areaStyle: { opacity: 0.08 }, data: this.series.map((point) => point.sales) },
          { name: "Đổi trả", type: "line", smooth: true, data: this.series.map((point) => point.returns) },
          { name: "Thực thu", type: "line", smooth: true, data: this.series.map((point) => point.net) },
        ],
      }, { notMerge: true });
    },
  },
});
</script>

<style scoped>
.revenue-chart__canvas,
.revenue-chart__empty {
  min-height: 22rem;
}

.revenue-chart__empty {
  display: grid;
  align-content: center;
  justify-items: center;
  padding: 2rem;
  border-radius: 0.75rem;
  background: linear-gradient(145deg, var(--phoenix-body-highlight-bg), transparent);
}

.revenue-chart__empty-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 50%;
  color: var(--phoenix-primary);
  background: var(--phoenix-primary-bg-subtle);
}
</style>
