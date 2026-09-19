<template>
  <nav
    v-if="totalPages > 0"
    class="d-flex flex-wrap align-items-center justify-content-between gap-3"
    aria-label="Phân trang"
  >
    <span class="text-body-tertiary fs-10">
      <span class="fw-semibold">Trang {{ normalizedPage }}</span> / {{ totalPages }}
      <template v-if="total > 0"> · {{ formattedTotal }} bản ghi</template>
    </span>

    <div class="cms-pagination" role="group" aria-label="Điều hướng phân trang">
      <!-- Trang đầu: « -->
      <button
        type="button"
        class="cms-page-btn"
        :disabled="!canGoPrev"
        title="Trang đầu"
        aria-label="Trang đầu"
        @click="goToPage(1)"
      >
        <AppIcon name="chevrons-left" />
      </button>

      <!-- Trang trước: < -->
      <button
        type="button"
        class="cms-page-btn"
        :disabled="!canGoPrev"
        title="Trang trước"
        aria-label="Trang trước"
        @click="goToPage(normalizedPage - 1)"
      >
        <AppIcon name="chevron-left" />
      </button>

      <!-- Dấu ... trước -->
      <button
        v-if="hasPrevEllipsis"
        type="button"
        class="cms-page-ellipsis"
        title="Lùi 5 trang"
        aria-label="Lùi 5 trang"
        @click="goToPage(normalizedPage - 5)"
      >
        ...
      </button>

      <!-- Các số trang -->
      <button
        v-for="p in visiblePages"
        :key="p"
        type="button"
        class="cms-page-btn"
        :class="{ active: p === normalizedPage }"
        :aria-current="p === normalizedPage ? 'page' : undefined"
        @click="goToPage(p)"
      >
        {{ p }}
      </button>

      <!-- Dấu ... sau -->
      <button
        v-if="hasNextEllipsis"
        type="button"
        class="cms-page-ellipsis"
        title="Tiến 5 trang"
        aria-label="Tiến 5 trang"
        @click="goToPage(normalizedPage + 5)"
      >
        ...
      </button>

      <!-- Trang sau: > -->
      <button
        type="button"
        class="cms-page-btn"
        :disabled="!canGoNext"
        title="Trang sau"
        aria-label="Trang sau"
        @click="goToPage(normalizedPage + 1)"
      >
        <AppIcon name="chevron-right" />
      </button>

      <!-- Trang cuối: » -->
      <button
        type="button"
        class="cms-page-btn"
        :disabled="!canGoNext"
        title="Trang cuối"
        aria-label="Trang cuối"
        @click="goToPage(totalPages)"
      >
        <AppIcon name="chevrons-right" />
      </button>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";

export default defineComponent({
  name: "PaginationBar",
  components: {
    AppIcon,
  },
  props: {
    page: { type: Number, default: 1 },
    totalPages: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    maxVisible: { type: Number, default: 5 },
  },
  emits: ["change"],
  computed: {
    normalizedPage(): number {
      if (this.totalPages <= 0) return 1;
      return Math.min(Math.max(1, this.page), this.totalPages);
    },
    formattedTotal(): string {
      return Number(this.total || 0).toLocaleString("vi-VN");
    },
    visiblePages(): number[] {
      const total = this.totalPages;
      const current = this.normalizedPage;
      if (total <= 0) return [];

      const max = Math.max(3, this.maxVisible);
      if (total <= max) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }

      const half = Math.floor(max / 2);
      let start = current - half;
      let end = current + half;

      if (start < 1) {
        start = 1;
        end = max;
      } else if (end > total) {
        end = total;
        start = total - max + 1;
      }

      const list: number[] = [];
      for (let i = start; i <= end; i++) {
        list.push(i);
      }
      return list;
    },
    hasPrevEllipsis(): boolean {
      if (this.visiblePages.length === 0) return false;
      return this.visiblePages[0] > 1;
    },
    hasNextEllipsis(): boolean {
      if (this.visiblePages.length === 0) return false;
      return this.visiblePages[this.visiblePages.length - 1] < this.totalPages;
    },
    canGoPrev(): boolean {
      return this.normalizedPage > 1;
    },
    canGoNext(): boolean {
      return this.normalizedPage < this.totalPages;
    },
  },
  methods: {
    goToPage(targetPage: number) {
      if (this.totalPages <= 0) return;
      const clamped = Math.min(Math.max(1, targetPage), this.totalPages);
      if (clamped !== this.normalizedPage) {
        this.$emit("change", clamped);
      }
    },
  },
});
</script>

<style scoped>
.cms-pagination {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  user-select: none;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.cms-pagination::-webkit-scrollbar {
  display: none;
}

.cms-page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 35px;
  height: 35px;
  padding: 0 8px;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  color: var(--phoenix-body-color, #e2e8f0);
  background-color: transparent;
  border: 1px solid var(--phoenix-border-color, #373e53);
  border-radius: 6px;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease-in-out;
}

:global([data-bs-theme="light"]) .cms-page-btn {
  border-color: #cbd5e1;
  background-color: #ffffff;
  color: #334155;
}

:global([data-bs-theme="dark"]) .cms-page-btn {
  border-color: #3b4256;
  background-color: rgba(255, 255, 255, 0.02);
  color: #e2e8f0;
}

.cms-page-btn:hover:not(:disabled):not(.active) {
  border-color: #f350a0;
  color: #f350a0;
  background-color: rgba(243, 80, 160, 0.08);
}

.cms-page-btn.active {
  background-color: #f350a0;
  border-color: #f350a0;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(243, 80, 160, 0.35);
}

.cms-page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.cms-page-btn :deep(.cms-icon) {
  width: 14px;
  height: 14px;
  stroke-width: 2.2;
}

.cms-page-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 35px;
  padding: 0 2px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--phoenix-secondary-color, #8a94a6);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  transition: color 0.15s ease-in-out;
}

.cms-page-ellipsis:hover {
  color: #f350a0;
}
</style>
