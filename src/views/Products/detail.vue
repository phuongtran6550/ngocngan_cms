<template>
  <div class="sku-detail-page">
    <LoadingSkeleton v-if="loading" />
    <div v-else-if="error && !item" class="alert alert-subtle-danger" role="alert">
      {{ error }}
    </div>
    <template v-else-if="item">
      <PageHeader :title="item.name" :breadcrumbs="breadcrumbs">
        <template #actions>
          <button
            v-if="auth.can(PERMISSIONS.ordersCreate)"
            type="button"
            class="btn btn-sm btn-primary"
            :disabled="item.status !== 'active' || item.stock <= 0"
            @click="addToCart"
          >
            <AppIcon name="shopping-cart" class="me-sm-2" />
            <span>Thêm vào giỏ hàng</span>
          </button>
          <RouterLink class="btn btn-sm btn-phoenix-secondary" to="/products">
            <AppIcon name="arrow-left" class="me-sm-2" />
            <span class="d-none d-sm-inline">Danh sách</span>
          </RouterLink>
        </template>
      </PageHeader>

      <div v-if="error" class="alert alert-subtle-danger" role="alert">
        {{ error }}
      </div>
      <div v-if="cartMessage" class="alert" :class="cartMessageOk ? 'alert-subtle-success' : 'alert-subtle-warning'" role="status">
        {{ cartMessage }}
      </div>

      <div class="sku-detail-hero">
        <div class="sku-gallery">
          <div class="sku-gallery__main">
            <ResourceImageCard
              :src="assetUrl(activeImage || item.thumbnail)"
              :alt="`Ảnh sản phẩm ${item.name}, SKU ${item.skuCode}`"
              @preview="preview = assetUrl(activeImage || item.thumbnail)"
            />
          </div>
          <div v-if="gallery.length > 1" class="sku-gallery__thumbs" aria-label="Ảnh sản phẩm">
            <button
              v-for="image in gallery"
              :key="image"
              type="button"
              class="sku-gallery__thumb"
              :class="{ 'is-active': image === activeImage }"
              :aria-label="`Xem ảnh ${item.name}`"
              @click="activeImage = image"
            >
              <img :src="assetUrl(image)" alt="" />
            </button>
          </div>
        </div>

        <div class="sku-identity">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span class="badge badge-phoenix badge-phoenix-primary">
              {{ item.pricingType || "Chưa phân loại giá" }}
            </span>
            <span
              class="badge badge-phoenix"
              :class="item.status === 'inactive' ? 'badge-phoenix-secondary' : 'badge-phoenix-success'"
            >
              {{ item.status === "inactive" ? "Ngừng hoạt động" : "Đang hoạt động" }}
            </span>
          </div>
          <p class="sku-identity__eyebrow mb-2">SKU sản phẩm</p>
          <h2 class="sku-identity__name">{{ item.name }}</h2>
          <code class="sku-identity__code">{{ item.skuCode || "—" }}</code>

          <div class="sku-price-card">
            <span>Giá bán</span>
            <strong>{{ formatMoney(item.price) }}</strong>
            <small>
              Còn <b>{{ item.stock }}</b> sản phẩm trong kho
            </small>
          </div>

          <dl class="sku-key-facts mb-0">
            <div>
              <dt>Trọng lượng</dt>
              <dd>{{ weightLabel }}</dd>
            </div>
            <div>
              <dt>Ni</dt>
              <dd>{{ sizeLabel }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="sku-detail-grid">
        <article class="card shadow-none border border-translucent sku-detail-card">
          <div class="card-body">
            <p class="sku-detail-card__eyebrow">Phân loại</p>
            <h2 class="sku-detail-card__title">Thông tin sản phẩm</h2>
            <dl class="sku-definition-list mb-0">
              <div><dt>Danh mục</dt><dd>{{ item.category || "—" }}</dd></div>
              <div><dt>Chất liệu</dt><dd>{{ item.material || "—" }}</dd></div>
              <div><dt>Mẫu</dt><dd>{{ item.pattern || "—" }}</dd></div>
              <div><dt>Loại tính giá</dt><dd>{{ item.pricingType || "—" }}</dd></div>
            </dl>
          </div>
        </article>

        <article class="card shadow-none border border-translucent sku-detail-card">
          <div class="card-body">
            <p class="sku-detail-card__eyebrow">Cấu thành giá</p>
            <h2 class="sku-detail-card__title">Chi phí SKU</h2>
            <dl class="sku-definition-list mb-0">
              <template v-if="item.pricingType === 'Đồ cân'">
                <div><dt>Giá bạc hiện tại</dt><dd>{{ currentSilverPriceLabel }}</dd></div>
                <div v-if="weightedCostBreakdown">
                  <dt>Tiền bạc ({{ weightLabel }})</dt>
                  <dd>{{ formatMoney(weightedCostBreakdown.silverCost) }}</dd>
                </div>
                <div><dt>Tiền công</dt><dd>{{ formatMoney(item.laborCost) }}</dd></div>
                <div><dt>Tiền xi</dt><dd>{{ formatMoney(item.platingCost) }}</dd></div>
                <div v-if="weightedCostBreakdown && weightedCostBreakdown.otherCost !== null">
                  <dt>Chi phí khác</dt>
                  <dd>{{ formatMoney(weightedCostBreakdown.otherCost) }}</dd>
                </div>
              </template>
              <template v-else-if="item.pricingType === 'Đồ món'">
                <div><dt>Giá nhập</dt><dd>{{ formatMoney(item.importPrice) }}</dd></div>
                <div v-if="item.platingCost > 0"><dt>Tiền xi</dt><dd>{{ formatMoney(item.platingCost) }}</dd></div>
              </template>
              <template v-else>
                <div v-if="item.importPrice !== null">
                  <dt>Giá nhập</dt><dd>{{ formatMoney(item.importPrice) }}</dd>
                </div>
                <div v-if="item.laborCost > 0">
                  <dt>Tiền công</dt><dd>{{ formatMoney(item.laborCost) }}</dd>
                </div>
                <div v-if="item.platingCost > 0">
                  <dt>Tiền xi</dt><dd>{{ formatMoney(item.platingCost) }}</dd>
                </div>
                <div v-if="item.importPrice === null && item.laborCost <= 0 && item.platingCost <= 0">
                  <dt>Chi phí</dt><dd>Không áp dụng</dd>
                </div>
              </template>
              <div class="is-emphasis"><dt>Giá bán</dt><dd>{{ formatMoney(item.price) }}</dd></div>
            </dl>
          </div>
        </article>

      </div>

      <article
        id="history"
        class="card shadow-none border border-translucent sku-history-card"
      >
        <div class="card-body">
          <div class="sku-history-header">
            <div class="sku-history-header__copy">
              <h2 class="sku-detail-card__title mb-0">Lịch sử SKU</h2>
              <p class="text-body-tertiary mb-0">
                Tồn kho, thông số, chi phí, giá bán và người thao tác.
              </p>
            </div>
            <span class="badge badge-phoenix badge-phoenix-secondary">
              {{ historyTotal }} thay đổi
            </span>
          </div>

          <div
            v-if="historyError"
            class="alert alert-subtle-danger d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2 mb-0"
            role="alert"
          >
            <span>{{ historyError }}</span>
            <button
              type="button"
              class="btn btn-sm btn-phoenix-danger"
              @click="retryHistory"
            >
              Tải lại
            </button>
          </div>

          <div v-if="historyLoading" class="sku-history-loading" role="status">
            <span class="spinner-border spinner-border-sm" aria-hidden="true" />
            Đang tải lịch sử SKU...
          </div>

          <div
            v-else-if="!historyError && !historyItems.length"
            class="sku-history-empty"
          >
            SKU này chưa có lịch sử được ghi nhận.
          </div>

          <ol v-else class="sku-history-list">
            <li
              v-for="entry in historyItems"
              :key="entry.id"
              class="sku-history-entry"
            >
              <span class="sku-history-entry__marker" aria-hidden="true" />
              <div class="sku-history-entry__content">
                <div class="sku-history-entry__heading">
                  <div class="sku-history-entry__meta">
                    <span
                      class="badge badge-phoenix"
                      :class="historyActionClass(entry.action)"
                    >
                      {{ historyActionLabel(entry.action) }}
                    </span>
                    <span class="sku-history-entry__actor">
                      <strong>{{ historyActorLabel(entry) }}</strong>
                      <span
                        v-if="entry.actor?.username"
                        class="text-body-tertiary"
                      >
                        @{{ entry.actor.username }}
                      </span>
                    </span>
                  </div>
                  <time
                    class="sku-history-entry__time"
                    :datetime="entry.changedAt"
                  >
                    {{ formatDateTime(entry.changedAt) }}
                  </time>
                </div>

                <dl class="sku-history-changes mb-0">
                  <div
                    v-for="change in entry.changes"
                    :key="`${entry.id}-${change.field}`"
                  >
                    <dt>{{ historyFieldLabel(change.field) }}</dt>
                    <dd>
                      <span>{{ historyValue(change.field, change.before) }}</span>
                      <span class="sku-history-arrow" aria-hidden="true">→</span>
                      <strong>{{ historyValue(change.field, change.after) }}</strong>
                    </dd>
                  </div>
                </dl>

                <p
                  v-if="hasSilverPrice(entry)"
                  class="sku-history-silver mb-0"
                >
                  {{ silverPriceLabel(entry) }}
                </p>
              </div>
            </li>
          </ol>

          <div v-if="hasMoreHistory" class="text-center mt-2">
            <button
              type="button"
              class="btn btn-sm btn-phoenix-secondary"
              :disabled="historyLoadingMore"
              @click="loadMoreHistory"
            >
              <span
                v-if="historyLoadingMore"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              />
              {{ historyLoadingMore ? "Đang tải..." : "Xem thêm" }}
            </button>
          </div>
        </div>
      </article>
    </template>

    <ImagePreview
      :src="preview"
      :alt="item ? `Ảnh sản phẩm ${item.name}` : 'Ảnh sản phẩm'"
      @close="preview = ''"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import PageHeader from "@/components/app/PageHeader.vue";
import ImagePreview from "@/components/media/ImagePreview.vue";
import ResourceImageCard from "@/components/media/ResourceImageCard.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { apiError, assetUrl } from "@/request";
import { formatDateTime, formatMoney, formatNumberValue } from "@/utils/resource-display";
import { productService } from "@/views/Products/service";
import type {
  ProductSku,
  ProductSkuHistoryAction,
  ProductSkuHistoryField,
  ProductSkuHistoryItem,
  ProductSkuHistoryValue,
} from "@/views/Products/types";
import { calculateWeightedPrice } from "@/views/WarehousedGoods/pricing";
import { authenStore } from "@/stores/app-authen";
import { PERMISSIONS } from "@/config/permissions";
import { useSalesCartStore } from "@/views/Orders/cart";

const HISTORY_LIMIT = 20;
const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 });
const historyActionLabels: Record<ProductSkuHistoryAction, string> = {
  created: "Khởi tạo SKU",
  updated: "Cập nhật SKU",
  deleted: "Xóa SKU",
  silver_price_updated: "Cập nhật theo giá bạc",
};
const historyFieldLabels: Record<ProductSkuHistoryField, string> = {
  code: "Mã SKU",
  size: "Ni / cỡ tay",
  weight: "Trọng lượng",
  laborCost: "Tiền công",
  platingCost: "Tiền xi",
  importPrice: "Giá nhập",
  price: "Giá bán",
  stock: "Tồn kho",
};
const moneyHistoryFields = new Set<ProductSkuHistoryField>([
  "laborCost",
  "platingCost",
  "importPrice",
  "price",
]);
const route = useRoute();
const auth = authenStore();
const cart = useSalesCartStore();
const item = ref<ProductSku | null>(null);
const loading = ref(true);
const error = ref("");
const preview = ref("");
const activeImage = ref("");
const historyItems = ref<ProductSkuHistoryItem[]>([]);
const historyPage = ref(1);
const historyTotal = ref(0);
const historyTotalPages = ref(0);
const historyLoading = ref(false);
const historyLoadingMore = ref(false);
const historyError = ref("");
const currentSilverPrice = ref<number | null>(null);
const silverPriceLoading = ref(false);
const silverPriceError = ref(false);
const cartMessage = ref("");
const cartMessageOk = ref(true);
let controller: AbortController | null = null;
let historyController: AbortController | null = null;
let silverPriceController: AbortController | null = null;
let requestId = 0;
let historyRequestId = 0;
let silverPriceRequestId = 0;

