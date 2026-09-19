<template>
  <div class="product-sku-list-page">
    <div
      v-if="actionSuccess"
      class="alert alert-subtle-success d-flex align-items-center justify-content-between mb-3 shadow-sm"
      role="status"
      data-testid="product-action-success"
    >
      <div class="d-flex align-items-center gap-2">
        <AppIcon name="check-circle" class="flex-shrink-0 text-success" />
        <span class="fw-semibold">{{ actionSuccess }}</span>
      </div>
      <button
        type="button"
        class="btn-close"
        aria-label="Đóng"
        @click="actionSuccess = ''"
      />
    </div>
    <div
      v-if="actionError"
      class="alert alert-subtle-danger d-flex align-items-center justify-content-between mb-3 shadow-sm"
      role="alert"
      data-testid="product-action-error"
    >
      <div class="d-flex align-items-center gap-2">
        <AppIcon name="alert-circle" class="flex-shrink-0 text-danger" />
        <span class="fw-semibold">{{ actionError }}</span>
      </div>
      <button
        type="button"
        class="btn-close"
        aria-label="Đóng"
        @click="actionError = ''"
      />
    </div>

    <ListShell
      :definition="productDefinition"
      :rows="rows"
      :pagination="store.pagination"
      :loading="store.loading"
      :error="store.error"
      :selectable="canDelete"
      :selected-keys="selectedSkuIds"
      :can-delete-row="canDeleteRow"
      @refresh="refresh"
      @sort="onSort"
      @view="openDetail"
      @delete="onRequestDelete"
      @page="onPageChange"
      @select-row="onSelectRow"
      @select-all="onSelectAll"
    >
      <template #header-actions>
        <div class="d-flex flex-wrap gap-2">
          <button
            v-if="canDelete && selectedSkuIds.length > 0"
            type="button"
            class="btn btn-sm btn-subtle-danger text-nowrap d-inline-flex align-items-center gap-1"
            data-testid="bulk-delete-products-btn"
            :disabled="bulkDeleteSubmitting"
            @click="bulkDeleteOpen = true"
          >
            <AppIcon name="trash-2" />
            <span>Xóa đã chọn ({{ selectedSkuIds.length }})</span>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-primary text-nowrap"
            aria-label="Quét mã"
            title="Quét mã"
            @click="scannerOpen = true"
          >
            <AppIcon name="scan-line" class="me-sm-2" />
            <span class="product-action-label d-none d-sm-inline">Quét mã</span>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-phoenix-secondary text-nowrap"
            aria-label="Bộ lọc"
            title="Bộ lọc"
            @click="openFilters"
          >
            <AppIcon name="filter" class="me-sm-2" />
            <span class="product-action-label d-none d-sm-inline">Bộ lọc</span>
            <span
              v-if="activeFilterCount"
              class="product-filter-count badge text-bg-primary ms-2 d-none d-sm-inline"
            >
              {{ activeFilterCount }}
            </span>
          </button>
        </div>
      </template>
    </ListShell>

    <DrawerPanel
      :open="filterOpen"
      title="Lọc sản phẩm"
      @close="filterOpen = false"
    >
      <form class="d-flex flex-column gap-3" @submit.prevent="applyFilters">
        <div>
          <label class="form-label fw-bold mb-1" for="product-category-filter">
            Danh mục
          </label>
          <select
            id="product-category-filter"
            v-model="draftCategoryId"
            class="form-select"
          >
            <option value="">Tất cả</option>
            <option
              v-for="option in store.options.categories"
              :key="option.id"
              :value="option.id"
            >
              {{ option.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="form-label fw-bold mb-1" for="product-material-filter">
            Chất liệu
          </label>
          <select
            id="product-material-filter"
            v-model="draftMaterialId"
            class="form-select"
          >
            <option value="">Tất cả</option>
            <option
              v-for="option in store.options.materials"
              :key="option.id"
              :value="option.id"
            >
              {{ option.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="form-label fw-bold mb-1" for="product-pattern-filter">
            Mẫu
          </label>
          <select
            id="product-pattern-filter"
            v-model="draftPatternId"
            class="form-select"
          >
            <option value="">Tất cả</option>
            <option
              v-for="option in store.options.patterns"
              :key="option.id"
              :value="option.id"
            >
              {{ option.name }}
            </option>
          </select>
        </div>
        <div class="d-flex gap-2 pt-2">
          <button type="submit" class="btn btn-primary flex-grow-1">
            Áp dụng
          </button>
          <button
            type="button"
            class="btn btn-phoenix-secondary"
            :disabled="!draftFilterCount"
            @click="clearFilters"
          >
            Xóa lọc
          </button>
        </div>
      </form>
    </DrawerPanel>

    <ProductBarcodeScanner
      :open="scannerOpen"
      @close="scannerOpen = false"
      @resolved="openScannedProduct"
    />

    <ConfirmDialog
      :open="bulkDeleteOpen"
      title="Xóa sản phẩm đã chọn"
      :message="bulkDeleteMessage"
      confirm-label="Xóa sản phẩm"
      @cancel="bulkDeleteOpen = false"
      @confirm="confirmBulkDelete"
    />

    <ConfirmDialog
      :open="Boolean(singleDeleteTarget)"
      title="Xóa sản phẩm"
      :message="singleDeleteMessage"
      confirm-label="Xóa sản phẩm"
      @cancel="singleDeleteTarget = null"
      @confirm="confirmSingleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import ListShell from "@/components/ListLayout/ListShell.vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { PERMISSIONS } from "@/config/permissions";
import type { ResourceRow } from "@/config/resource";
import { apiError } from "@/request";
import { authenStore } from "@/stores/app-authen";
import { searchQueryFromRoute } from "@/utils/global-search";
import ProductBarcodeScanner from "@/views/Products/components/ProductBarcodeScanner.vue";
import { productDefinition } from "@/views/Products/config";
import { preloadBarcodeReader } from "@/views/Products/scanner/zxing-reader";
import { productService } from "@/views/Products/service";
import { useProductStore } from "@/views/Products/store";
import type { ProductSku } from "@/views/Products/types";

const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 });
const auth = authenStore();
const store = useProductStore();
const route = useRoute();
const router = useRouter();

const filterOpen = ref(false);
const scannerOpen = ref(false);
const draftCategoryId = ref("");
const draftMaterialId = ref("");
const draftPatternId = ref("");
let idleTimer: ReturnType<typeof setTimeout> | number | null = null;

const selectedSkuIds = ref<string[]>([]);
const bulkDeleteOpen = ref(false);
const bulkDeleteSubmitting = ref(false);
const singleDeleteTarget = ref<ResourceRow | null>(null);
const singleDeleteSubmitting = ref(false);
const actionSuccess = ref("");
const actionError = ref("");

const canDelete = computed(
  () =>
    auth.can(PERMISSIONS.warehouseDelete) ||
    auth.can(PERMISSIONS.warehouseUpdate),
);

function canDeleteRow(): boolean {
  return canDelete.value;
}

const activeFilterCount = computed(
  () => [store.categoryId, store.materialId, store.patternId].filter(Boolean).length,
);
const draftFilterCount = computed(
  () =>
    [draftCategoryId.value, draftMaterialId.value, draftPatternId.value].filter(
      Boolean,
    ).length,
);
const rows = computed<ResourceRow[]>(() =>
  store.items.map((item) => {
    const rawSize = item.size.trim();
    const size = rawSize
      ? /^ni\b/i.test(rawSize)
        ? rawSize
        : `Ni ${rawSize}`
      : "Không áp dụng";
    return {
      ...item,
      weight: Number.isFinite(item.weight)
        ? `${decimal.format(item.weight)} chỉ`
        : "—",
      size,
      classificationTags: [item.category, item.material, item.pattern].filter(
        Boolean,
      ),
    };
  }),
);

const bulkDeleteMessage = computed(() =>
  `Bạn có chắc chắn muốn xóa ${selectedSkuIds.value.length} sản phẩm đã chọn không? Thao tác này sẽ cập nhật lại kho hàng.`,
);

const singleDeleteMessage = computed(() =>
  singleDeleteTarget.value
    ? `Bạn có chắc chắn muốn xóa sản phẩm "${singleDeleteTarget.value.name || singleDeleteTarget.value.skuCode || "này"}" không?`
    : "",
);

function clearSelection(): void {
  selectedSkuIds.value = [];
}

function onSelectRow(row: ResourceRow, selected: boolean): void {
  const id = String(row.id);
  if (selected) {
    if (!selectedSkuIds.value.includes(id)) {
      selectedSkuIds.value.push(id);
    }
  } else {
    selectedSkuIds.value = selectedSkuIds.value.filter((item) => item !== id);
  }
}

function onSelectAll(selected: boolean): void {
  const currentPageIds = rows.value.map((r) => String(r.id));
  if (selected) {
    const set = new Set([...selectedSkuIds.value, ...currentPageIds]);
    selectedSkuIds.value = Array.from(set);
  } else {
    const removeSet = new Set(currentPageIds);
    selectedSkuIds.value = selectedSkuIds.value.filter((id) => !removeSet.has(id));
  }
}

function onPageChange(page: number): void {
  clearSelection();
  void store.load(page);
}

function onSort(key: string): void {
  clearSelection();
  void store.applySort(key);
}

function refresh(): void {
  clearSelection();
  void Promise.all([store.load(), store.loadOptions()]);
}

function openDetail(row: ResourceRow): void {
  void router.push(`/products/${row.id}`);
}

async function openScannedProduct(sku: ProductSku): Promise<void> {
  scannerOpen.value = false;
  await nextTick();
  await router.push(`/products/${sku.id}`);
}

function openFilters(): void {
  draftCategoryId.value = store.categoryId;
  draftMaterialId.value = store.materialId;
  draftPatternId.value = store.patternId;
  filterOpen.value = true;
}

async function applyFilters(): Promise<void> {
  clearSelection();
  store.categoryId = draftCategoryId.value;
  store.materialId = draftMaterialId.value;
  store.patternId = draftPatternId.value;
  await store.applyFilters();
  filterOpen.value = false;
}

async function clearFilters(): Promise<void> {
  clearSelection();
  draftCategoryId.value = "";
  draftMaterialId.value = "";
  draftPatternId.value = "";
  await store.clearFilters();
  filterOpen.value = false;
}

function onRequestDelete(row: ResourceRow): void {
  singleDeleteTarget.value = row;
}

async function confirmBulkDelete(): Promise<void> {
  if (!selectedSkuIds.value.length) return;
  bulkDeleteSubmitting.value = true;
  actionError.value = "";
  actionSuccess.value = "";
  try {
    const result = await productService.bulkDelete(selectedSkuIds.value);
    actionSuccess.value = `Đã xóa ${result.deletedCount} sản phẩm thành công.`;
    bulkDeleteOpen.value = false;
    clearSelection();
    await store.load();
  } catch (error) {
    actionError.value = apiError(error).message;
    bulkDeleteOpen.value = false;
  } finally {
    bulkDeleteSubmitting.value = false;
  }
}

async function confirmSingleDelete(): Promise<void> {
  if (!singleDeleteTarget.value) return;
  singleDeleteSubmitting.value = true;
  actionError.value = "";
  actionSuccess.value = "";
  const target = singleDeleteTarget.value;
  try {
    await productService.delete(String(target.id));
    actionSuccess.value = `Đã xóa sản phẩm "${target.name || target.skuCode || "đã chọn"}" thành công.`;
    singleDeleteTarget.value = null;
    selectedSkuIds.value = selectedSkuIds.value.filter(
      (id) => id !== String(target.id),
    );
    await store.load();
  } catch (error) {
    actionError.value = apiError(error).message;
    singleDeleteTarget.value = null;
  } finally {
    singleDeleteSubmitting.value = false;
  }
}

function scheduleReaderPreload(): void {
  const idleWindow = window as typeof window & {
    requestIdleCallback?: (callback: () => void) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (idleWindow.requestIdleCallback) {
    idleTimer = idleWindow.requestIdleCallback(() => {
      void preloadBarcodeReader().catch(() => undefined);
    });
    return;
  }
  idleTimer = setTimeout(() => {
    void preloadBarcodeReader().catch(() => undefined);
  }, 600);
}

onMounted(() => {
  store.query = searchQueryFromRoute(route.query.query);
  void Promise.all([store.load(1), store.loadOptions()]);
  scheduleReaderPreload();
});

watch(
  () => route.query.query,
  (value) => {
    const query = searchQueryFromRoute(value);
    if (query === store.query) return;
    clearSelection();
    store.query = query;
    void store.load(1);
  },
);

onBeforeUnmount(() => {
  const idleWindow = window as typeof window & {
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof idleTimer === "number" && idleWindow.cancelIdleCallback) {
    idleWindow.cancelIdleCallback(idleTimer);
  } else if (idleTimer !== null) {
    clearTimeout(idleTimer);
  }
  store.disposeRequests();
});
</script>

<style scoped>
.product-sku-list-page {
  min-width: 0;
}
</style>
