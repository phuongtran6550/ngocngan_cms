<template>
  <section aria-labelledby="silver-price-title">
    <div class="card border shadow-none">
      <div class="card-header bg-transparent border-bottom d-flex flex-wrap align-items-start justify-content-between gap-3 p-4">
        <div>
          <h2 id="silver-price-title" class="fs-7 mb-1">Giá bạc cho sản phẩm Đồ cân</h2>
          <p class="text-body-tertiary fs-10 mb-0">Tự động tính lại giá bán theo trọng lượng và các chi phí của sản phẩm.</p>
        </div>
        <span class="badge badge-phoenix" :class="status?.silverPrice ? 'badge-phoenix-success' : 'badge-phoenix-warning'">
          {{ status?.silverPrice ? 'Đang áp dụng' : 'Chưa thiết lập' }}
        </span>
      </div>

      <div class="card-body p-4">
        <LoadingSkeleton v-if="loading && !status" />
        <template v-else>
          <div class="d-flex flex-wrap align-items-baseline gap-2 mb-4">
            <span class="text-body-secondary">Giá bạc niêm yết hiện tại:</span>
            <strong class="silver-current-price">{{ currentPriceLabel }}</strong>
          </div>

          <form class="silver-update-panel" @submit.prevent="openConfirm">
            <div class="row g-3 align-items-end">
              <div class="col-12 col-lg-7">
                <label class="form-label fw-semibold" for="silver-price-input">Cập nhật giá bạc mới</label>
                <div class="input-group">
                  <input
                    id="silver-price-input"
                    :value="draftPrice"
                    data-testid="silver-price-input"
                    class="form-control"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="Nhập giá bạc"
                    :disabled="loading || submitting"
                    @input="handlePriceInput"
                  />
                  <span class="input-group-text">VNĐ / chỉ</span>
                </div>
              </div>
              <div class="col-12 col-lg-5 d-grid">
                <button
                  data-testid="silver-price-apply"
                  type="submit"
                  class="btn btn-primary"
                  :disabled="!canApply"
                >
                  {{ submitting ? 'Đang áp dụng...' : 'Áp dụng thay đổi giá bạc' }}
                </button>
              </div>
            </div>
          </form>

          <div class="alert alert-subtle-info d-flex gap-2 mt-3 mb-0" role="status">
            <span aria-hidden="true">💡</span>
            <div>
              Khi bấm <strong>“Áp dụng”</strong>, {{ affectedLabel }} sẽ tự động tính lại giá bán theo công thức
              <strong>trọng lượng × giá bạc + tiền công + tiền xi</strong>.
              <template v-if="exampleLabel"> Ví dụ: Dây chuyền 5,6 chỉ · Công 450.000 VNĐ · {{ exampleLabel }}.</template>
            </div>
          </div>

          <div v-if="message" class="alert alert-subtle-success mt-3 mb-0" role="status" tabindex="-1">{{ message }}</div>
          <div v-if="error" class="alert alert-subtle-danger mt-3 mb-0" role="alert" tabindex="-1">{{ error }}</div>
        </template>
      </div>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      title="Xác nhận áp dụng giá bạc"
      :message="confirmMessage"
      confirm-label="Áp dụng giá bạc"
      @cancel="confirmOpen = false"
      @confirm="confirmApply"
    />
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import { apiError } from "@/request";
import { formatNumberValue } from "@/utils/resource-display";
import { silverPriceService } from "@/views/Settings/service";
import type { SilverPriceStatus } from "@/views/Settings/types";

const MAX_SILVER_PRICE = 1_000_000_000;
const EXAMPLE_WEIGHT = 5.6;
const EXAMPLE_LABOR = 450_000;

function parsePrice(value: string): number | null {
  const normalized = value.trim().replace(/[.,_\s]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_SILVER_PRICE ? parsed : null;
}

function formatPriceInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? formatNumberValue(Number(digits)) : "";
}

function examplePrice(silverPrice: number): number {
  return Math.round(EXAMPLE_WEIGHT * silverPrice + EXAMPLE_LABOR);
}

export default defineComponent({
  name: "SilverPriceSection",
  components: { ConfirmDialog, LoadingSkeleton },
  data() {
    return {
      loading: true,
      submitting: false,
      confirmOpen: false,
      error: "",
      message: "",
      draftPrice: "",
      status: null as SilverPriceStatus | null,
    };
  },
  computed: {
    parsedPrice(): number | null {
      return parsePrice(this.draftPrice);
    },
    canApply(): boolean {
      return !this.loading && !this.submitting && this.parsedPrice !== null && this.parsedPrice !== this.status?.silverPrice;
    },
    currentPriceLabel(): string {
      return this.status?.silverPrice ? `${formatNumberValue(this.status.silverPrice)} VNĐ / chỉ` : "Chưa thiết lập";
    },
    affectedLabel(): string {
      return `${this.status?.weightedProductCount || 0} sản phẩm Đồ cân`;
    },
    exampleLabel(): string {
      if (!this.status?.silverPrice || !this.parsedPrice) return "";
      return `Giá cũ ${formatNumberValue(examplePrice(this.status.silverPrice))} VNĐ → Giá mới ${formatNumberValue(examplePrice(this.parsedPrice))} VNĐ`;
    },
    confirmMessage(): string {
      if (!this.parsedPrice) return "Giá bạc mới không hợp lệ.";
      return `Áp dụng ${formatNumberValue(this.parsedPrice)} VNĐ / chỉ và cập nhật giá bán của ${this.affectedLabel}?`;
    },
  },
  mounted() {
    void this.load();
  },
  methods: {
    clearFeedback(): void {
      this.error = "";
      this.message = "";
    },
    handlePriceInput(event: Event): void {
      this.draftPrice = formatPriceInput((event.target as HTMLInputElement).value);
      this.clearFeedback();
    },
    async load(): Promise<void> {
      this.loading = true;
      this.error = "";
      try {
        this.status = await silverPriceService.status();
        if (!this.draftPrice) this.draftPrice = this.status.silverPrice ? formatPriceInput(String(this.status.silverPrice)) : "";
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.loading = false;
      }
    },
    openConfirm(): void {
      if (this.canApply) this.confirmOpen = true;
    },
    async confirmApply(): Promise<void> {
      if (!this.parsedPrice) return;
      const silverPrice = this.parsedPrice;
      this.confirmOpen = false;
      this.submitting = true;
      this.error = "";
      this.message = "";
      try {
        const result = await silverPriceService.apply(silverPrice);
        this.status = {
          silverPrice: result.silverPrice,
          weightedProductCount: this.status?.weightedProductCount || result.updatedCount,
          updatedAt: result.updatedAt,
          updatedBy: result.updatedBy,
        };
        this.draftPrice = formatPriceInput(String(result.silverPrice));
        this.message = `Đã áp dụng giá bạc mới cho ${result.updatedCount} sản phẩm Đồ cân`;
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.submitting = false;
      }
    },
  },
});
</script>

<style scoped>
.silver-current-price { color: var(--phoenix-success); font-size: 1.35rem; }
.silver-update-panel { padding: 1rem; border: 1px solid var(--phoenix-border-color); border-radius: .75rem; background: var(--phoenix-body-highlight-bg); }
</style>
