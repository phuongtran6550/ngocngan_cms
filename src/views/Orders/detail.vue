<template>
  <section>
    <LoadingSkeleton v-if="loading" />
    <div v-else-if="pageError && !order" class="alert alert-subtle-danger" role="alert">{{ pageError }}</div>
    <template v-else-if="order">
      <PageHeader :title="order.orderCode" :description="`${order.name || 'Khách chưa bổ sung'} · ${dateTime(order.createdAt)}`">
        <template #actions>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <CustomerInfoStatusBadge :status="order.customerInfoStatus" />
            <OrderStatusBadge :status="order.status" />
          </div>
          <div class="d-flex align-items-center gap-2 flex-nowrap ms-auto">
            <RouterLink class="btn btn-sm btn-phoenix-secondary" to="/orders" title="Danh sách đơn hàng">
              <AppIcon name="arrow-left" class="me-sm-1" />
              <span class="d-none d-sm-inline">Danh sách</span>
            </RouterLink>
            <button
              v-if="auth.can('orders.update') && order.customerInfoStatus !== 'complete'"
              type="button"
              class="btn btn-sm btn-primary text-nowrap"
              @click="reviewOpen = true"
            >
              <span class="d-none d-sm-inline">{{ order.customerInfoStatus === 'review_required' ? 'Kiểm duyệt' : 'Bổ sung khách hàng' }}</span>
              <span class="d-sm-none">{{ order.customerInfoStatus === 'review_required' ? 'Duyệt' : 'Bổ sung' }}</span>
            </button>
            <div v-if="hasOrderActions" ref="actionMenu" class="dropdown">
              <button
                type="button"
                class="btn btn-sm btn-phoenix-secondary dropdown-toggle d-flex align-items-center gap-1"
                :aria-expanded="actionMenuOpen"
                :disabled="saving"
                data-testid="order-action-dropdown-btn"
                @click.stop="actionMenuOpen = !actionMenuOpen"
              >
                <span>Thao tác</span>
              </button>
              <div
                v-if="actionMenuOpen"
                class="dropdown-menu dropdown-menu-end py-2 shadow-sm show"
                role="menu"
                style="z-index: 1050; min-width: 11rem;"
              >
                <button
                  v-if="canReturn"
                  type="button"
                  class="dropdown-item d-flex align-items-center gap-2"
                  :disabled="saving"
                  @click="triggerAction('return')"
                >
                  <AppIcon name="refresh" class="text-warning" />
                  <span>Đổi trả</span>
                </button>
                <button
                  v-if="canCancel"
                  type="button"
                  class="dropdown-item d-flex align-items-center gap-2 text-danger"
                  :disabled="saving"
                  @click="triggerAction('cancel')"
                >
                  <AppIcon name="close" />
                  <span>Hủy đơn</span>
                </button>
                <div v-if="canDelete && (canReturn || canCancel)" class="dropdown-divider" />
                <button
                  v-if="canDelete"
                  type="button"
                  class="dropdown-item d-flex align-items-center gap-2 text-danger"
                  :disabled="saving"
                  @click="triggerAction('delete')"
                >
                  <AppIcon name="trash-2" />
                  <span class="fw-medium">Xóa vĩnh viễn</span>
                </button>
              </div>
            </div>
          </div>
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
            <div class="card-body">
              <DetailDefinitionList :fields="detailFields" />
              <div v-if="hasOrderActions" class="d-md-none border-top border-translucent mt-3 pt-3">
                <div class="text-body-tertiary fs-10 fw-semibold mb-2">Thao tác đơn hàng</div>
                <div class="d-flex flex-wrap gap-2">
                  <button
                    v-if="canReturn"
                    type="button"
                    class="btn btn-sm btn-phoenix-warning d-flex align-items-center gap-1"
                    :disabled="saving"
                    @click="triggerAction('return')"
                  >
                    <AppIcon name="refresh" />
                    <span>Đổi trả</span>
                  </button>
                  <button
                    v-if="canCancel"
                    type="button"
                    class="btn btn-sm btn-phoenix-danger d-flex align-items-center gap-1"
                    :disabled="saving"
                    @click="triggerAction('cancel')"
                  >
                    <AppIcon name="close" />
                    <span>Hủy đơn</span>
                  </button>
                  <button
                    v-if="canDelete"
                    type="button"
                    class="btn btn-sm btn-danger d-flex align-items-center gap-1 ms-auto"
                    :disabled="saving"
                    @click="triggerAction('delete')"
                  >
                    <AppIcon name="trash-2" />
                    <span>Xóa vĩnh viễn</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
          <article class="card overflow-hidden">
            <div class="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between"><h2 class="fs-7 mb-0">Sản phẩm đã bán</h2><span class="badge badge-phoenix badge-phoenix-primary">{{ order.items.length }} SKU</span></div>
            <div v-if="!order.items.length" class="card-body text-body-tertiary">Đơn cũ chưa lưu chi tiết SKU.</div>
            <div v-else class="order-product-lines">
              <article v-for="item in order.items" :key="item.id || `${item.skuId}-${item.category}`" class="order-product-line">
                <RouterLink v-if="item.skuId && item.thumbnail" :to="`/products/${item.skuId}`" class="order-product-line__thumb-link">
                  <img :src="assetUrl(item.thumbnail)" :alt="item.productName" />
                </RouterLink>
                <img v-else-if="item.thumbnail" :src="assetUrl(item.thumbnail)" :alt="item.productName" />
                <div class="order-product-line__copy">
                  <RouterLink v-if="item.skuId" :to="`/products/${item.skuId}`" class="fw-bold text-decoration-none">{{ item.productName || item.category }}</RouterLink>
                  <strong v-else>{{ item.productName || item.category }}</strong>
                  <RouterLink v-if="item.skuId" :to="`/products/${item.skuId}`" class="text-decoration-none">
                    <code class="order-product-line__sku">{{ item.skuCode || item.barcode || "SKU cũ" }}</code>
                  </RouterLink>
                  <code v-else>{{ item.skuCode || item.barcode || "SKU cũ" }}</code>
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
    <ConfirmDialog :open="Boolean(confirmAction)" :title="actionConfirmation.title" :message="actionConfirmation.message" :confirm-label="actionConfirmation.label" @cancel="confirmAction = ''" @confirm="runAction" />
    <ImagePreview :src="preview" :alt="order?.orderCode || 'Ảnh đơn hàng'" @close="preview = ''" />
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import DetailDefinitionList from "@/components/app/DetailDefinitionList.vue";
import PageHeader from "@/components/app/PageHeader.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import ImagePreview from "@/components/media/ImagePreview.vue";
import ResourceImageCard from "@/components/media/ResourceImageCard.vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import {
  createDropdownBehavior,
  type DropdownBehavior,
} from "@/components/dropdown/behavior";
import CustomerInfoStatusBadge from "@/views/Orders/components/CustomerInfoStatusBadge.vue";
import OrderCustomerReview from "@/views/Orders/components/OrderCustomerReview.vue";
import OrderStatusBadge from "@/views/Orders/components/OrderStatusBadge.vue";
import { orderService } from "@/views/Orders/service";
import { useOrderStore } from "@/views/Orders/store";
import type { OcrReviewOutcome, Order } from "@/views/Orders/types";
import { apiError, assetUrl } from "@/request";
import { authenStore } from "@/stores/app-authen";
import { formatDateTime, formatMoney } from "@/utils/resource-display";

