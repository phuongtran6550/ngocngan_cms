<template>
  <div class="product-detail-page">
    <LoadingSkeleton v-if="loading" />
    <div
      v-else-if="pageError && !item"
      class="alert alert-subtle-danger"
      role="alert"
    >
      {{ pageError }}
    </div>
    <template v-else-if="item">
      <PageHeader
        :title="item.name"
        :breadcrumbs="breadcrumbs"
      >
        <template #actions>
          <RouterLink
            class="btn btn-sm btn-phoenix-secondary"
            to="/warehoused-goods"
          >
            <AppIcon name="arrow-left" class="me-sm-2" />
            <span class="d-none d-sm-inline">Danh sách</span>
          </RouterLink>
          <RouterLink
            v-if="
              $route.query.created === '1' &&
              auth.can(permissions.warehouseCreate)
            "
            class="btn btn-sm btn-phoenix-secondary"
            data-testid="create-another-product"
            to="/warehoused-goods/create"
          >
            <AppIcon name="plus" class="me-sm-2" />
            <span class="d-none d-sm-inline">Thêm mới</span>
          </RouterLink>
          <RouterLink
            v-if="auth.can(permissions.warehouseUpdate)"
            class="btn btn-sm btn-primary"
            data-testid="edit-warehouse-product"
            :to="`/warehoused-goods/${item.id}/edit`"
          >
            <AppIcon name="edit" class="me-sm-2" />
            <span class="d-none d-sm-inline">Cập nhật</span>
          </RouterLink>
          <button
            v-if="auth.can(permissions.warehouseDelete)"
            type="button"
            class="btn btn-sm btn-phoenix-danger"
            @click="deleteOpen = true"
          >
            <AppIcon name="trash-2" class="me-sm-2" />
            <span class="d-none d-sm-inline">Xóa</span>
          </button>
        </template>
      </PageHeader>

      <div
        v-if="$route.query.created === '1'"
        class="alert alert-subtle-success d-flex align-items-center gap-2"
        role="status"
      >
        <span class="product-created-mark" aria-hidden="true">✓</span>
        Đã thêm hàng nhập kho thành công. Nút “Thêm mới” chỉ xuất hiện trong lần
        chuyển trang này.
      </div>
      <div
        v-if="$route.query.updated === '1'"
        class="alert alert-subtle-success"
        role="status"
      >
        Đã cập nhật hàng nhập kho
      </div>
      <div v-if="pageError" class="alert alert-subtle-danger" role="alert">
        {{ pageError }}
      </div>
      <div
        v-if="printError"
        ref="printErrorAlert"
        class="alert alert-subtle-danger"
        role="alert"
        tabindex="-1"
        data-testid="print-label-error"
      >
        {{ printError }}
      </div>
      <div
        v-if="printSuccess"
        class="alert alert-subtle-success"
        role="status"
        data-testid="print-label-success"
      >
        {{ printSuccess }}
      </div>

      <div class="product-detail-main">
          <div class="product-hero">
            <div
              class="product-media-frame border border-translucent rounded-3 bg-body-emphasis"
            >
              <ResourceImageCard
                :src="assetUrl(item.thumbnail)"
                :alt="`Ảnh sản phẩm ${item.name}`"
                @preview="preview = assetUrl(item.thumbnail)"
              />
            </div>
            <div class="product-intro">
              <div class="product-intro-label">Thông tin sản phẩm</div>
              <h2 class="product-intro-name">{{ item.name }}</h2>
              <p
                class="product-price fw-bold text-body-emphasis mb-1"
                data-testid="product-price-range"
              >
                {{ summary.price }}
              </p>
              <p
                class="text-success fw-semibold mb-0"
                data-testid="product-total-stock"
              >
                Còn {{ summary.stock }} sản phẩm trong kho
              </p>
              <div class="product-classification">
                <span v-if="item.category">{{ item.category }}</span>
                <span v-if="item.material">{{ item.material }}</span>
                <span v-if="item.pattern">{{ item.pattern }}</span>
                <span v-if="item.pricingType" class="pricing-type">
                  {{ item.pricingType }}
                </span>
              </div>
              <dl class="product-inline-summary mb-0">
                <div>
                  <dt>Số SKU</dt>
                  <dd>{{ summary.skuCount }}</dd>
                </div>
                <div>
                  <dt>Giá từ</dt>
                  <dd>{{ compactPrice(minimumSellingPrice) }}</dd>
                </div>
              </dl>
              <div class="product-print-note mt-3 p-3 rounded-2">
                Tem trang sức 28 x 12 mm x 2, đuôi 30 mm, tối ưu cho máy GoDEX
                G500. Tem được gửi trực tiếp đến máy in, không qua hộp thoại in
                của trình duyệt.
              </div>
            </div>
          </div>

          <div class="sku-title-row">
            <div>
              <h2>Danh sách SKU</h2>
              <p>
                Mỗi dòng đủ khoảng thở; trên mobile tự chuyển thành thẻ hai cột.
              </p>
            </div>
            <span class="sku-count">
              {{ summary.skuCount }} SKU
            </span>
          </div>

          <div class="sku-table-wrap">
            <table
              class="sku-table"
              :class="{ 'sku-table-weighted': isWeighted }"
            >
              <thead>
                <tr>
                  <th scope="col">SKU</th>
                  <th scope="col">Ni tay</th>
                  <th scope="col" class="sku-numeric">Trọng lượng</th>
                  <th v-if="isWeighted" scope="col" class="sku-numeric">
                    Tiền công
                  </th>
                  <th v-if="isWeighted" scope="col" class="sku-numeric">
                    Tiền xi
                  </th>
                  <th v-else scope="col" class="sku-numeric">Giá nhập</th>
                  <th scope="col" class="sku-numeric">Giá bán</th>
                  <th scope="col" class="sku-numeric">Tồn kho</th>
                  <th
                    scope="col"
                    class="sku-numeric"
                    data-testid="sku-actions-heading"
                  >
                    <span class="visually-hidden">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(sku, index) in displaySkus"
                  :key="sku.id || index"
                  data-testid="desktop-sku-row"
                >
                  <td>
                    <code class="sku-code-cell">{{ sku.code || "—" }}</code>
                    <span class="sku-code-sub">
                      SKU {{ String(index + 1).padStart(2, "0") }} ·
                      {{ item.pricingType || "—" }}
                    </span>
                  </td>
                  <td>{{ sku.size || "—" }}</td>
                  <td class="sku-numeric">
                    {{ weight(sku.weight) }}
                  </td>
                  <td v-if="isWeighted" class="sku-numeric">
                    {{ money(sku.laborCost) }}
                  </td>
                  <td v-if="isWeighted" class="sku-numeric">
                    {{ money(sku.platingCost) }}
                  </td>
                  <td v-else class="sku-numeric">
                    {{ money(sku.importPrice) }}
                  </td>
                  <td class="sku-numeric sku-sale-price">
                    {{ money(sku.price) }}
                  </td>
                  <td class="sku-numeric" :data-testid="`sku-stock-${index}`">
                    <span class="sku-stock-value">{{ sku.stock }}</span>
                  </td>
                  <td class="sku-numeric">
                    <div class="sku-row-actions">
                      <RouterLink
                        v-if="sku.id"
                        class="sku-history-action"
                        :to="`/products/${sku.id}#history`"
                        :aria-label="`Xem lịch sử SKU ${sku.code}`"
                      >
                        <AppIcon name="history" />
                        Lịch sử
                      </RouterLink>
                      <button
                        type="button"
                        class="sku-print-action"
                        data-testid="print-sku-label"
                        :aria-label="
                          printingSkuId === sku.id
                            ? `Đang gửi tem ${sku.code}`
                            : `In tem ${sku.code}`
                        "
                        :aria-busy="printingSkuId === sku.id"
                        :disabled="Boolean(printingSkuId)"
                        @click="openPrintDialog(sku)"
                      >
                        <span
                          v-if="printingSkuId === sku.id"
                          class="spinner-border spinner-border-sm"
                          aria-hidden="true"
                        />
                        <span v-else aria-hidden="true">▥</span>
                        {{ printingSkuId === sku.id ? "Đang gửi" : "In tem" }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mobile-sku-list gap-3">
            <article
              v-for="(sku, index) in displaySkus"
              :key="`mobile-${sku.id || index}`"
              class="card shadow-none border border-translucent"
              data-testid="mobile-sku-card"
            >
              <div class="card-body p-3">
                <div
                  class="d-flex align-items-start justify-content-between gap-3 pb-3 border-bottom border-translucent"
                >
                  <div class="min-w-0">
                    <code class="sku-code-cell text-break">
                      {{ sku.code || "—" }}
                    </code>
                    <span class="sku-code-sub">
                      SKU {{ String(index + 1).padStart(2, "0") }} ·
                      {{ item.pricingType || "—" }}
                    </span>
                  </div>
                  <div class="sku-row-actions flex-shrink-0">
                    <RouterLink
                      v-if="sku.id"
                      class="sku-history-action"
                      :to="`/products/${sku.id}#history`"
                      :aria-label="`Xem lịch sử SKU ${sku.code}`"
                    >
                      <AppIcon name="history" />
                      Lịch sử
                    </RouterLink>
                    <button
                      type="button"
                      class="sku-print-action"
                      data-testid="print-sku-label"
                      :aria-label="
                        printingSkuId === sku.id
                          ? `Đang gửi tem ${sku.code}`
                          : `In tem ${sku.code}`
                      "
                      :aria-busy="printingSkuId === sku.id"
                      :disabled="Boolean(printingSkuId)"
                      @click="openPrintDialog(sku)"
                    >
                      <span
                        v-if="printingSkuId === sku.id"
                        class="spinner-border spinner-border-sm"
                        aria-hidden="true"
                      />
                      <span v-else aria-hidden="true">▥</span>
                      {{ printingSkuId === sku.id ? "Đang gửi" : "In tem" }}
                    </button>
                  </div>
                </div>

                <dl class="mobile-sku-grid mb-0 mt-3">
                  <div>
                    <dt>Ni tay</dt>
                    <dd>{{ sku.size || "—" }}</dd>
                  </div>
                  <div>
                    <dt>Trọng lượng</dt>
                    <dd>{{ weight(sku.weight) }}</dd>
                  </div>
                  <template v-if="isWeighted">
                    <div>
                      <dt>Tiền công</dt>
                      <dd>{{ money(sku.laborCost) }}</dd>
                    </div>
                    <div>
                      <dt>Tiền xi</dt>
                      <dd>{{ money(sku.platingCost) }}</dd>
                    </div>
                  </template>
                  <div v-else>
                    <dt>Giá nhập</dt>
                    <dd>{{ money(sku.importPrice) }}</dd>
                  </div>
                  <div>
                    <dt>Giá bán</dt>
                    <dd class="text-body-emphasis fw-bold">
                      {{ money(sku.price) }}
                    </dd>
                  </div>
                  <div>
                    <dt>Tồn kho</dt>
                    <dd>{{ sku.stock }} sản phẩm</dd>
                  </div>
                </dl>
              </div>
            </article>
          </div>
      </div>
    </template>

    <PrintLabelDialog
      :open="Boolean(printSku)"
      :sku-code="printSku?.code || ''"
      :model-value="printQuantity"
      :busy="Boolean(printingSkuId)"
      :error="printDialogError"
      @update:model-value="updatePrintQuantity"
      @cancel="closePrintDialog"
      @confirm="confirmPrintLabel"
    />

    <ConfirmDialog
      :open="deleteOpen"
      title="Xóa hàng nhập kho"
      message="Mặt hàng nhập kho và toàn bộ SKU liên quan sẽ bị xóa."
      confirm-label="Xóa hàng nhập kho"
      @cancel="deleteOpen = false"
      @confirm="remove"
    />
    <ImagePreview
      :src="preview"
      :alt="item?.name || 'Ảnh sản phẩm'"
      @close="preview = ''"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { PERMISSIONS } from "@/config/permissions";
import ImagePreview from "@/components/media/ImagePreview.vue";
import ResourceImageCard from "@/components/media/ResourceImageCard.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import { apiError, assetUrl } from "@/request";
import PrintLabelDialog from "@/views/WarehousedGoods/components/PrintLabelDialog.vue";
import { isInventoryBarcode } from "@/views/WarehousedGoods/inventory-barcode";
import { productSkuSummary } from "@/views/WarehousedGoods/product-summary";
import { warehouseService } from "@/views/WarehousedGoods/service";
import type {
  WarehouseItem,
  WarehouseSku,
} from "@/views/WarehousedGoods/types";
import { authenStore } from "@/stores/app-authen";
import { formatMoney } from "@/utils/resource-display";

const decimalFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 3,
});

