<template>
  <div class="product-sku-list-page">
    <ListShell
      :definition="productDefinition"
      :rows="rows"
      :pagination="store.pagination"
      :loading="store.loading"
      :error="store.error"
      @refresh="refresh"
      @sort="store.applySort"
      @view="openDetail"
      @page="store.load"
    >
      <template #header-actions>
        <div class="d-flex flex-wrap gap-2">
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
            <option value="">Tất cả danh mục</option>
            <option
              v-for="item in store.options.categories"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
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
            <option value="">Tất cả chất liệu</option>
            <option
              v-for="item in store.options.materials"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
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
            <option value="">Tất cả mẫu</option>
            <option
              v-for="item in store.options.patterns"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
            </option>
          </select>
        </div>

        <div class="d-flex justify-content-end gap-2 pt-2 border-top">
          <button
            type="button"
            class="btn btn-outline-secondary"
            @click="clearFilters"
          >
            Đặt lại
          </button>
          <button type="submit" class="btn btn-primary">
            Áp dụng
            <span v-if="draftFilterCount" class="badge text-bg-light ms-1">
              {{ draftFilterCount }}
            </span>
          </button>
        </div>
      </form>
    </DrawerPanel>

    <ProductBarcodeScanner
      :open="scannerOpen"
      @close="scannerOpen = false"
      @resolved="openScannedProduct"
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
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import type { ResourceRow } from "@/config/resource";
import { searchQueryFromRoute } from "@/utils/global-search";
import ProductBarcodeScanner from "@/views/Products/components/ProductBarcodeScanner.vue";
import { productDefinition } from "@/views/Products/config";
import { preloadBarcodeReader } from "@/views/Products/scanner/zxing-reader";
import { useProductStore } from "@/views/Products/store";
import type { ProductSku } from "@/views/Products/types";

const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 });
const store = useProductStore();
const route = useRoute();
const router = useRouter();

const filterOpen = ref(false);
const scannerOpen = ref(false);
const draftCategoryId = ref("");
const draftMaterialId = ref("");
const draftPatternId = ref("");
let idleTimer: ReturnType<typeof setTimeout> | number | null = null;

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

function refresh(): void {
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
  store.categoryId = draftCategoryId.value;
  store.materialId = draftMaterialId.value;
  store.patternId = draftPatternId.value;
  await store.applyFilters();
  filterOpen.value = false;
}

async function clearFilters(): Promise<void> {
  draftCategoryId.value = "";
  draftMaterialId.value = "";
  draftPatternId.value = "";
  await store.clearFilters();
  filterOpen.value = false;
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
});
</script>

<style scoped>
.product-action-label {
  vertical-align: middle;
}
</style>
