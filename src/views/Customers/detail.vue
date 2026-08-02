<template>
  <section>
    <LoadingSkeleton v-if="loading" />
    <div v-else-if="error && !detail" class="alert alert-subtle-danger" role="alert">{{ error }}</div>
    <template v-else-if="detail">
      <PageHeader :title="detail.customer.name || detail.customer.phone" :description="`Hồ sơ mua hàng theo số điện thoại ${detail.customer.phone}`">
        <template #actions><RouterLink class="btn btn-phoenix-secondary" to="/customers">Danh sách khách</RouterLink></template>
      </PageHeader>
      <div v-if="error" class="alert alert-subtle-danger" role="alert">{{ error }}</div>

      <div class="customer-kpis">
        <article><span>Tổng chi tiêu</span><strong>{{ money(detail.customer.price) }}</strong><small>{{ detail.customer.completedOrderCount }} đơn hoàn tất</small></article>
        <article><span>Giá trị đổi trả</span><strong>{{ money(detail.customer.priceReturn) }}</strong><small>{{ detail.customer.returnedOrderCount }} đơn đổi trả</small></article>
        <article><span>Giá trị đơn trung bình</span><strong>{{ money(detail.customer.averageOrderValue) }}</strong><small>Tính trên đơn hoàn tất</small></article>
        <article><span>Lần mua gần nhất</span><strong>{{ dateTime(detail.customer.latestOrderAt) }}</strong><small>Lần đầu {{ dateTime(detail.customer.firstOrderAt) }}</small></article>
      </div>

      <div class="row g-4 mt-1">
        <div class="col-12 col-xl-8">
          <article class="card overflow-hidden">
            <div class="card-header bg-transparent border-bottom"><h2 class="fs-7 mb-0">Lịch sử đơn hàng</h2></div>
            <div v-if="!detail.orders.length" class="card-body text-body-tertiary">Chưa có đơn hàng.</div>
            <div v-else class="customer-order-list">
              <RouterLink v-for="order in detail.orders" :key="order.id" :to="`/orders/${order.id}`" class="customer-order-row">
                <img :src="assetUrl(order.thumbnail)" :alt="order.orderCode" />
                <div><code>{{ order.orderCode }}</code><strong>{{ order.items.map(item => item.productName || item.category).filter(Boolean).slice(0, 2).join(', ') || 'Đơn hàng' }}</strong><small>{{ dateTime(order.createdAt) }} · {{ order.items.reduce((sum, item) => sum + item.quantity, 0) }} món</small></div>
                <div class="text-end"><strong>{{ money(order.price) }}</strong><span class="badge badge-phoenix ms-2" :class="order.status === 'returned' ? 'badge-phoenix-info' : 'badge-phoenix-success'">{{ order.status === 'returned' ? 'Đổi trả' : 'Hoàn tất' }}</span></div>
              </RouterLink>
            </div>
            <PaginationBar :page="detail.pagination.page" :total-pages="detail.pagination.totalPages" :total="detail.pagination.total" @change="load" />
          </article>
        </div>
        <div class="col-12 col-xl-4">
          <article class="card mb-4">
            <div class="card-header bg-transparent border-bottom"><h2 class="fs-8 mb-0">Chi tiêu theo danh mục</h2></div>
            <div class="card-body category-spend-list">
              <div v-for="category in detail.categories" :key="category.categoryId || category.category">
                <div><strong>{{ category.category || "Khác" }}</strong><span>{{ category.quantity }} món</span></div>
                <strong>{{ money(category.spend) }}</strong>
              </div>
            </div>
          </article>
        </div>
      </div>

      <article class="card mt-4 overflow-hidden">
        <div class="card-header bg-transparent border-bottom"><h2 class="fs-7 mb-0">Sản phẩm khách đã mua</h2></div>
        <div v-if="!detail.products.length" class="card-body text-body-tertiary">Chưa có dữ liệu SKU chi tiết.</div>
        <div v-else class="customer-products">
          <component :is="product.skuId ? 'RouterLink' : 'div'" v-for="product in detail.products" :key="product.skuId || `${product.productName}-${product.category}`" :to="product.skuId ? `/products/${product.skuId}` : undefined" class="customer-product-card">
            <img :src="assetUrl(product.thumbnail)" :alt="product.productName" />
            <div><strong>{{ product.productName || product.category }}</strong><code>{{ product.skuCode || product.barcode || "SKU cũ" }}</code><small>{{ product.quantity }} đã mua · {{ product.returnedQuantity }} đổi trả</small></div>
            <strong>{{ money(product.spend) }}</strong>
          </component>
        </div>
      </article>
    </template>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import PaginationBar from "@/components/Pagination/index.vue";
