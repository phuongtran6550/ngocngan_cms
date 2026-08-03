<template>
  <div>
    <div v-if="store.message" class="alert alert-subtle-success" role="status">
      {{ store.message }}
    </div>
    <ListShell
      :definition="effectiveDefinition"
      :rows="rows"
      :pagination="store.pagination"
      :loading="store.loading"
      :error="store.error"
      :selected-columns="store.selectedColumns"
      @refresh="refresh"
      @fields="updateFields"
      @sort="store.applySort"
      @view="openDetail"
      @edit="openEdit"
      @delete="requestDelete"
      @page="store.load"
      @create="$router.push('/warehoused-goods/create')"
    >
      <template #header-actions>
        <button
          type="button"
          class="btn btn-sm btn-phoenix-secondary text-nowrap"
          @click="showFilterDrawer = true"
        >
          <AppIcon name="filter" class="me-sm-2" />
          <span class="d-none d-sm-inline">Bộ lọc</span>
          <span v-if="activeFilterCount" class="badge text-bg-primary ms-2 d-none d-sm-inline">{{ activeFilterCount }}</span>
        </button>
      </template>
    </ListShell>

    <ConfirmDialog
      :open="Boolean(store.deleteTarget)"
      title="Xóa hàng nhập kho"
      :message="`Bạn có chắc muốn xóa “${store.deleteTarget?.name || ''}” và toàn bộ SKU liên quan?`"
      confirm-label="Xóa hàng nhập kho"
      @cancel="store.cancelDelete"
      @confirm="store.confirmDelete"
    />

    <DrawerPanel
      :open="showFilterDrawer"
      title="Lọc dữ liệu"
      @close="showFilterDrawer = false"
    >
      <form class="d-flex flex-column gap-3" @submit.prevent="search">
        <div>
          <label class="form-label fw-bold mb-1" for="product-list-search">
            Tìm kiếm
          </label>
          <div class="input-group">
            <input
              id="product-list-search"
              v-model="store.query"
              type="search"
              class="form-control"
              placeholder="Nhập tên, mã sản phẩm..."
              autocomplete="off"
            />
            <button type="submit" class="btn btn-primary">
              Tìm
            </button>
          </div>
        </div>
        <div>
          <label class="form-label fw-bold mb-1" for="warehouse-category-filter">Danh mục</label>
          <select id="warehouse-category-filter" v-model="store.categoryId" class="form-select" @change="store.applyFilters">
            <option value="">Tất cả</option>
            <option v-for="option in store.options.categories" :key="option.id" :value="option.id">
              {{ option.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="form-label fw-bold mb-1" for="warehouse-material-filter">Chất liệu</label>
          <select id="warehouse-material-filter" v-model="store.materialId" class="form-select" @change="store.applyFilters">
            <option value="">Tất cả</option>
            <option v-for="option in store.options.materials" :key="option.id" :value="option.id">
              {{ option.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="form-label fw-bold mb-1" for="warehouse-pattern-filter">Mẫu</label>
          <select id="warehouse-pattern-filter" v-model="store.patternId" class="form-select" @change="store.applyFilters">
            <option value="">Tất cả</option>
            <option v-for="option in store.options.patterns" :key="option.id" :value="option.id">
              {{ option.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="form-label fw-bold mb-1" for="warehouse-pricing-filter">Loại sản phẩm</label>
          <select id="warehouse-pricing-filter" v-model="store.pricingType" class="form-select" @change="store.applyFilters">
            <option value="">Tất cả</option>
            <option value="Đồ cân">Đồ cân</option>
            <option value="Đồ món">Đồ món</option>
          </select>
        </div>
        <div>
          <label class="form-label fw-bold mb-1" for="warehouse-stock-filter">Mức tồn kho</label>
          <select id="warehouse-stock-filter" v-model="store.stockLevel" class="form-select" @change="store.applyFilters">
            <option value="">Tất cả</option>
            <option value="low">Sắp hết hàng (từ 2 trở xuống)</option>
          </select>
        </div>
      </form>
    </DrawerPanel>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { searchQueryFromRoute } from "@/utils/global-search";
import ListShell from "@/components/ListLayout/ListShell.vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { warehouseDefinition } from "@/views/WarehousedGoods/config";
import { productSkuSummary } from "@/views/WarehousedGoods/product-summary";
import { useWarehouseStore } from "@/views/WarehousedGoods/store";
import type { StockLevelFilter, WarehouseItem } from "@/views/WarehousedGoods/types";
import { authenStore } from "@/stores/app-authen";
import type { ResourceDefinition, ResourceRow } from "@/config/resource";
import { routeQueryEnum } from "@/utils/route-query";

const stockLevels: readonly Exclude<StockLevelFilter, "">[] = ["low"];

export default defineComponent({
  name: "WarehouseListPage",
  components: { ConfirmDialog, ListShell, DrawerPanel, AppIcon },
  data() {
    return {
      showFilterDrawer: false,
    };
  },
  computed: {
    store() {
      return useWarehouseStore();
    },
    auth() {
      return authenStore();
    },
    canCreate(): boolean {
      return this.auth.can(warehouseDefinition.permission.create);
    },
    activeFilterCount(): number {
      return [
        this.store.query,
        this.store.categoryId,
        this.store.materialId,
        this.store.patternId,
        this.store.pricingType,
        this.store.stockLevel,
      ].filter(Boolean).length;
    },
    rows(): ResourceRow[] {
      return this.store.items.map((item) => ({
        ...item,
        price: productSkuSummary(item.skus || []).price,
        classificationTags: [item.category, item.material, item.pattern].filter(
          Boolean,
        ),
      })) as unknown as ResourceRow[];
    },
    effectiveDefinition(): ResourceDefinition {
      return {
        ...warehouseDefinition,
        columns: warehouseDefinition.columns.map((column) => ({
          ...column,
          visible: this.store.selectedColumns.includes(column.key),
        })),
        actions: {
          ...warehouseDefinition.actions,
          create: this.canCreate,
          update: this.auth.can(warehouseDefinition.permission.update),
          delete: this.auth.can(warehouseDefinition.permission.delete),
        },
      };
    },
  },
  mounted() {
    this.store.query = searchQueryFromRoute(this.$route.query.query);
    const stockLevel = routeQueryEnum(this.$route.query.stockLevel, stockLevels);
    if (stockLevel === "low") {
      this.store.categoryId = "";
      this.store.materialId = "";
      this.store.patternId = "";
      this.store.pricingType = "";
    }
    this.store.stockLevel = stockLevel;
    void Promise.all([this.store.load(1), this.store.loadOptions()]);
  },
  methods: {
    search(): void {
      void this.store.applySearch(this.store.query);
    },
    refresh(): void {
      void Promise.all([this.store.load(), this.store.loadOptions()]);
    },
    updateFields(fields: string[]): void {
      if (fields.length) this.store.selectedColumns = fields;
    },
    openDetail(row: ResourceRow): void {
      void this.$router.push(`/warehoused-goods/${row.id}`);
    },
    openEdit(row: ResourceRow): void {
      void this.$router.push(`/warehoused-goods/${row.id}/edit`);
    },
    requestDelete(row: ResourceRow): void {
      this.store.requestDelete(row as unknown as WarehouseItem);
    },
  },
});
</script>

<style scoped>
.product-list-filters {
  display: grid;
  grid-template-columns: minmax(15rem, 1.7fr) repeat(4, minmax(8.5rem, 1fr));
  align-items: end;
  gap: 0.5rem;
  width: 100%;
}

.product-list-filters .form-label {
  margin-bottom: 0.25rem;
}

@media (max-width: 1199.98px) {
  .product-list-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .product-list-search {
    grid-column: 1 / -1;
  }
}

@media (max-width: 575.98px) {
  .product-list-filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .product-list-search {
    grid-column: auto;
  }
}

:deep([data-testid="desktop-data-table"] thead th:last-child),
:deep([data-testid="desktop-data-table"] tbody td:last-child) {
  position: sticky;
  right: 0;
  background: var(--phoenix-body-emphasis-bg);
}

:deep([data-testid="desktop-data-table"] thead th:last-child) {
  z-index: 3;
}

:deep([data-testid="desktop-data-table"] tbody td:last-child) {
  z-index: 2;
  box-shadow: -0.5rem 0 0.75rem -0.75rem rgba(0, 0, 0, 0.35);
}

:deep([data-testid="desktop-data-table"] tbody tr:hover td:last-child),
:deep([data-testid="desktop-data-table"] tbody td:last-child:focus-within) {
  z-index: 4;
}
</style>