const breadcrumbs = computed(() => [
  { label: "Trang chủ", to: "/dashboard" },
  { label: "Sản phẩm", to: "/products" },
  { label: item.value?.skuCode || "Chi tiết SKU" },
]);
const gallery = computed(() => {
  if (!item.value) return [];
  return [...new Set([item.value.thumbnail, ...item.value.images].filter(Boolean))];
});
const weightLabel = computed(() =>
  item.value && Number.isFinite(item.value.weight)
    ? `${decimal.format(item.value.weight)} chỉ`
    : "—",
);
const sizeLabel = computed(() => {
  const value = item.value?.size.trim() || "";
  if (!value) return "Không áp dụng";
  return /^ni\b/i.test(value) ? value : `Ni ${value}`;
});
const currentSilverPriceLabel = computed(() => {
  if (silverPriceLoading.value) return "Đang tải...";
  if (silverPriceError.value) return "Không thể tải";
  if (currentSilverPrice.value === null) return "Chưa thiết lập";
  return `${formatNumberValue(currentSilverPrice.value)} VNĐ / chỉ`;
});
const weightedCostBreakdown = computed(() => {
  const sku = item.value;
  const silverPrice = currentSilverPrice.value;
  if (
    !sku ||
    sku.pricingType !== "Đồ cân" ||
    silverPrice === null ||
    silverPrice <= 0 ||
    !Number.isFinite(sku.weight) ||
    sku.weight <= 0
  ) {
    return null;
  }

  const { rawPrice } = calculateWeightedPrice({
    weight: sku.weight,
    silverPrice,
    laborCost: sku.laborCost,
    platingCost: sku.platingCost,
  });
  const difference = sku.price - rawPrice;
  return {
    silverCost: Math.round(sku.weight * silverPrice),
    otherCost: difference > 0 ? difference : null,
  };
});
const hasMoreHistory = computed(
  () => historyPage.value < historyTotalPages.value,
);