export default defineComponent({
  name: "WarehouseDetailPage",
  components: {
    AppIcon,
    ConfirmDialog,
    ImagePreview,
    LoadingSkeleton,
    PageHeader,
    PrintLabelDialog,
    ResourceImageCard,
  },
  data() {
    return {
      item: null as WarehouseItem | null,
      loading: true,
      deleteOpen: false,
      error: "",
      preview: "",
      printingSkuId: "",
      printError: "",
      printSuccess: "",
      printSku: null as WarehouseSku | null,
      printQuantity: "1",
      printDialogError: "",
    };
  },
  computed: {
    permissions() {
      return PERMISSIONS;
    },
    auth() {
      return authenStore();
    },
    breadcrumbs(): Array<{ label: string; to?: string }> {
      return [
        { label: "Hàng nhập kho", to: "/warehoused-goods" },
        { label: "Chi tiết hàng nhập kho" },
      ];
    },
    pageError(): string {
      return this.error;
    },
    isWeighted(): boolean {
      return this.item?.pricingType === "Đồ cân";
    },
    displaySkus(): WarehouseSku[] {
      return this.item?.skus || [];
    },
    summary() {
      return productSkuSummary(this.displaySkus);
    },
    minimumSellingPrice(): number | null {
      const prices = this.displaySkus
        .map((sku) => Number(sku.price))
        .filter(Number.isFinite);
      return prices.length ? Math.min(...prices) : null;
    },
  },
  mounted() {
    void this.load();
  },
  methods: {
    assetUrl,
    money(value: number | null): string {
      return formatMoney(value);
    },
    weight(value: number): string {
      return Number.isFinite(value)
        ? `${decimalFormatter.format(value)} chỉ`
        : "—";
    },
    compactPrice(value: number | null): string {
      if (value === null) return "—";
      if (Math.abs(value) >= 1_000_000) {
        return `${decimalFormatter.format(value / 1_000_000)}TR`;
      }
      if (Math.abs(value) >= 1_000) {
        return `${decimalFormatter.format(value / 1_000)}K`;
      }
      return decimalFormatter.format(value);
    },
    async focusPrintError(): Promise<void> {
      await this.$nextTick();
      const alert = this.$refs.printErrorAlert as HTMLElement | undefined;
      alert?.focus();
    },
    async openPrintDialog(sku: WarehouseSku): Promise<void> {
      if (!this.item || this.printingSkuId) return;
      if (!isInventoryBarcode(sku.barcode)) {
        this.printError =
          `SKU ${sku.code || "không xác định"} chưa có barcode hợp lệ.`;
        this.printSuccess = "";
        await this.focusPrintError();
        return;
      }
      if (!sku.id) {
        this.printError =
          `SKU ${sku.code || "không xác định"} chưa có định danh hợp lệ.`;
        this.printSuccess = "";
        await this.focusPrintError();
        return;
      }

      this.printError = "";
      this.printSuccess = "";
      this.printDialogError = "";
      this.printQuantity = "1";
      this.printSku = sku;
    },
    updatePrintQuantity(value: string | number): void {
      this.printQuantity = String(value);
      if (this.printDialogError) this.printDialogError = "";
    },
    closePrintDialog(): void {
      if (this.printingSkuId) return;
      this.printSku = null;
      this.printQuantity = "1";
      this.printDialogError = "";
    },
    async confirmPrintLabel(): Promise<void> {
      const sku = this.printSku;
      if (!this.item || !sku || this.printingSkuId) return;
      const rawQuantity = this.printQuantity.trim();
      const quantity = Number(rawQuantity);
      if (
        !/^\d+$/.test(rawQuantity) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        this.printDialogError = "Số lượng tem phải là số nguyên từ 1 đến 100";
        return;
      }

      this.printDialogError = "";
      this.printingSkuId = sku.id;
      try {
        const result = await warehouseService.printLabel(
          this.item.id,
          sku.id,
          quantity,
        );
        if (!result.queued) {
          throw new Error("Máy chủ không xác nhận lệnh in");
        }
        const job = result.jobId ? ` (${result.jobId})` : "";
        const printedQuantity = result.quantity || quantity;
        this.printSuccess =
          `Đã gửi ${printedQuantity} tem SKU ${sku.code || "không xác định"} đến ` +
          `${result.printer || "GoDEX G500"}${job}.`;
        this.printSku = null;
        this.printQuantity = "1";
      } catch (error) {
        const normalized = apiError(error);
        this.printDialogError =
          normalized.status && normalized.status < 500
            ? normalized.message
            : `Không thể gửi tem SKU ${sku.code || "không xác định"} đến máy in GoDEX G500.`;
      } finally {
        this.printingSkuId = "";
      }
    },
    async load(): Promise<void> {
      this.loading = true;
      this.error = "";
      try {
        this.item = await warehouseService.detail(
          String(this.$route.params.id),
        );
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.loading = false;
      }
    },
    async remove(): Promise<void> {
      if (!this.item) return;
      this.deleteOpen = false;
      this.error = "";
      try {
        await warehouseService.remove(this.item.id);
        await this.$router.replace("/warehoused-goods");
      } catch (error) {
        this.error = apiError(error).message;
      }
    },
  },
});
</script>