export default defineComponent({
  name: "OrderDetailPage",
  components: {
    AppIcon,
    ConfirmDialog,
    CustomerInfoStatusBadge,
    DetailDefinitionList,
    DrawerPanel,
    ImagePreview,
    LoadingSkeleton,
    OrderCustomerReview,
    OrderStatusBadge,
    PageHeader,
    ResourceImageCard,
  },
  data() {
    return {
      order: null as Order | null,
      loading: true,
      saving: false,
      reviewOpen: false,
      error: "",
      message: "",
      preview: "",
      confirmAction: "" as "" | "return" | "cancel" | "delete",
      actionMenuOpen: false,
      dropdown: null as DropdownBehavior | null,
    };
  },
  computed: {
    auth() { return authenStore(); },
    canReturn(): boolean {
      return Boolean(this.auth.can("orders.update") && this.order?.status === "completed");
    },
    canCancel(): boolean {
      return Boolean(this.auth.can("orders.delete") && this.order?.status === "completed");
    },
    canDelete(): boolean {
      return Boolean(this.auth.isAdmin);
    },
    hasOrderActions(): boolean {
      return this.canReturn || this.canCancel || this.canDelete;
    },
    actionConfirmation(): { title: string; message: string; label: string } {
      if (this.confirmAction === "delete") return {
        title: "Xóa vĩnh viễn đơn hàng",
        message: `Đơn ${this.order?.orderCode || ""} và chi tiết sản phẩm sẽ bị xóa, không thể khôi phục. ${this.order?.status === "completed" ? "Các món đã bán sẽ được hoàn lại tồn kho." : "Đơn đã hủy hoặc đổi trả sẽ không được hoàn tồn thêm lần nữa."}`,
        label: "Xóa vĩnh viễn",
      };
      return this.confirmAction === "return"
        ? { title: "Xác nhận đổi trả", message: "Đơn chuyển sang đổi trả và toàn bộ SKU được hoàn lại tồn kho.", label: "Đổi trả và hoàn tồn" }
        : { title: "Hủy đơn hàng", message: "Đơn chuyển sang đã hủy và toàn bộ SKU được hoàn lại tồn kho.", label: "Hủy và hoàn tồn" };
    },
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
  mounted() {
    this.dropdown = createDropdownBehavior(
      () => this.$refs.actionMenu as HTMLElement | undefined,
      () => {
        this.actionMenuOpen = false;
      },
    );
    this.dropdown.mount();
    void this.load();
  },
  beforeUnmount() {
    this.dropdown?.dispose();
  },
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
    triggerAction(action: "return" | "cancel" | "delete"): void {
      this.actionMenuOpen = false;
      this.confirmAction = action;
    },
    async load(): Promise<void> { this.loading = true; this.error = ""; try { this.order = await orderService.detail(String(this.$route.params.id)); } catch (error) { this.error = apiError(error).message; } finally { this.loading = false; } },
    async saveCustomer(value: { name: string; phone: string; review: boolean }): Promise<void> {
      if (!this.order) return; this.saving = true; this.error = "";
      try { this.order = await (value.review ? orderService.reviewCustomerInfo(this.order.id, value.name, value.phone) : orderService.completeCustomerInfo(this.order.id, value.name, value.phone)); this.reviewOpen = false; this.message = "Đã xác nhận thông tin khách hàng"; }
      catch (error) { this.error = apiError(error).message; }
      finally { this.saving = false; }
    },
    async runAction(): Promise<void> {
      if (!this.order || !this.confirmAction || this.saving) return;
      const action = this.confirmAction;
      if (action === "delete" && !this.auth.isAdmin) return;
      this.confirmAction = ""; this.error = ""; this.message = ""; this.saving = true;
      try {
        if (action === "delete") {
          await orderService.permanentDelete(this.order.id);
          useOrderStore().message = "Đã xóa vĩnh viễn đơn hàng";
          await this.$router.push("/orders");
        } else if (action === "return") {
          this.order = await orderService.markReturned(this.order.id); this.message = "Đã đổi trả và hoàn tồn kho";
        } else {
          await orderService.remove(this.order.id); await this.load(); this.message = "Đã hủy đơn và hoàn tồn kho";
        }
      }
      catch (error) { this.error = apiError(error).message; }
      finally { this.saving = false; }
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
.order-product-line__thumb-link { display: block; width: 4rem; height: 4rem; border-radius: .65rem; overflow: hidden; transition: opacity 150ms ease, transform 150ms ease; }
.order-product-line__thumb-link:hover { opacity: .85; transform: scale(1.02); }
.order-product-line__copy { display: grid; min-width: 0; gap: .15rem; }
.order-product-line__copy code, .order-product-line__copy small { color: var(--phoenix-secondary-color); }
.order-product-line__sku { transition: color 150ms ease; }
.order-product-line__sku:hover { color: var(--phoenix-primary) !important; text-decoration: underline; }
.order-product-line__price { display: grid; gap: .15rem; text-align: right; }
.order-product-line__price span { color: var(--phoenix-secondary-color); font-size: .75rem; }
@media (max-width: 991.98px) { .order-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 575.98px) { .order-kpis { grid-template-columns: 1fr; } .order-product-line { grid-template-columns: 3.5rem minmax(0, 1fr); } .order-product-line img { width: 3.5rem; height: 3.5rem; } .order-product-line__price { grid-column: 2; text-align: left; } }
</style>