function addToCart(): void {
  if (!item.value) return;
  const result = cart.add(item.value);
  cartMessageOk.value = result.ok;
  cartMessage.value = result.ok
    ? `${item.value.name}: ${result.message}. Bạn vẫn ở trang sản phẩm để tiếp tục thao tác.`
    : result.message;
}

function historyActionLabel(action: ProductSkuHistoryAction): string {
  return historyActionLabels[action];
}

function historyActionClass(action: ProductSkuHistoryAction): string {
  if (action === "created") return "badge-phoenix-success";
  if (action === "deleted") return "badge-phoenix-danger";
  if (action === "silver_price_updated") return "badge-phoenix-info";
  return "badge-phoenix-primary";
}

function historyFieldLabel(field: ProductSkuHistoryField): string {
  return historyFieldLabels[field];
}

function historyValue(
  field: ProductSkuHistoryField,
  value: ProductSkuHistoryValue,
): string {
  if (value === null || value === "") return "—";
  if (moneyHistoryFields.has(field)) return formatMoney(value);
  if (field === "weight" && typeof value === "number") {
    return `${decimal.format(value)} chỉ`;
  }
  if (field === "stock" && typeof value === "number") {
    return `${decimal.format(value)} sản phẩm`;
  }
  return String(value);
}

function historyActorLabel(entry: ProductSkuHistoryItem): string {
  return entry.actor?.name || entry.actor?.username || "Hệ thống";
}

