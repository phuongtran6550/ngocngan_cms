<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="modalTitleId"
      data-testid="warehouse-sku-modal"
    >
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <form class="modal-content shadow-lg border-translucent" @submit.prevent="submit">
          <div class="modal-header border-bottom border-translucent px-4 py-3">
            <div class="d-flex align-items-center gap-2 min-w-0">
              <span class="sku-modal-icon d-inline-flex align-items-center justify-content-center" aria-hidden="true">
                <AppIcon name="tag" />
              </span>
              <div class="min-w-0">
                <h3 :id="modalTitleId" class="modal-title fs-7 mb-0">
                  {{ isEdit ? "Cập nhật SKU" : "Thêm SKU mới" }}
                </h3>
                <p class="fs-10 text-body-tertiary mb-0 text-truncate">
                  {{ isEdit ? (draft.code || "SKU") : product.name }} · {{ product.pricingType || "Hàng hóa" }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              :disabled="submitting"
              @click="$emit('cancel')"
            />
          </div>

          <div class="modal-body p-4 p-lg-5">
            <div
              v-if="localError || error"
              class="alert alert-subtle-danger d-flex align-items-center justify-content-between mb-4 shadow-sm"
              role="alert"
            >
              <div class="d-flex align-items-center gap-2">
                <AppIcon name="alert-circle" class="flex-shrink-0 text-danger" />
                <span>{{ localError || error }}</span>
              </div>
              <button
                type="button"
                class="btn-close"
                aria-label="Đóng"
                @click="clearError"
              />
            </div>

            <div class="row g-4">
              <div class="col-12 col-lg-7">
                <div class="row g-3">
                  <!-- Mã SKU -->
                  <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <label class="form-label fs-9 fw-bold mb-0" for="sku-modal-code">
                        Mã SKU <span class="text-danger">*</span>
                      </label>
                      <span
                        v-if="draft.codeMode === 'auto'"
                        class="badge badge-phoenix badge-phoenix-info fs-10"
                      >
                        Tự động sinh mã
                      </span>
                      <span
                        v-else
                        class="badge badge-phoenix badge-phoenix-warning fs-10"
                      >
                        Tự nhập mã
                      </span>
                    </div>
                    <div class="input-group">
                      <input
                        id="sku-modal-code"
                        class="form-control font-monospace text-uppercase"
                        :class="{
                          'is-invalid': hasFieldError('code'),
                          'bg-body-tertiary': draft.codeMode === 'auto',
                        }"
                        :value="draft.code"
                        :readonly="draft.codeMode === 'auto'"
                        :placeholder="
                          draft.codeMode === 'auto'
                            ? 'Tự tạo từ phân loại và quy cách'
                            : 'Nhập mã SKU tùy chỉnh'
                        "
                        maxlength="100"
                        required
                        :disabled="submitting"
                        :aria-invalid="hasFieldError('code') ? 'true' : undefined"
                        @input="updateCode"
                        @blur="handleCodeBlur"
                      />
                      <button
                        type="button"
                        class="btn btn-phoenix-secondary"
                        :disabled="submitting"
                        @click="toggleCodeMode"
                      >
                        <AppIcon
                          :name="draft.codeMode === 'auto' ? 'edit' : 'refresh'"
                          class="me-1"
                        />
                        {{ draft.codeMode === "auto" ? "Tự nhập mã" : "Tạo tự động" }}
                      </button>
                    </div>
                    <FieldError id="sku-modal-code-err" :message="fieldError('code')" />
                    <small class="text-body-tertiary fs-10">
                      {{
                        draft.codeMode === "auto"
                          ? "Tự động ghép phân loại sản phẩm, trọng lượng và ni tay."
                          : "Mã SKU do bạn tự điều chỉnh, không bị tự động ghi đè khi đổi quy cách."
                      }}
                    </small>
                  </div>

                  <!-- Ni tay -->
                  <div class="col-12 col-sm-6">
                    <label class="form-label fs-9 fw-bold" for="sku-modal-size">
                      Kích cỡ / Ni tay
                    </label>
                    <input
                      id="sku-modal-size"
                      class="form-control"
                      :class="{ 'is-invalid': hasFieldError('size') }"
                      :value="draft.size"
                      placeholder="Ví dụ: Ni 12"
                      maxlength="50"
                      :disabled="submitting"
                      :aria-invalid="hasFieldError('size') ? 'true' : undefined"
                      @input="updateSize"
                      @blur="checkSkuCodeAvailability"
                    />
                    <FieldError id="sku-modal-size-err" :message="fieldError('size')" />
                  </div>

                  <!-- Trọng lượng -->
                  <div class="col-12 col-sm-6">
                    <label class="form-label fs-9 fw-bold" for="sku-modal-weight">
                      Trọng lượng chỉ <span v-if="isWeighted" class="text-danger">*</span>
                    </label>
                    <div class="input-group">
                      <input
                        id="sku-modal-weight"
                        class="form-control"
                        :class="{ 'is-invalid': hasFieldError('weight') }"
                        type="number"
                        inputmode="decimal"
                        :min="isWeighted ? 0.01 : 0"
                        step="0.01"
                        :value="draft.weight || ''"
                        placeholder="0"
                        :required="isWeighted"
                        :disabled="submitting"
                        :aria-invalid="hasFieldError('weight') ? 'true' : undefined"
                        @input="updateWeight"
                        @blur="checkSkuCodeAvailability"
                      />
                      <span class="input-group-text">chỉ</span>
                    </div>
                    <FieldError id="sku-modal-weight-err" :message="fieldError('weight')" />
                  </div>

                  <!-- Tồn kho -->
                  <div class="col-12 col-sm-6">
                    <label class="form-label fs-9 fw-bold" for="sku-modal-stock">
                      Tồn kho <span class="text-danger">*</span>
                    </label>
                    <input
                      id="sku-modal-stock"
                      class="form-control"
                      :class="{ 'is-invalid': hasFieldError('stock') }"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      step="1"
                      :value="draft.stock"
                      required
                      :disabled="submitting"
                      :aria-invalid="hasFieldError('stock') ? 'true' : undefined"
                      @input="updateStock"
                    />
                    <FieldError id="sku-modal-stock-err" :message="fieldError('stock')" />
                  </div>

                  <!-- Tiền công -->
                  <div class="col-12 col-sm-6">
                    <label class="form-label fs-9 fw-bold" for="sku-modal-labor-cost">
                      Tiền công
                    </label>
                    <MoneyInput
                      id="sku-modal-labor-cost"
                      name="laborCost"
                      :model-value="draft.laborCost"
                      :disabled="submitting"
                      :invalid="hasFieldError('laborCost')"
                      @update:model-value="updateLaborCost"
                    />
                    <FieldError id="sku-modal-labor-cost-err" :message="fieldError('laborCost')" />
                  </div>

                  <!-- Tiền xi -->
                  <div class="col-12 col-sm-6">
                    <label class="form-label fs-9 fw-bold" for="sku-modal-plating-cost">
                      Tiền xi
                    </label>
                    <MoneyInput
                      id="sku-modal-plating-cost"
                      name="platingCost"
                      :model-value="draft.platingCost"
                      :disabled="submitting"
                      :invalid="hasFieldError('platingCost')"
                      @update:model-value="updatePlatingCost"
                    />
                    <FieldError id="sku-modal-plating-cost-err" :message="fieldError('platingCost')" />
                  </div>

                  <div v-if="isWeighted || isPiece" class="col-12 form-check ms-2">
                    <input
                      id="sku-modal-manual-price"
                      class="form-check-input"
                      type="checkbox"
                      :checked="draft.manualPrice"
                      :disabled="submitting"
                      @change="updateManualPrice"
                    />
                    <label class="form-check-label" for="sku-modal-manual-price">
                      Nhập giá bán thủ công
                    </label>
                  </div>

                  <!-- Trường tính tiền cho Đồ cân -->
                  <template v-if="isWeighted">

                    <div class="col-12">
                      <label class="form-label fs-9 fw-bold" for="sku-modal-selling-price">
                        {{ draft.manualPrice ? "Giá bán" : "Giá bán sau làm tròn" }}
                      </label>
                      <MoneyInput
                        v-if="draft.manualPrice"
                        id="sku-modal-selling-price"
                        name="price"
                        :model-value="draft.price"
                        :disabled="submitting"
                        :invalid="hasFieldError('price')"
                        described-by="sku-modal-selling-price-err"
                        required
                        @update:model-value="updatePrice"
                      />
                      <div v-else class="input-group input-group-lg selling-price-input">
                        <input
                          id="sku-modal-selling-price"
                          class="form-control fw-bold"
                          type="text"
                          :value="formatMoney(draft.price)"
                          readonly
                        />
                        <span class="input-group-text">₫</span>
                      </div>
                      <FieldError id="sku-modal-selling-price-err" :message="fieldError('price')" />
                      <small class="text-body-tertiary fs-10">
                        {{ draft.manualPrice
                          ? "Giữ nguyên giá đã nhập, kể cả khi giá bạc thay đổi."
                          : "Tự động tính từ ((Giá bạc × Trọng lượng) + Tiền công) sau làm tròn + Tiền xi." }}
                      </small>
                    </div>
                  </template>

                  <!-- Trường tính tiền cho Đồ món -->
                  <template v-if="isPiece">
                    <div class="col-12 col-sm-6">
                      <label class="form-label fs-9 fw-bold" for="sku-modal-import-price">
                        Giá nhập <span class="text-danger">*</span>
                      </label>
                      <MoneyInput
                        id="sku-modal-import-price"
                        name="importPrice"
                        :model-value="draft.importPrice"
                        :disabled="submitting"
                        :invalid="hasFieldError('importPrice')"
                        required
                        @update:model-value="updatePieceImportPrice"
                      />
                      <FieldError id="sku-modal-import-price-err" :message="fieldError('importPrice')" />
                      <small class="text-body-tertiary fs-10">
                        Nhập giá nhập để hệ thống tự tính giá bán.
                      </small>
                    </div>

                    <div class="col-12 col-sm-6">
                      <label class="form-label fs-9 fw-bold" for="sku-modal-piece-price">
                        Giá bán <span class="text-danger">*</span>
                      </label>
                      <MoneyInput
                        id="sku-modal-piece-price"
                        name="price"
                        :model-value="draft.price"
                        :disabled="submitting || !draft.manualPrice"
                        :invalid="hasFieldError('price')"
                        required
                        @update:model-value="updatePrice"
                      />
                      <FieldError id="sku-modal-piece-price-err" :message="fieldError('price')" />
                      <small class="text-body-tertiary fs-10">
                        {{ draft.manualPrice ? "Giữ nguyên giá bán đã nhập." : "Tự động tính theo giá nhập, tiền công và tiền xi." }}
                      </small>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Cột phải: Formula Preview Card -->
              <div class="col-12 col-lg-5">
                <aside class="pricing-formula h-100 rounded-3 p-3 p-lg-4">
                  <div class="d-flex align-items-center gap-2 mb-3">
                    <span class="formula-icon d-inline-flex align-items-center justify-content-center" aria-hidden="true">
                      <AppIcon name="calculator" />
                    </span>
                    <div>
                      <h5 class="fs-9 mb-0">Cách tính giá SKU</h5>
                      <p class="fs-10 text-body-tertiary mb-0">Chi phí tạo nên giá bán</p>
                      <code class="pricing-sku-code mt-1">
                        {{ draft.code || "Chưa có mã SKU" }}
                      </code>
                    </div>
                  </div>

                  <div v-if="draft.manualPrice" class="formula-total">
                    <span>Giá bán thủ công áp dụng</span>
                    <strong>{{ formatMoney(draft.price) }}</strong>
                  </div>
                  <div
                    v-else-if="isWeighted && !hasSilverPrice"
                    class="alert alert-subtle-warning fs-9 mb-0"
                    role="status"
                  >
                    Chưa cấu hình giá bạc hiện tại. Vui lòng cập nhật tại trang Cài đặt.
                  </div>
                  <template v-else>
                    <dl class="formula-list mb-3">
                      <template v-if="isWeighted">
                        <div>
                          <dt>Giá Bạc</dt>
                          <dd>{{ formatMoney(silverPrice) }}</dd>
                        </div>
                        <div>
                          <dt>Trọng lượng</dt>
                          <dd>{{ draft.weight || 0 }} chỉ</dd>
                        </div>
                        <div>
                          <dt>Tiền công</dt>
                          <dd>{{ formatMoney(draft.laborCost) }}</dd>
                        </div>
                        <hr class="sku-definition-divider my-2" />
                        <div>
                          <dt>CT (Trọng lượng * Giá bạc) + Tiền công</dt>
                          <dd>{{ formatMoney(weightedPreview.basePrice) }}</dd>
                        </div>
                        <div :class="{ 'formula-subtotal': !draft.platingCost || draft.platingCost <= 0 }">
                          <dt>Thành tiền (Đã làm tròn)</dt>
                          <dd>{{ formatMoney(weightedPreview.roundedBasePrice) }}</dd>
                        </div>
                        <template v-if="draft.platingCost > 0">
                          <div>
                            <dt>Tiền Xi</dt>
                            <dd>{{ formatMoney(draft.platingCost) }}</dd>
                          </div>
                          <div class="formula-subtotal">
                            <dt>Thành tiền</dt>
                            <dd>{{ formatMoney(weightedPreview.price) }}</dd>
                          </div>
                        </template>
                      </template>
                      <template v-else-if="isPiece">
                        <div>
                          <dt>Giá nhập</dt>
                          <dd>{{ formatMoney(draft.importPrice) }}</dd>
                        </div>
                        <div>
                          <dt>Giá nhân đôi</dt>
                          <dd>{{ formatMoney((Number(draft.importPrice) || 0) * 2) }}</dd>
                        </div>
                        <div>
                          <dt>Mức giảm</dt>
                          <dd>{{ pieceDiscountLabel }}</dd>
                        </div>
                        <div>
                          <dt>Tiền hàng tạm tính</dt>
                          <dd>{{ formatMoney(piecePreview.basePrice) }}</dd>
                        </div>
                        <div>
                          <dt>Tiền hàng làm tròn</dt>
                          <dd>{{ formatMoney(piecePreview.roundedBasePrice) }}</dd>
                        </div>
                        <div>
                          <dt>Tiền xi</dt>
                          <dd>{{ formatMoney(draft.platingCost) }}</dd>
                        </div>
                        <div>
                          <dt>Tiền công</dt>
                          <dd>{{ formatMoney(draft.laborCost) }}</dd>
                        </div>
                      </template>
                    </dl>
                    <div class="formula-total">
                      <span>Giá bán áp dụng</span>
                      <strong>{{ formatMoney(draft.price) }}</strong>
                    </div>
                  </template>
                </aside>
              </div>
            </div>
          </div>

          <div class="modal-footer border-top border-translucent px-4 py-3 flex-column align-items-stretch">
            <div
              v-if="localError || error"
              class="alert alert-subtle-danger d-flex align-items-center justify-content-between mb-2 py-2 px-3 fs-9 w-100 shadow-sm"
              role="alert"
            >
              <div class="d-flex align-items-center gap-2 min-w-0">
                <AppIcon name="alert-circle" class="flex-shrink-0 text-danger" />
                <span class="text-break">{{ localError || error }}</span>
              </div>
              <button
                type="button"
                class="btn-close"
                aria-label="Đóng"
                @click="clearError"
              />
            </div>
            <div class="d-flex justify-content-end gap-2 w-100">
              <button
                type="button"
                class="btn btn-phoenix-secondary"
                :disabled="submitting"
                @click="$emit('cancel')"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="btn btn-primary px-4"
                :disabled="submitting"
              >
                <span
                  v-if="submitting"
                  class="spinner-border spinner-border-sm me-1"
                  aria-hidden="true"
                />
                <AppIcon v-else :name="isEdit ? 'check' : 'plus'" class="me-1" />
                {{ isEdit ? "Lưu thay đổi" : "Thêm SKU" }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    <button
      v-if="open"
      type="button"
      class="modal-backdrop fade show border-0 p-0"
      aria-label="Đóng"
      @click="$emit('cancel')"
    />
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import MoneyInput from "@/components/Form/MoneyInput.vue";
import FieldError from "@/components/Form/FieldError.vue";
import { createOverlayBehavior } from "@/components/overlay/behavior";
import { formatMoney } from "@/utils/resource-display";
import {
  calculatePiecePrice,
  calculateWeightedPrice,
} from "@/views/WarehousedGoods/pricing";
import { warehouseService } from "@/views/WarehousedGoods/service";
import { request } from "@/request";
import type { CategoryGroup } from "@/views/Categories/types";
import { normalizeSkuCode, suggestSkuCodes } from "@/views/WarehousedGoods/sku-code";
import {
  emptyWarehouseSku,
  type WarehouseItem,
  type WarehouseSku,
  type WarehouseSkuFormModel,
} from "@/views/WarehousedGoods/types";

function copySku(source?: WarehouseSku | null): WarehouseSkuFormModel {
  if (!source) {
    return emptyWarehouseSku({
      codeMode: "auto",
    });
  }
  return {
    clientId: source.id || `sku-${Date.now()}`,
    id: source.id || undefined,
    code: source.code || "",
    codeMode: "manual",
    codeSource: source.code || "",
    size: source.size || "",
    weight: Number(source.weight) || 0,
    price: Number(source.price) || 0,
    manualPrice: source.manualPrice ?? false,
    laborCost: Number(source.laborCost) || 0,
    platingCost: Number(source.platingCost) || 0,
    importPrice: source.importPrice === null || source.importPrice === undefined
      ? null
      : Number(source.importPrice),
    stock: Number(source.stock) || 0,
    printCount: Number(source.printCount) || 0,
  };
}

export default defineComponent({
  name: "WarehouseSkuModal",
  components: { AppIcon, FieldError, MoneyInput },
  props: {
    open: { type: Boolean, default: false },
    sku: { type: Object as PropType<WarehouseSku | null>, default: null },
    product: { type: Object as PropType<WarehouseItem>, required: true },
    silverPrice: { type: Number as PropType<number | null>, default: null },
    roundingMarks: {
      type: Object as PropType<{ piece: number[]; weighted: number[] } | null>,
      default: null,
    },
    existingCodes: { type: Array as PropType<string[]>, default: () => [] },
    submitting: { type: Boolean, default: false },
    error: { type: String, default: "" },
  },
  emits: ["cancel", "submit"],
  data() {
    return {
      draft: copySku(this.sku),
      localError: "",
      fieldErrors: {} as Record<string, string>,
      categoryGroups: [] as CategoryGroup[],
      overlay: createOverlayBehavior(() => this.$emit("cancel")),
      skuCodeCheckController: null as AbortController | null,
    };
  },
  computed: {
    isEdit(): boolean {
      return Boolean(this.sku?.id);
    },
    modalTitleId(): string {
      return this.isEdit ? "warehouse-sku-modal-edit" : "warehouse-sku-modal-new";
    },
    isWeighted(): boolean {
      return this.product.pricingType === "Đồ cân";
    },
    isPiece(): boolean {
      return this.product.pricingType === "Đồ món";
    },
    hasSilverPrice(): boolean {
      return Number(this.silverPrice) > 0;
    },
    hasValidSilverPrice(): boolean {
      return Number(this.silverPrice) > 0;
    },
    silverValue(): number {
      return Math.round((Number(this.silverPrice) || 0) * (Number(this.draft.weight) || 0));
    },
    silverCost(): number {
      return Math.round((Number(this.silverPrice) || 0) * (Number(this.draft.weight) || 0));
    },
    weightedPreview(): ReturnType<typeof calculateWeightedPrice> {
      return calculateWeightedPrice({
        weight: Number(this.draft.weight) || 0,
        silverPrice: Number(this.silverPrice) || 0,
        laborCost: Number(this.draft.laborCost) || 0,
        platingCost: Number(this.draft.platingCost) || 0,
        customMarks: this.roundingMarks?.weighted,
      });
    },
    piecePreview(): ReturnType<typeof calculatePiecePrice> {
      return calculatePiecePrice(
        Number(this.draft.importPrice) || 0,
        Number(this.draft.platingCost) || 0,
        Number(this.draft.laborCost) || 0,
        this.roundingMarks?.piece,
      );
    },
    rawPrice(): number {
      if (this.isWeighted) {
        return this.weightedPreview.rawPrice;
      }
      if (this.isPiece) {
        return this.piecePreview.rawPrice;
      }
      return 0;
    },
    pieceDiscountLabel(): string {
      const discount = this.piecePreview.discountRate;
      const percentage = Math.round(discount * 100);
      return percentage ? `giảm ${percentage}%` : "không giảm";
    },
  },
  watch: {
    open: {
      immediate: true,
      async handler(isOpen: boolean) {
        this.overlay.sync(isOpen);
        if (isOpen) {
          this.localError = "";
          this.fieldErrors = {};
          this.draft = copySku(this.sku);
          await this.fetchCategoryGroups();
          if (!this.isEdit && this.draft.codeMode === "auto") {
            this.applySuggestedCode();
          }
          this.recalculatePrice();
        }
      },
    },
    sku(newSku) {
      if (this.open) {
        this.draft = copySku(newSku);
        this.recalculatePrice();
      }
    },
    silverPrice() {
      if (this.open) this.recalculatePrice();
    },
    error(newVal: string) {
      if (newVal) {
        this.scrollToError();
      }
    },
  },
  beforeUnmount() {
    this.overlay.dispose();
    this.skuCodeCheckController?.abort();
  },
  methods: {
    async fetchCategoryGroups(): Promise<void> {
      if (!this.product?.categoryId) {
        this.categoryGroups = [];
        return;
      }
      try {
        const { data } = await request.get<{
          item?: { id: string; groups?: CategoryGroup[] };
          groups?: CategoryGroup[];
        }>(`/categories/${this.product.categoryId}`);
        const item = data?.item || data;
        this.categoryGroups = Array.isArray(item?.groups) ? item.groups : [];
      } catch {
        this.categoryGroups = [];
      }
    },
    formatMoney(val: number | null | undefined): string {
      return formatMoney(val ?? 0);
    },
    hasFieldError(field: string): boolean {
      return Boolean(this.fieldErrors[field]);
    },
    fieldError(field: string): string {
      return this.fieldErrors[field] || "";
    },
    clearFieldError(field: string): void {
      if (this.fieldErrors[field]) {
        const { [field]: _removed, ...rest } = this.fieldErrors;
        this.fieldErrors = rest;
      }
      this.localError = "";
    },
    applySuggestedCode(): void {
      if (this.draft.codeMode === "manual") return;
      const context = {
        pricingType: this.product.pricingType,
        name: this.product.name,
        category: this.product.category,
        categoryGroups: this.categoryGroups,
        material: this.product.material,
        pattern: this.product.pattern,
      };
      const [suggested] = suggestSkuCodes([this.draft], context);
      if (suggested?.code) {
        this.draft.code = suggested.code;
        this.draft.codeSource = suggested.codeSource;
      }
    },
    recalculatePrice(): void {
      if (this.isWeighted) this.draft.importPrice = null;
      if (this.draft.manualPrice) return;
      if (this.isWeighted) this.draft.price = this.weightedPreview.price;
      else if (this.isPiece) this.draft.price = this.piecePreview.price;
    },
    updateManualPrice(event: Event): void {
      this.clearFieldError("price");
      this.draft.manualPrice = (event.target as HTMLInputElement).checked;
      this.recalculatePrice();
    },
    updatePrice(value: number | null): void {
      this.clearFieldError("price");
      this.draft.price = value ?? 0;
    },
    updateCode(e: Event): void {
      this.clearFieldError("code");
      const val = (e.target as HTMLInputElement).value;
      this.draft.code = val;
      this.draft.codeMode = "manual";
      this.draft.codeSource = "";
    },
    async handleCodeBlur(): Promise<void> {
      this.draft.code = normalizeSkuCode(this.draft.code);
      await this.checkSkuCodeAvailability();
    },
    async toggleCodeMode(): Promise<void> {
      if (this.draft.codeMode === "auto") {
        this.clearFieldError("code");
        this.draft.codeMode = "manual";
        this.draft.codeSource = "";
        await this.$nextTick();
        const el = document.getElementById("sku-modal-code");
        if (el instanceof HTMLInputElement) {
          el.focus();
          el.select();
        }
      } else {
        await this.regenerateCode();
      }
    },
    async regenerateCode(): Promise<void> {
      this.clearFieldError("code");
      this.draft.codeMode = "auto";
      this.draft.codeSource = "";
      this.applySuggestedCode();
      await this.checkSkuCodeAvailability();
    },
    updateSize(e: Event): void {
      this.clearFieldError("size");
      this.draft.size = (e.target as HTMLInputElement).value;
      if (this.draft.codeMode === "auto") {
        this.applySuggestedCode();
      }
    },
    updateWeight(e: Event): void {
      this.clearFieldError("weight");
      const val = (e.target as HTMLInputElement).value;
      this.draft.weight = val === "" ? 0 : Number(val);
      if (this.draft.codeMode === "auto") {
        this.applySuggestedCode();
      }
      this.recalculatePrice();
    },
    updateStock(e: Event): void {
      this.clearFieldError("stock");
      const val = (e.target as HTMLInputElement).value;
      this.draft.stock = val === "" ? 0 : Math.trunc(Number(val));
    },
    updateLaborCost(val: number | null): void {
      this.clearFieldError("laborCost");
      this.draft.laborCost = val ?? 0;
      this.recalculatePrice();
    },
    updatePlatingCost(val: number | null): void {
      this.clearFieldError("platingCost");
      this.draft.platingCost = val ?? 0;
      this.recalculatePrice();
    },
    updatePieceImportPrice(val: number | null): void {
      this.clearFieldError("importPrice");
      this.clearFieldError("price");
      this.draft.importPrice = val;
      this.recalculatePrice();
      if (this.draft.codeMode === "auto") this.applySuggestedCode();
    },
    async checkSkuCodeAvailability(): Promise<void> {
      const code = normalizeSkuCode(this.draft.code);
      if (!code) return;
      if (this.isEdit && code === normalizeSkuCode(this.sku?.code)) return;

      this.skuCodeCheckController?.abort();
      const controller = new AbortController();
      this.skuCodeCheckController = controller;
      try {
        const response = await warehouseService.checkSkuCodes([{ code }], controller.signal);
        const suggested = response.items?.[0]?.code;
        if (suggested && suggested !== code) {
          this.draft.code = suggested;
        }
      } catch {
        // Silently skip if aborted or network issue
      } finally {
        if (this.skuCodeCheckController === controller) {
          this.skuCodeCheckController = null;
        }
      }
    },
    validate(): boolean {
      this.fieldErrors = {};
      this.localError = "";

      const code = normalizeSkuCode(this.draft.code);
      if (!code) {
        this.fieldErrors.code = "Mã SKU là bắt buộc";
      } else if (code.length > 100) {
        this.fieldErrors.code = "Mã SKU không được vượt quá 100 ký tự";
      } else {
        // Check duplicate within the same product
        const originalCode = normalizeSkuCode(this.sku?.code);
        const isDuplicate = this.existingCodes.some((c) => {
          const norm = normalizeSkuCode(c);
          return norm === code && (!this.isEdit || norm !== originalCode);
        });
        if (isDuplicate) {
          this.fieldErrors.code = `Mã SKU "${code}" đã tồn tại trong sản phẩm này`;
        }
      }

      if (this.isWeighted) {
        if (!(Number(this.draft.weight) > 0)) {
          this.fieldErrors.weight = "Trọng lượng chỉ phải lớn hơn 0";
        }
      } else if (Number(this.draft.weight) < 0) {
        this.fieldErrors.weight = "Trọng lượng chỉ không được âm";
      }

      if (!Number.isInteger(this.draft.stock)) {
        this.fieldErrors.stock = "Tồn kho phải là số nguyên";
      }

      if (Number(this.draft.platingCost) < 0) {
        this.fieldErrors.platingCost = "Tiền xi không được âm";
      }

      if (this.isWeighted) {
        if (!this.draft.manualPrice && !this.hasSilverPrice) {
          this.localError = "Chưa cấu hình giá bạc hiện tại. Không thể tính giá đồ cân.";
        }
      } else if (this.isPiece) {
        if (!(Number(this.draft.importPrice) > 0)) {
          this.fieldErrors.importPrice = "Giá nhập phải lớn hơn 0";
        }
        if (!(Number(this.draft.price) > 0)) {
          this.fieldErrors.price = "Giá bán phải lớn hơn 0";
        }
      }

      if (this.draft.manualPrice && !(Number.isFinite(this.draft.price) && this.draft.price > 0)) {
        this.fieldErrors.price = "Giá bán phải lớn hơn 0";
      }
      const hasFieldErrors = Object.keys(this.fieldErrors).length > 0;
      if (hasFieldErrors && !this.localError) {
        const firstKey = Object.keys(this.fieldErrors)[0];
        this.localError = this.fieldErrors[firstKey] || "Thông tin SKU chưa hợp lệ. Vui lòng kiểm tra các trường bị lỗi.";
      }

      return !hasFieldErrors && !this.localError;
    },
    clearError(): void {
      this.localError = "";
    },
    scrollToError(): void {
      this.$nextTick(() => {
        const modalBody = this.$el?.querySelector?.(".modal-body") as HTMLElement | null;
        if (modalBody) {
          modalBody.scrollTo({ top: 0, behavior: "smooth" });
        }
        const firstInvalid = this.$el?.querySelector?.(".is-invalid, [aria-invalid='true']") as HTMLElement | null;
        firstInvalid?.focus?.();
      });
    },
    submit(): void {
      if (!this.validate()) {
        this.scrollToError();
        return;
      }
      this.draft.code = normalizeSkuCode(this.draft.code);
      this.$emit("submit", { ...this.draft });
    },
  },
});
</script>

<style scoped>
.sku-modal-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--phoenix-primary-subtle);
  color: var(--phoenix-primary);
}

