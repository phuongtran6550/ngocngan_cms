<template>
  <section>
    <LoadingSkeleton v-if="loading" />
    <div v-else-if="pageError && !order" class="alert alert-subtle-danger" role="alert">{{ pageError }}</div>
    <template v-else-if="order">
      <PageHeader :title="order.orderCode" :description="`${order.name || 'Khách chưa bổ sung'} · ${dateTime(order.createdAt)}`">
        <template #actions>
          <CustomerInfoStatusBadge :status="order.customerInfoStatus" />
          <OrderStatusBadge :status="order.status" />
          <RouterLink class="btn btn-phoenix-secondary" to="/orders">Danh sách</RouterLink>
          <button v-if="auth.can('orders.update') && order.customerInfoStatus !== 'complete'" type="button" class="btn btn-primary" @click="reviewOpen = true">{{ order.customerInfoStatus === 'review_required' ? 'Kiểm duyệt' : 'Bổ sung khách hàng' }}</button>
          <button v-if="auth.can('orders.update') && order.status === 'completed'" type="button" class="btn btn-phoenix-warning" @click="confirmAction = 'return'">Đổi trả</button>
          <button v-if="auth.can('orders.delete') && order.status === 'completed'" type="button" class="btn btn-phoenix-danger" @click="confirmAction = 'cancel'">Hủy đơn</button>
        </template>
      </PageHeader>

      <div v-if="$route.query.created === '1'" class="alert alert-subtle-success" role="status">Đơn hàng đã được ghi nhận và tồn kho đã được trừ.</div>
      <div v-if="message" class="alert alert-subtle-success" role="status">{{ message }}</div>
      <div v-if="pageError" class="alert alert-subtle-danger" role="alert">{{ pageError }}</div>

      <div class="order-kpis mb-4">
        <article><span>Thành tiền</span><strong>{{ money(order.price) }}</strong></article>
        <article><span>Số sản phẩm</span><strong>{{ itemQuantity }} món</strong></article>
        <article><span>Khách hàng</span><strong>{{ order.name || "Chưa bổ sung" }}</strong><small>{{ order.phone || "Chưa có số điện thoại" }}</small></article>
        <article><span>Người bán</span><strong>{{ order.createdBy?.name || "—" }}</strong><small>{{ dateTime(order.createdAt) }}</small></article>
      </div>

      <div class="row g-4">
        <div class="col-12 col-lg-5">
          <ResourceImageCard :src="assetUrl(order.thumbnail)" :alt="`Ảnh ${order.orderCode}`" @preview="preview = assetUrl(order.thumbnail)" />
          <article v-if="order.customerInfoStatus !== 'complete'" class="card mt-4 border-warning-subtle">
            <div class="card-body">
              <h2 class="fs-8">Trạng thái bổ sung khách hàng</h2>
              <p class="text-body-tertiary fs-9">{{ customerStatusDescription }}</p>
              <div v-if="order.ocr.candidateName || order.ocr.candidatePhone" class="ocr-summary">
                <div><span>Tên OCR</span><strong>{{ order.ocr.candidateName || "—" }}</strong></div>
                <div><span>Số OCR</span><strong>{{ order.ocr.candidatePhone || "—" }}</strong></div>
              </div>
              <button v-if="auth.can('orders.update')" type="button" class="btn btn-primary w-100 mt-3" @click="reviewOpen = true">Mở màn hình đối chiếu</button>
            </div>
          </article>
          <article v-else-if="order.ocr.review.mode" class="card mt-4">
            <div class="card-body">
              <h2 class="fs-8">Kết quả bổ sung khách hàng</h2>
              <div class="ocr-summary">
                <div><span>Hình thức</span><strong>{{ order.ocr.review.mode === "ocr" ? "Kiểm duyệt gợi ý" : "Nhập thủ công" }}</strong></div>
                <div><span>Kết quả tên</span><strong>{{ outcomeLabel(order.ocr.review.nameOutcome) }}</strong></div>
                <div><span>Kết quả SĐT</span><strong>{{ outcomeLabel(order.ocr.review.phoneOutcome) }}</strong></div>
                <div v-if="order.ocr.extractionVersion"><span>Phiên bản đọc ảnh</span><strong>{{ order.ocr.extractionVersion }}</strong></div>
                <div><span>Thời gian xử lý</span><strong>{{ dateTime(order.ocr.review.reviewedAt || order.ocr.processedAt) }}</strong></div>
              </div>
            </div>
          </article>
        </div>
        <div class="col-12 col-lg-7">
          <article class="card mb-4">
            <div class="card-header bg-transparent border-bottom"><h2 class="fs-7 mb-0">Thông tin giao dịch</h2></div>
            <div class="card-body"><DetailDefinitionList :fields="detailFields" /></div>
          </article>
          <article class="card overflow-hidden">
            <div class="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between"><h2 class="fs-7 mb-0">Sản phẩm đã bán</h2><span class="badge badge-phoenix badge-phoenix-primary">{{ order.items.length }} SKU</span></div>
            <div v-if="!order.items.length" class="card-body text-body-tertiary">Đơn cũ chưa lưu chi tiết SKU.</div>
            <div v-else class="order-product-lines">
              <article v-for="item in order.items" :key="item.id || `${item.skuId}-${item.category}`" class="order-product-line">
                <img v-if="item.thumbnail" :src="assetUrl(item.thumbnail)" :alt="item.productName" />
                <div class="order-product-line__copy">
                  <RouterLink v-if="item.skuId" :to="`/products/${item.skuId}`" class="fw-bold text-decoration-none">{{ item.productName || item.category }}</RouterLink>
                  <strong v-else>{{ item.productName || item.category }}</strong>
                  <code>{{ item.skuCode || item.barcode || "SKU cũ" }}</code>
                  <small>{{ [item.category, item.material, item.pattern, item.size].filter(Boolean).join(" · ") }}</small>
                </div>
                <div class="order-product-line__price"><span>{{ item.quantity }} × {{ money(item.unitPrice) }}</span><strong>{{ money(item.lineTotal) }}</strong></div>
              </article>
            </div>
          </article>
        </div>
      </div>
    </template>

    <DrawerPanel :open="reviewOpen" title="Đối chiếu thông tin khách hàng" wide @close="reviewOpen = false">
      <OrderCustomerReview v-if="order" :order="order" :submitting="saving" :error="error" @submit="saveCustomer" />
    </DrawerPanel>
    <ConfirmDialog :open="Boolean(confirmAction)" :title="confirmAction === 'return' ? 'Xác nhận đổi trả' : 'Hủy đơn hàng'" :message="confirmAction === 'return' ? 'Đơn chuyển sang đổi trả và toàn bộ SKU được hoàn lại tồn kho.' : 'Đơn chuyển sang đã hủy và toàn bộ SKU được hoàn lại tồn kho.'" :confirm-label="confirmAction === 'return' ? 'Đổi trả và hoàn tồn' : 'Hủy và hoàn tồn'" @cancel="confirmAction = ''" @confirm="runAction" />
    <ImagePreview :src="preview" :alt="order?.orderCode || 'Ảnh đơn hàng'" @close="preview = ''" />
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DetailDefinitionList from "@/components/app/DetailDefinitionList.vue";
import PageHeader from "@/components/app/PageHeader.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import ImagePreview from "@/components/media/ImagePreview.vue";
import ResourceImageCard from "@/components/media/ResourceImageCard.vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import CustomerInfoStatusBadge from "@/views/Orders/components/CustomerInfoStatusBadge.vue";
import OrderCustomerReview from "@/views/Orders/components/OrderCustomerReview.vue";
import OrderStatusBadge from "@/views/Orders/components/OrderStatusBadge.vue";
import { orderService } from "@/views/Orders/service";
import type { OcrReviewOutcome, Order } from "@/views/Orders/types";
import { apiError, assetUrl } from "@/request";
import { authenStore } from "@/stores/app-authen";
import { formatDateTime, formatMoney } from "@/utils/resource-display";