import { apiError, assetUrl } from "@/request";
import { formatDateTime, formatMoney } from "@/utils/resource-display";
import { customerService } from "@/views/Customers/service";
import type { CustomerDetailResponse } from "@/views/Customers/types";

export default defineComponent({
  name: "CustomerDetailPage",
  components: { LoadingSkeleton, PageHeader, PaginationBar },
  data() { return { detail: null as CustomerDetailResponse | null, loading: true, error: "", controller: null as AbortController | null }; },
  mounted() { void this.load(1); },
  beforeUnmount() { this.controller?.abort(); },
  methods: {
    assetUrl,
    money(value: number): string { return formatMoney(value); },
    dateTime(value?: string): string { return formatDateTime(value); },
    async load(page = 1): Promise<void> {
      this.controller?.abort(); this.controller = new AbortController(); this.loading = !this.detail; this.error = "";
      try { this.detail = await customerService.detail(String(this.$route.params.phone), page, 10, this.controller.signal); }
      catch (error) { const normalized = apiError(error); if (normalized.code !== "ERR_CANCELED") this.error = normalized.message; }
      finally { this.loading = false; }
    },
  },
});
</script>

<style scoped>
.customer-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.customer-kpis article { display: grid; gap: .25rem; padding: 1rem; border: 1px solid var(--phoenix-border-color-translucent); border-radius: .85rem; background: var(--phoenix-body-emphasis-bg); }
.customer-kpis span, .customer-kpis small { color: var(--phoenix-secondary-color); font-size: .72rem; }
.customer-kpis strong { font-size: 1.05rem; }
.customer-order-list { display: grid; }
.customer-order-row { display: grid; grid-template-columns: 3.75rem minmax(0, 1fr) auto; gap: .9rem; align-items: center; padding: 1rem; border-bottom: 1px solid var(--phoenix-border-color-translucent); color: inherit; text-decoration: none; }
.customer-order-row:hover { background: var(--phoenix-tertiary-bg); }
.customer-order-row img { width: 3.75rem; height: 3.75rem; object-fit: cover; border-radius: .65rem; }
.customer-order-row > div { display: grid; gap: .15rem; }
.customer-order-row small { color: var(--phoenix-secondary-color); }
.category-spend-list { display: grid; gap: .85rem; }
.category-spend-list > div { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: .7rem; border-bottom: 1px dashed var(--phoenix-border-color-translucent); }
.category-spend-list div div { display: grid; }
.category-spend-list span { color: var(--phoenix-secondary-color); font-size: .75rem; }
.customer-products { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; }
.customer-product-card { display: grid; grid-template-columns: 4rem minmax(0, 1fr); gap: .75rem; padding: 1rem; border-right: 1px solid var(--phoenix-border-color-translucent); border-bottom: 1px solid var(--phoenix-border-color-translucent); color: inherit; text-decoration: none; }
.customer-product-card > strong { grid-column: 2; }
.customer-product-card img { width: 4rem; height: 4rem; object-fit: cover; border-radius: .65rem; }
.customer-product-card div { display: grid; gap: .12rem; }
.customer-product-card small { color: var(--phoenix-secondary-color); }
@media (max-width: 1199.98px) { .customer-kpis { grid-template-columns: repeat(2, 1fr); } .customer-products { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 575.98px) { .customer-kpis, .customer-products { grid-template-columns: 1fr; } .customer-order-row { grid-template-columns: 3.25rem minmax(0, 1fr); } .customer-order-row > .text-end { grid-column: 2; text-align: left !important; } }
</style>
