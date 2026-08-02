<template>
  <div class="row g-3 mb-4" aria-label="Tổng quan danh mục">
    <div v-for="item in cards" :key="item.label" class="col-12 col-sm-6 col-xl-4">
      <div class="card h-100 border shadow-none">
        <div class="card-body p-4">
          <p class="text-uppercase text-body-tertiary fw-bold fs-10 mb-2">{{ item.label }}</p>
          <div class="d-flex align-items-end justify-content-between gap-3">
            <strong class="fs-5 lh-1">{{ loading ? "—" : item.value }}</strong>
            <span class="badge badge-phoenix badge-phoenix-primary">{{ item.caption }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { CategorySummaryData } from "@/views/Categories/types";

export default defineComponent({
  name: "CategorySummary",
  props: {
    summary: { type: Object as PropType<CategorySummaryData>, required: true },
    loading: { type: Boolean, default: false },
  },
  computed: {
    cards() {
      return [
        { label: "Nhóm Đại hoạt động", value: this.summary.activeCategories, caption: "Danh mục" },
        { label: "Nhóm Trung hoạt động", value: this.summary.activeMaterials, caption: "Chất liệu" },
        { label: "Lượt đang sử dụng", value: this.summary.totalUsage, caption: "Sản phẩm" },
      ];
    },
  },
});
</script>