function hasSilverPrice(entry: ProductSkuHistoryItem): boolean {
  return entry.silverPriceBefore !== null || entry.silverPriceAfter !== null;
}

function silverPriceLabel(entry: ProductSkuHistoryItem): string {
  const before = entry.silverPriceBefore;
  const after = entry.silverPriceAfter;
  if (before !== null && after !== null && before !== after) {
    return `Giá bạc: ${formatMoney(before)} → ${formatMoney(after)}`;
  }
  return `Giá bạc áp dụng: ${formatMoney(after ?? before)}`;
}

async function loadCurrentSilverPrice(): Promise<void> {
  silverPriceController?.abort();
  silverPriceController = new AbortController();
  const currentRequest = ++silverPriceRequestId;
  currentSilverPrice.value = null;
  silverPriceError.value = false;
  silverPriceLoading.value = true;
  try {
    const status = await productService.options(silverPriceController.signal);
    if (currentRequest !== silverPriceRequestId) return;
    currentSilverPrice.value = status.silverPrice ?? null;
  } catch (loadError) {
    if (currentRequest !== silverPriceRequestId) return;
    const normalized = apiError(loadError);
    if (normalized.code !== "ERR_CANCELED") silverPriceError.value = true;
  } finally {
    if (currentRequest === silverPriceRequestId) silverPriceLoading.value = false;
  }
}