<style scoped>
.product-detail-page,
.product-detail-main {
  min-width: 0;
}

.product-detail-page {
  container-type: inline-size;
}

.product-created-mark {
  display: inline-grid;
  width: 1.375rem;
  height: 1.375rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--phoenix-success);
  font-size: 0.75rem;
  font-weight: 800;
}

.product-hero {
  display: grid;
  grid-template-columns: minmax(14.375rem, 0.8fr) minmax(0, 1.2fr);
  gap: 1.5rem;
  align-items: stretch;
  margin-bottom: 1.75rem;
}

.product-media-frame {
  display: grid;
  min-height: 17.5rem;
  padding: 1.625rem;
  place-items: center;
}

.product-media-frame :deep(.card) {
  max-width: 13.75rem;
  background: transparent !important;
}

.product-media-frame :deep(.ratio) {
  min-height: 0;
}

.product-intro {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 0.5rem 0;
}

.product-intro-label {
  margin-bottom: 0.5rem;
  color: var(--phoenix-tertiary-color);
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.product-intro-name {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  line-height: 1.35;
}

.product-price {
  font-size: clamp(1.5rem, 2.2vw, 1.75rem);
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.product-classification {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4375rem;
  margin-top: 1.25rem;
}

.product-classification span {
  padding: 0.375rem 0.5625rem;
  border-radius: 999px;
  color: var(--phoenix-body-color);
  background: var(--phoenix-secondary-bg);
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
}

.product-classification .pricing-type {
  color: var(--phoenix-primary);
  background: rgba(var(--phoenix-primary-rgb), 0.1);
}

.product-inline-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.product-inline-summary > div {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding-right: 0.75rem;
  border-right: 1px solid var(--phoenix-border-color);
}

.product-inline-summary > div:last-child {
  padding-right: 0;
  border-right: 0;
}

.product-inline-summary dt {
  color: var(--phoenix-tertiary-color);
  font-size: 0.6875rem;
  font-weight: 700;
}

.product-inline-summary dd {
  margin: 0;
  color: var(--phoenix-primary);
  font-size: 0.875rem;
  font-weight: 800;
}

.sku-title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.sku-title-row h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.5;
}

.sku-title-row p {
  margin: 0.25rem 0 0;
  color: var(--phoenix-tertiary-color);
  font-size: 0.75rem;
  line-height: 1.5;
}

.sku-count {
  color: var(--phoenix-primary);
  font-size: 0.75rem;
  font-weight: 900;
  white-space: nowrap;
}

.sku-table-wrap {
  overflow-x: auto;
  border-top: 1px solid #e3e6ed;
  border-bottom: 1px solid #e3e6ed;
  background: var(--phoenix-emphasis-bg);
}

.sku-table {
  width: 100%;
  min-width: 51.25rem;
  margin: 0;
  border-collapse: collapse;
  color: var(--phoenix-body-color);
  font-size: 0.75rem;
  line-height: 1.5;
}

.sku-table-weighted {
  min-width: 62.5rem;
}

.sku-table th {
  padding: 0.6875rem 0.75rem;
  border: 0;
  color: #6e7891;
  font-size: 0.625rem;
  font-weight: 900;
  line-height: 1.5;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.sku-table td {
  padding: 0.9375rem 0.75rem;
  border-top: 1px solid #e3e6ed;
  color: var(--phoenix-body-color);
  vertical-align: middle;
}

.sku-table .sku-numeric {
  text-align: right;
  white-space: nowrap;
}

.sku-code-cell {
  display: block;
  color: var(--phoenix-emphasis-color);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  font-weight: 900;
  line-height: 1.5;
  white-space: nowrap;
}

.sku-code-sub {
  display: block;
  margin-top: 0.25rem;
  color: #6e7891;
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1.5;
}

.sku-sale-price {
  color: var(--phoenix-emphasis-color) !important;
  font-size: 0.8125rem;
  font-weight: 900;
}

.sku-stock-value {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.375rem;
  font-weight: 800;
  white-space: nowrap;
}

.sku-stock-value::before {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: var(--phoenix-success);
  content: "";
}

.sku-row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.sku-print-action,
.sku-history-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.4375rem 0.625rem;
  border: 1px solid #b9c9ef;
  border-radius: 0.375rem;
  color: #2458c6;
  background: #edf2ff;
  font: inherit;
  font-size: 0.6875rem;
  font-weight: 900;
  line-height: 0.8125rem;
  white-space: nowrap;
  cursor: pointer;
}

.sku-history-action {
  border-color: var(--phoenix-border-color);
  color: var(--phoenix-body-color);
  background: var(--phoenix-body-bg);
  text-decoration: none;
}

.sku-print-action:focus-visible,
.sku-history-action:focus-visible {
  outline: 2px solid var(--phoenix-primary);
  outline-offset: 2px;
}

.sku-print-action:disabled {
  opacity: 0.6;
  cursor: wait;
}

.mobile-sku-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.mobile-sku-list {
  display: none;
}

.mobile-sku-grid dt {
  color: var(--phoenix-tertiary-color);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}

.mobile-sku-grid dd {
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
  font-weight: 600;
}

.product-print-note {
  color: var(--phoenix-primary);
  background: rgba(var(--phoenix-primary-rgb), 0.1);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.55;
}

@container (max-width: 48rem) {
  .product-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .sku-table-wrap {
    display: none;
  }

  .mobile-sku-list {
    display: grid;
  }

  .mobile-sku-list .sku-row-actions {
    align-items: stretch;
    flex-direction: column;
  }
}

@container (max-width: 35.99875rem) {
  .product-media-frame {
    min-height: 17.5rem;
    padding: 1rem;
  }

  .product-media-frame :deep(.card) {
    max-width: 12.5rem;
  }

  .product-price {
    font-size: 1.55rem;
  }

  .mobile-sku-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