.pricing-formula {
  background: var(--phoenix-body-highlight-bg);
  border: 1px solid var(--phoenix-border-color-translucent);
}

.formula-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: rgba(240, 171, 0, 0.15);
  color: #c17b00;
}

.pricing-sku-code {
  display: inline-block;
  padding: 0.2rem 0.45rem;
  border: 1px solid rgba(240, 171, 0, 0.28);
  border-radius: 0.4rem;
  color: var(--phoenix-warning-text-emphasis);
  background: rgba(240, 171, 0, 0.1);
  font-size: 0.72rem;
  font-weight: 800;
}

.formula-list > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.45rem 0;
  font-size: 0.78rem;
  border-bottom: 1px dashed rgba(82, 91, 117, 0.18);
}

.formula-list dt {
  color: var(--phoenix-tertiary-color);
  font-weight: 600;
}

.formula-list dd {
  margin: 0;
  color: var(--phoenix-emphasis-color);
  font-weight: 700;
  text-align: right;
}

.formula-list .formula-subtotal {
  padding-top: 0.7rem;
  border-bottom: 0;
}

.sku-definition-divider {
  border: 0;
  border-top: 1px dashed rgba(82, 91, 117, 0.28);
  margin: 0.45rem 0;
}

.formula-total {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  color: #fff;
  background: linear-gradient(135deg, #8a5a00, #c17b00);
}

.formula-total span {
  font-size: 0.7rem;
  opacity: 0.78;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.formula-total strong {
  font-size: 1.2rem;
}

.selling-price-input .form-control {
  color: var(--phoenix-warning-text-emphasis);
  background: var(--phoenix-emphasis-bg);
}
</style>