async function loadHistory(
  skuId: string,
  page = 1,
  append = false,
): Promise<void> {
  historyController?.abort();
  historyController = new AbortController();
  const currentRequest = ++historyRequestId;
  historyError.value = "";
  if (append) historyLoadingMore.value = true;
  else historyLoading.value = true;
  try {
    const result = await productService.history(
      skuId,
      { page, limit: HISTORY_LIMIT },
      historyController.signal,
    );
    if (currentRequest !== historyRequestId) return;
    historyItems.value = append
      ? [...historyItems.value, ...result.items]
      : result.items;
    historyPage.value = result.page;
    historyTotal.value = result.total;
    historyTotalPages.value = result.totalPages;
  } catch (loadError) {
    if (currentRequest !== historyRequestId) return;
    const normalized = apiError(loadError);
    if (normalized.code !== "ERR_CANCELED") {
      historyError.value = normalized.message;
    }
  } finally {
    if (currentRequest === historyRequestId) {
      historyLoading.value = false;
      historyLoadingMore.value = false;
    }
  }
}

function retryHistory(): void {
  if (!item.value) return;
  const append = historyItems.value.length > 0;
  void loadHistory(
    item.value.id,
    append ? historyPage.value + 1 : 1,
    append,
  );
}

function loadMoreHistory(): void {
  if (!item.value || !hasMoreHistory.value || historyLoadingMore.value) return;
  void loadHistory(item.value.id, historyPage.value + 1, true);
}