export default defineComponent({
  name: "OrderDetailPage",
  components: { ConfirmDialog, CustomerInfoStatusBadge, DetailDefinitionList, DrawerPanel, ImagePreview, LoadingSkeleton, OrderCustomerReview, OrderStatusBadge, PageHeader, ResourceImageCard },
  data() { return { order: null as Order | null, loading: true, saving: false, reviewOpen: false, error: "", message: "", preview: "", confirmAction: "" as "" | "return" | "cancel" }; },
  computed: {
    auth() { return authenStore(); },
    pageError(): string { return this.error; },
    itemQuantity(): number { return this.order?.items.reduce((sum, item) => sum + item.quantity, 0) || 0; },
    customerStatusDescription(): string {
      if (!this.order) return "";
      if (this.order.customerInfoStatus === "ocr_processing") return "Google Vision đang đọc ảnh nền. Bạn vẫn có thể nhập thủ công ngay lập tức.";
      if (this.order.customerInfoStatus === "review_required") return "Google Vision đã đưa ra gợi ý; người dùng cần đối chiếu và xác nhận.";
      return "OCR không nhận được thông tin tin cậy; vui lòng nhập tên và số điện thoại thủ công.";
    },
    detailFields(): Array<{ label: string; value: string }> {
      if (!this.order) return [];
      return [
        { label: "Mã đơn", value: this.order.orderCode },
        { label: "Khách hàng", value: this.order.name || "—" },
        { label: "Số điện thoại", value: this.order.phone || "—" },
        { label: "Thành tiền", value: this.money(this.order.price) },
        { label: "Trạng thái giao dịch", value: this.order.status === "completed" ? "Hoàn tất" : this.order.status === "returned" ? "Đã đổi trả" : "Đã hủy" },
        { label: "Ngày đổi trả", value: this.dateTime(this.order.returnedAt) },
        { label: "Ngày hủy", value: this.dateTime(this.order.cancelledAt) },
      ];
    },
  },
  mounted() { void this.load(); },
  methods: {
    assetUrl,
    money(value: number): string { return formatMoney(value); },
    dateTime(value?: string): string { return formatDateTime(value); },
    outcomeLabel(value: OcrReviewOutcome): string {
      if (value === "accepted") return "Chấp nhận gợi ý";
      if (value === "corrected") return "Đã sửa gợi ý";
      if (value === "entered") return "Người dùng nhập mới";
      return "—";
    },
    async load(): Promise<void> { this.loading = true; this.error = ""; try { this.order = await orderService.detail(String(this.$route.params.id)); } catch (error) { this.error = apiError(error).message; } finally { this.loading = false; } },
    async saveCustomer(value: { name: string; phone: string; review: boolean }): Promise<void> {
      if (!this.order) return; this.saving = true; this.error = "";
      try { this.order = await (value.review ? orderService.reviewCustomerInfo(this.order.id, value.name, value.phone) : orderService.completeCustomerInfo(this.order.id, value.name, value.phone)); this.reviewOpen = false; this.message = "Đã xác nhận thông tin khách hàng"; }
      catch (error) { this.error = apiError(error).message; }
      finally { this.saving = false; }
    },
    async runAction(): Promise<void> {
      if (!this.order || !this.confirmAction) return; const action = this.confirmAction; this.confirmAction = ""; this.error = "";
      try { if (action === "return") { this.order = await orderService.markReturned(this.order.id); this.message = "Đã đổi trả và hoàn tồn kho"; } else { await orderService.remove(this.order.id); await this.load(); this.message = "Đã hủy đơn và hoàn tồn kho"; } }
      catch (error) { this.error = apiError(error).message; }
    },
  },
});
</script>

