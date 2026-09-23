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
                <button
                  v-if="canRestore"
                  type="button"
                  class="dropdown-item d-flex align-items-center gap-2 text-success"
                  :disabled="saving"
                  @click="triggerAction('restore')"
                >
                  <AppIcon name="refresh" />
                  <span>Khôi phục đơn</span>
                </button>
                <div v-if="canDelete && (canReturn || canCancel || canRestore)" class="dropdown-divider" />
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
                    v-if="canRestore"
                    type="button"
                    class="btn btn-sm btn-phoenix-success d-flex align-items-center gap-1"
                    :disabled="saving"
                    @click="triggerAction('restore')"
                  >
                    <AppIcon name="refresh" />
                    <span>Khôi phục đơn</span>
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
          <article class="card sold-products-card overflow-hidden border border-translucent shadow-sm">
            <div class="card-header bg-body-tertiary bg-opacity-25 border-bottom py-3 px-3 px-sm-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div class="d-flex align-items-center gap-2">
                <div class="sold-header-icon">
                  <AppIcon name="gem" />
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <h2 class="fs-8 fs-sm-7 fw-bold mb-0 text-body-emphasis">Sản phẩm đã bán</h2>
                    <span class="badge badge-phoenix badge-phoenix-primary fs-10 px-2 py-0.5">{{ order.items.length }} SKU</span>
                  </div>
                  <p class="fs-10 text-body-tertiary mb-0 mt-0.5">Danh sách mặt hàng và SKU xuất kho trong giao dịch</p>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2 ms-auto">
                <span class="badge badge-phoenix badge-phoenix-info fs-10 px-2.5 py-1">
                  Tổng {{ itemQuantity }} món
                </span>
              </div>
            </div>

            <div v-if="!order.items.length" class="card-body text-center py-5 px-3">
              <div class="sold-empty-icon mx-auto mb-3">
                <AppIcon name="archive" />
              </div>
              <h3 class="fs-8 fw-semibold text-body-emphasis mb-1">Chưa lưu chi tiết SKU</h3>
              <p class="fs-9 text-body-tertiary mb-0 mx-auto" style="max-width: 320px;">
                Đơn hàng này được tạo từ hệ thống cũ hoặc chưa lưu thông tin từng dòng SKU.
              </p>
            </div>

            <div v-else class="sold-products-list p-3 p-sm-4">
              <article
                v-for="(item, index) in order.items"
                :key="item.id || `${item.skuId}-${item.category}-${index}`"
                class="sold-product-item"
              >
                <!-- Thumbnail & Preview -->
                <div class="sold-product-thumb-box">
                  <button
                    v-if="item.thumbnail"
                    type="button"
                    class="sold-product-thumb-btn"
                    :title="`Xem ảnh ${item.productName || item.category || 'sản phẩm'}`"
                    @click="preview = assetUrl(item.thumbnail)"
                  >
                    <img
                      :src="assetUrl(item.thumbnail)"
                      :alt="item.productName || item.category || 'Ảnh sản phẩm'"
                      class="sold-product-thumb-img"
                      loading="lazy"
                    />
                    <span class="sold-product-thumb-hover">
                      <AppIcon name="eye" />
                    </span>
                  </button>
                  <div v-else class="sold-product-thumb-fallback" title="Không có ảnh sản phẩm">
                    <AppIcon name="gem" />
                  </div>
                </div>

                <!-- Product Info & Jewelry Attributes -->
                <div class="sold-product-main">
                  <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-1">
                    <div class="sold-product-heading">
                      <RouterLink
                        v-if="item.skuId"
                        :to="`/products/${item.skuId}`"
                        class="sold-product-name text-decoration-none fw-bold"
                        :title="`Xem chi tiết sản phẩm: ${item.productName || item.category}`"
                      >
                        <span>{{ item.productName || item.category || 'Sản phẩm' }}</span>
                        <AppIcon name="external-link" class="sold-link-icon ms-1" />
                      </RouterLink>
                      <span v-else class="sold-product-name fw-bold text-body-emphasis">
                        {{ item.productName || item.category || 'Sản phẩm' }}
                      </span>
                    </div>

                    <!-- SKU / Barcode Pill -->
                    <div class="sold-product-sku-wrap">
                      <RouterLink
                        v-if="item.skuId"
                        :to="`/products/${item.skuId}`"
                        class="sold-sku-code text-decoration-none"
                        title="Xem SKU trong kho"
                      >
                        <AppIcon name="scan-line" class="sold-sku-icon me-1" />
                        <span>{{ item.skuCode || item.barcode || 'SKU cũ' }}</span>
                      </RouterLink>
                      <span v-else class="sold-sku-code">
                        <AppIcon name="scan-line" class="sold-sku-icon me-1" />
                        <span>{{ item.skuCode || item.barcode || 'SKU cũ' }}</span>
                      </span>
                    </div>
                  </div>

                  <!-- Jewelry Attribute Chips -->
                  <div class="sold-product-tags d-flex flex-wrap align-items-center gap-1.5 mt-2">
                    <span v-if="item.category" class="sold-tag sold-tag-category">
                      <AppIcon name="tag" class="sold-tag-icon me-1" />
                      <span>{{ item.category }}</span>
                    </span>
                    <span v-if="item.material" class="sold-tag sold-tag-material">
                      <AppIcon name="gem" class="sold-tag-icon me-1" />
                      <span>{{ item.material }}</span>
                    </span>
                    <span v-if="item.weight" class="sold-tag sold-tag-weight">
                      <span class="sold-tag-label me-1">KL:</span>
                      <strong>{{ item.weight }}g</strong>
                    </span>
                    <span v-if="item.size" class="sold-tag sold-tag-size">
                      <span class="sold-tag-label me-1">Size:</span>
                      <strong>{{ item.size }}</strong>
                    </span>
                    <span v-if="item.pattern" class="sold-tag sold-tag-pattern">
                      <span>{{ item.pattern }}</span>
                    </span>
                  </div>
                </div>

                <!-- Pricing & Quantity Column -->
                <div class="sold-product-pricing">
                  <div class="sold-pricing-calc">
                    <span class="sold-qty-badge">
                      x{{ item.quantity }}
                    </span>
                    <span class="sold-unit-rate text-body-tertiary">
                      {{ money(item.unitPrice) }}
                    </span>
                  </div>
                  <div class="sold-line-total text-primary fw-bolder font-monospace">
                    {{ money(item.lineTotal) }}
                  </div>
                </div>
              </article>
            </div>

            <!-- Card Summary Footer -->
            <div v-if="order.items.length" class="card-footer bg-body-tertiary bg-opacity-25 border-top py-3 px-3 px-sm-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div class="d-flex align-items-center gap-2 text-body-secondary fs-9">
                <AppIcon name="shopping-cart" class="text-body-tertiary" />
                <span>Tổng cộng <strong class="text-body-emphasis">{{ itemQuantity }}</strong> món hàng ({{ order.items.length }} SKU)</span>
              </div>
              <div class="d-flex align-items-baseline gap-2 ms-auto">
                <span class="text-body-tertiary fs-9">Thành tiền:</span>
                <span class="fs-7 fw-bolder text-primary font-monospace">{{ money(order.price) }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </template>

    <DrawerPanel :open="reviewOpen" title="Đối chiếu thông tin khách hàng" wide @close="reviewOpen = false">
      <OrderCustomerReview v-if="order" :order="order" :submitting="saving" :error="error" @submit="saveCustomer" />
    </DrawerPanel>
    <ConfirmDialog :open="Boolean(confirmAction)" :title="actionConfirmation.title" :message="actionConfirmation.message" :confirm-label="actionConfirmation.label" :confirm-variant="actionConfirmation.variant || 'danger'" @cancel="confirmAction = ''" @confirm="runAction" />
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
      confirmAction: "" as "" | "return" | "cancel" | "delete" | "restore",
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
    canRestore(): boolean {
      return Boolean(
        (this.auth.can("orders.delete") || this.auth.can("orders.update")) &&
        this.order?.status === "cancelled"
      );
    },
    canDelete(): boolean {
      return Boolean(this.auth.isAdmin);
    },
    hasOrderActions(): boolean {
      return this.canReturn || this.canCancel || this.canRestore || this.canDelete;
    },
    actionConfirmation(): { title: string; message: string; label: string; variant?: string } {
      if (this.confirmAction === "delete") return {
        title: "Xóa vĩnh viễn đơn hàng",
        message: `Đơn ${this.order?.orderCode || ""} và chi tiết sản phẩm sẽ bị xóa, không thể khôi phục. ${this.order?.status === "completed" ? "Các món đã bán sẽ được hoàn lại tồn kho." : "Đơn đã hủy hoặc đổi trả sẽ không được hoàn tồn thêm lần nữa."}`,
        label: "Xóa vĩnh viễn",
      };
      if (this.confirmAction === "restore") return {
        title: "Khôi phục đơn hàng",
        message: "Đơn hàng sẽ được khôi phục về trạng thái hoàn tất và toàn bộ SKU sẽ được trừ lại vào tồn kho.",
        label: "Khôi phục đơn hàng",
        variant: "success",
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
    triggerAction(action: "return" | "cancel" | "delete" | "restore"): void {
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
        } else if (action === "restore") {
          this.order = await orderService.restore(this.order.id); this.message = "Đã khôi phục đơn và cập nhật tồn kho";
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

/* Sold Products Card & Items */
.sold-header-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.625rem;
  background: rgba(var(--phoenix-primary-rgb), 0.1);
  color: var(--phoenix-primary);
  flex-shrink: 0;
}

.sold-empty-icon {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--phoenix-body-highlight-bg);
  color: var(--phoenix-secondary-color);
}

.sold-products-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sold-product-item {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.875rem 1rem;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.75rem;
  background-color: var(--phoenix-body-bg);
  transition: all 0.2s ease;
}

.sold-product-item:hover {
  background-color: var(--phoenix-body-highlight-bg);
  border-color: rgba(var(--phoenix-primary-rgb), 0.35);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transform: translateY(-1px);
}

.sold-product-thumb-box {
  width: 4.5rem;
  height: 4.5rem;
  flex-shrink: 0;
}

.sold-product-thumb-btn {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.625rem;
  overflow: hidden;
  position: relative;
  background: var(--phoenix-body-highlight-bg);
  cursor: pointer;
  display: block;
}

.sold-product-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.sold-product-thumb-hover {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sold-product-thumb-btn:hover .sold-product-thumb-hover {
  opacity: 1;
}

.sold-product-thumb-btn:hover .sold-product-thumb-img {
  transform: scale(1.08);
}

.sold-product-thumb-fallback {
  width: 100%;
  height: 100%;
  border: 1px dashed var(--phoenix-border-color-translucent);
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--phoenix-body-highlight-bg);
  color: var(--phoenix-secondary-color);
  opacity: 0.75;
}

.sold-product-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sold-product-name {
  font-size: 0.925rem;
  color: var(--phoenix-emphasis-color);
  transition: color 0.15s ease;
}

.sold-product-name:hover {
  color: var(--phoenix-primary);
}

.sold-link-icon {
  width: 13px;
  height: 13px;
  opacity: 0.55;
  vertical-align: -1px;
}

.sold-product-name:hover .sold-link-icon {
  opacity: 1;
}

.sold-sku-code {
  display: inline-flex;
  align-items: center;
  font-family: var(--phoenix-font-monospace);
  font-size: 0.725rem;
  padding: 0.2rem 0.5rem;
  background: var(--phoenix-body-highlight-bg);
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.375rem;
  color: var(--phoenix-secondary-color);
  transition: all 0.15s ease;
}

.sold-sku-code:hover {
  color: var(--phoenix-primary);
  border-color: rgba(var(--phoenix-primary-rgb), 0.5);
}

.sold-sku-icon {
  width: 12px;
  height: 12px;
}

.sold-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.sold-tag-icon {
  width: 11px;
  height: 11px;
}

.sold-tag-category {
  background: rgba(var(--phoenix-primary-rgb), 0.08);
  color: var(--phoenix-primary);
  border-color: rgba(var(--phoenix-primary-rgb), 0.2);
}

.sold-tag-material {
  background: rgba(var(--phoenix-warning-rgb), 0.1);
  color: var(--phoenix-warning-emphasis, #b27300);
  border-color: rgba(var(--phoenix-warning-rgb), 0.25);
}

.sold-tag-weight {
  background: rgba(var(--phoenix-info-rgb), 0.08);
  color: var(--phoenix-info);
  border-color: rgba(var(--phoenix-info-rgb), 0.2);
}

.sold-tag-size {
  background: var(--phoenix-body-highlight-bg);
  color: var(--phoenix-secondary-color);
  border-color: var(--phoenix-border-color-translucent);
}

.sold-tag-pattern {
  background: var(--phoenix-body-highlight-bg);
  color: var(--phoenix-body-color);
  border-color: var(--phoenix-border-color-translucent);
}

.sold-product-pricing {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  text-align: right;
  flex-shrink: 0;
}

.sold-pricing-calc {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
}

.sold-qty-badge {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  background: rgba(var(--phoenix-secondary-rgb, 108, 117, 125), 0.12);
  border-radius: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--phoenix-secondary-color);
}

.sold-line-total {
  font-size: 1.05rem;
  letter-spacing: -0.01em;
}

@media (max-width: 991.98px) {
  .order-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 575.98px) {
  .order-kpis { grid-template-columns: 1fr; }
  .sold-product-item {
    grid-template-columns: 3.5rem minmax(0, 1fr);
    gap: 0.75rem;
  }
  .sold-product-thumb-box {
    width: 3.5rem;
    height: 3.5rem;
  }
  .sold-product-pricing {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.65rem;
    border-top: 1px dashed var(--phoenix-border-color-translucent);
    margin-top: 0.25rem;
  }
}
</style>