async function load(skuId: string): Promise<void> {
  controller?.abort();
  historyController?.abort();
  silverPriceController?.abort();
  historyRequestId += 1;
  silverPriceRequestId += 1;
  controller = new AbortController();
  const currentRequest = ++requestId;
  loading.value = true;
  error.value = "";
  historyItems.value = [];
  historyPage.value = 1;
  historyTotal.value = 0;
  historyTotalPages.value = 0;
  historyError.value = "";
  currentSilverPrice.value = null;
  silverPriceLoading.value = false;
  silverPriceError.value = false;
  try {
    const result = await productService.detail(skuId, controller.signal);
    if (currentRequest !== requestId) return;
    item.value = result;
    activeImage.value = result.thumbnail || result.images[0] || "";
    loading.value = false;
    await nextTick();
    if (route.hash === "#history") {
      document.getElementById("history")?.scrollIntoView({ block: "start" });
    }
    await Promise.all([
      loadHistory(skuId),
      result.pricingType === "Đồ cân"
        ? loadCurrentSilverPrice()
        : Promise.resolve(),
    ]);
  } catch (loadError) {
    if (currentRequest !== requestId) return;
    const normalized = apiError(loadError);
    if (normalized.code !== "ERR_CANCELED") {
      item.value = null;
      error.value = normalized.message;
    }
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

watch(
  () => String(route.params.skuId || ""),
  (skuId) => void load(skuId),
  { immediate: true },
);

onBeforeUnmount(() => {
  requestId += 1;
  historyRequestId += 1;
  silverPriceRequestId += 1;
  controller?.abort();
  historyController?.abort();
  silverPriceController?.abort();
});
</script>

<style scoped>
.sku-detail-page {
  min-width: 0;
}

.sku-detail-hero {
  display: grid;
  grid-template-columns: minmax(18rem, 0.85fr) minmax(0, 1.15fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.sku-gallery,
.sku-identity {
  min-width: 0;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 1rem;
  background: var(--phoenix-body-emphasis-bg);
}

.sku-gallery {
  padding: 1rem;
}

.sku-gallery__main {
  display: grid;
  min-height: 22rem;
  place-items: center;
}

.sku-gallery__main :deep(.card) {
  width: min(100%, 20rem);
  background: transparent !important;
}

.sku-gallery__thumbs {
  display: flex;
  gap: 0.625rem;
  padding-top: 0.875rem;
  overflow-x: auto;
}

.sku-gallery__thumb {
  width: 3.75rem;
  height: 3.75rem;
  flex: 0 0 auto;
  padding: 0.125rem;
  overflow: hidden;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.625rem;
  background: var(--phoenix-body-bg);
}

.sku-gallery__thumb.is-active {
  border-color: var(--phoenix-primary);
  box-shadow: 0 0 0 0.15rem rgba(var(--phoenix-primary-rgb), 0.16);
}

.sku-gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.4rem;
}

.sku-identity {
  position: relative;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  overflow: hidden;
}

.sku-identity::after {
  position: absolute;
  right: -5rem;
  bottom: -6rem;
  width: 15rem;
  height: 15rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--phoenix-primary-rgb), 0.12), transparent 68%);
  content: "";
  pointer-events: none;
}