<style scoped>
.order-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.order-kpis article { display: grid; gap: .25rem; padding: 1rem; border: 1px solid var(--phoenix-border-color-translucent); border-radius: .85rem; background: var(--phoenix-body-emphasis-bg); }
.order-kpis span, .order-kpis small { color: var(--phoenix-secondary-color); font-size: .75rem; }
.order-kpis strong { font-size: 1.05rem; }
.ocr-summary { display: grid; gap: .6rem; }
.ocr-summary div { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: .5rem; border-bottom: 1px dashed var(--phoenix-border-color-translucent); }
.order-product-lines { display: grid; }
.order-product-line { display: grid; grid-template-columns: 4rem minmax(0, 1fr) auto; gap: .85rem; align-items: center; padding: 1rem; border-top: 1px solid var(--phoenix-border-color-translucent); }
.order-product-line img { width: 4rem; height: 4rem; object-fit: cover; border-radius: .65rem; }
.order-product-line__copy { display: grid; min-width: 0; gap: .15rem; }
.order-product-line__copy code, .order-product-line__copy small { color: var(--phoenix-secondary-color); }
.order-product-line__price { display: grid; gap: .15rem; text-align: right; }
.order-product-line__price span { color: var(--phoenix-secondary-color); font-size: .75rem; }
@media (max-width: 991.98px) { .order-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 575.98px) { .order-kpis { grid-template-columns: 1fr; } .order-product-line { grid-template-columns: 3.5rem minmax(0, 1fr); } .order-product-line img { width: 3.5rem; height: 3.5rem; } .order-product-line__price { grid-column: 2; text-align: left; } }
</style>