.sku-identity__eyebrow,
.sku-detail-card__eyebrow {
  color: var(--phoenix-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.sku-identity__name {
  max-width: 38rem;
  margin-bottom: 0.75rem;
  color: var(--phoenix-emphasis-color);
  font-size: clamp(1.55rem, 3vw, 2.35rem);
  line-height: 1.12;
}

.sku-identity__code {
  display: inline-block;
  max-width: 100%;
  padding: 0.45rem 0.7rem;
  overflow-wrap: anywhere;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.5rem;
  background: var(--phoenix-tertiary-bg);
}

.sku-price-card {
  display: grid;
  gap: 0.25rem;
  margin-block: 1.5rem;
  padding: 1.15rem 1.25rem;
  border-left: 0.28rem solid var(--phoenix-success);
  border-radius: 0.2rem 0.8rem 0.8rem 0.2rem;
  background: rgba(var(--phoenix-success-rgb), 0.08);
}

.sku-price-card span,
.sku-price-card small {
  color: var(--phoenix-secondary-color);
}

.sku-price-card strong {
  color: var(--phoenix-emphasis-color);
  font-size: clamp(1.45rem, 3vw, 2rem);
}

.sku-key-facts {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.sku-key-facts div {
  min-width: 0;
  padding: 0.85rem;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.75rem;
}

.sku-key-facts dt,
.sku-definition-list dt {
  margin-bottom: 0.3rem;
  color: var(--phoenix-tertiary-color);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.sku-key-facts dd,
.sku-definition-list dd {
  margin: 0;
  color: var(--phoenix-emphasis-color);
  font-weight: 700;
}

.sku-key-facts code,
.sku-definition-list code {
  overflow-wrap: anywhere;
}

.sku-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.sku-history-card {
  margin-top: 1rem;
  border-radius: 0.875rem;
  scroll-margin-top: 5rem;
}

.sku-history-card .card-body {
  padding: 0.9rem 1rem;
}

.sku-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.sku-history-header__copy {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 0.75rem;
}

.sku-history-header .sku-detail-card__title {
  flex: none;
  font-size: 1rem;
}

.sku-history-header p {
  font-size: 0.78rem;
}

.sku-history-loading,
.sku-history-empty {
  display: flex;
  min-height: 4.25rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  border: 1px dashed var(--phoenix-border-color-translucent);
  border-radius: 0.625rem;
  color: var(--phoenix-tertiary-color);
  font-size: 0.82rem;
  text-align: center;
}

.sku-history-list {
  display: grid;
  gap: 0;
  margin: 0.7rem 0 0;
  padding: 0;
  list-style: none;
}

.sku-history-entry {
  position: relative;
  display: grid;
  grid-template-columns: 0.75rem minmax(0, 1fr);
  gap: 0.625rem;
}

.sku-history-entry:not(:last-child)::before {
  position: absolute;
  top: 0.75rem;
  bottom: 0;
  left: 0.22rem;
  width: 1px;
  background: var(--phoenix-border-color-translucent);
  content: "";
}

.sku-history-entry__marker {
  position: relative;
  z-index: 1;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: 0.45rem;
  border: 0.125rem solid var(--phoenix-body-emphasis-bg);
  border-radius: 50%;
  background: var(--phoenix-primary);
  box-shadow: 0 0 0 1px var(--phoenix-border-color);
}

.sku-history-entry__content {
  min-width: 0;
  padding: 0.4rem 0 0.75rem;
}

.sku-history-entry:not(:last-child) .sku-history-entry__content {
  border-bottom: 1px solid var(--phoenix-border-color-translucent);
}

.sku-history-entry__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.sku-history-entry__meta,
.sku-history-entry__actor {
  display: flex;
  min-width: 0;
  align-items: center;
}

.sku-history-entry__meta {
  flex-wrap: wrap;
  gap: 0.45rem 0.65rem;
}

.sku-history-entry__actor {
  gap: 0.35rem;
  font-size: 0.8rem;
}

.sku-history-entry__actor strong,
.sku-history-entry__actor span {
  overflow-wrap: anywhere;
}

.sku-history-entry__time {
  color: var(--phoenix-tertiary-color);
  font-size: 0.72rem;
  white-space: nowrap;
}

.sku-history-changes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem 1.25rem;
  margin-top: 0.5rem;
}

.sku-history-changes > div {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.2rem 0;
}

.sku-history-changes dt {
  flex: none;
  margin: 0;
  color: var(--phoenix-tertiary-color);
  font-size: 0.72rem;
  font-weight: 700;
}

.sku-history-changes dd {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 0.78rem;
}

.sku-history-changes dd > span:first-child {
  color: var(--phoenix-tertiary-color);
  text-decoration: line-through;
}

.sku-history-arrow {
  color: var(--phoenix-primary);
  text-decoration: none !important;
}

.sku-history-silver {
  margin-top: 0.25rem;
  color: var(--phoenix-info);
  font-size: 0.72rem;
  font-weight: 700;
}

.sku-detail-card {
  border-radius: 1rem;
}

.sku-detail-card .card-body {
  padding: 1.25rem;
}

.sku-detail-card__title {
  margin-bottom: 1rem;
  font-size: 1.15rem;
}

.sku-definition-list {
  display: grid;
  gap: 0;
}

.sku-definition-list div {
  display: grid;
  grid-template-columns: minmax(7rem, 0.8fr) minmax(0, 1.2fr);
  gap: 1rem;
  padding-block: 0.75rem;
  border-bottom: 1px solid var(--phoenix-border-color-translucent);
}

.sku-definition-list div:last-child {
  border-bottom: 0;
}

.sku-definition-list dd {
  text-align: right;
}

.sku-definition-list .is-emphasis dd {
  color: var(--phoenix-success);
  font-size: 1.05rem;
}

@media (max-width: 991.98px) {
  .sku-detail-hero,
  .sku-detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }

}

@media (max-width: 575.98px) {
  .sku-gallery__main {
    min-height: 16rem;
  }

  .sku-key-facts {
    grid-template-columns: minmax(0, 1fr);
  }

  .sku-definition-list div {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.2rem;
  }

  .sku-definition-list dd {
    text-align: left;
  }

  .sku-history-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .sku-history-header__copy {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.2rem;
  }

  .sku-history-entry__heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.3rem;
  }

  .sku-history-entry__time {
    white-space: normal;
  }

  .sku-history-changes {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
