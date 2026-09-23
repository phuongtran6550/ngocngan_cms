<template>
  <div class="order-detail-page">
    <LoadingSkeleton v-if="loading" />
    <div v-else-if="pageError && !order" class="alert alert-subtle-danger" role="alert">
      {{ pageError }}
    </div>

    <template v-else-if="order">
      <!-- Breadcrumbs & Page Header -->
      <PageHeader
        :title="order.orderCode"
        :breadcrumbs="breadcrumbs"
        :description="`Đơn bán hàng lúc ${dateTime(order.createdAt)} · Nhân viên: ${order.createdBy?.name || 'Chưa cập nhật'}`"
      >
        <template #actions>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <CustomerInfoStatusBadge :status="order.customerInfoStatus" />
            <OrderStatusBadge :status="order.status" />
          </div>

          <div class="d-flex align-items-center gap-2 flex-nowrap ms-auto">
            <!-- Copy Order Code Quick Button -->
            <button
              type="button"
              class="btn btn-sm btn-phoenix-secondary d-flex align-items-center gap-1.5"
              :title="copiedCode ? 'Đã sao chép mã đơn' : 'Sao chép mã đơn'"
              @click="copyOrderCode"
            >
              <AppIcon :name="copiedCode ? 'check' : 'copy'" />
              <span class="d-none d-sm-inline">{{ copiedCode ? 'Đã chép' : 'Chép mã' }}</span>
            </button>

            <!-- Print Order -->
            <button
              type="button"
              class="btn btn-sm btn-phoenix-secondary d-flex align-items-center gap-1.5 print-hide"
              title="In đơn hàng"
              @click="printOrder"
            >
              <AppIcon name="printer" />
              <span class="d-none d-sm-inline">In đơn</span>
            </button>

            <!-- Back to Orders List -->
            <RouterLink class="btn btn-sm btn-phoenix-secondary print-hide" to="/orders" title="Danh sách đơn hàng">
              <AppIcon name="arrow-left" class="me-sm-1" />
              <span class="d-none d-sm-inline">Danh sách</span>
            </RouterLink>

            <!-- Review / Supplement Customer Info CTA -->
            <button
              v-if="auth.can('orders.update') && order.customerInfoStatus !== 'complete'"
              type="button"
              class="btn btn-sm btn-primary text-nowrap d-flex align-items-center gap-1.5 print-hide"
              @click="reviewOpen = true"
            >
              <AppIcon name="user-check" />
              <span class="d-none d-sm-inline">{{ order.customerInfoStatus === 'review_required' ? 'Kiểm duyệt OCR' : 'Bổ sung khách' }}</span>
              <span class="d-sm-none">{{ order.customerInfoStatus === 'review_required' ? 'Duyệt' : 'Bổ sung' }}</span>
            </button>

            <!-- Order Actions Dropdown Menu -->
            <div v-if="hasOrderActions" ref="actionMenu" class="dropdown print-hide">
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
                style="z-index: 1050; min-width: 11.5rem;"
              >
                <button
                  v-if="canReturn"
                  type="button"
                  class="dropdown-item d-flex align-items-center gap-2"
                  :disabled="saving"
                  @click="triggerAction('return')"
                >
                  <AppIcon name="refresh" class="text-warning" />
                  <span>Đổi trả hàng</span>
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

      <!-- Feedback Alerts -->
      <div v-if="$route.query.created === '1'" class="alert alert-subtle-success d-flex align-items-center gap-2 mb-4" role="status">
        <AppIcon name="check-circle" class="text-success fs-8 flex-shrink-0" />
        <span>Đơn hàng đã được ghi nhận và toàn bộ sản phẩm SKU đã được trừ tồn kho thành công.</span>
      </div>
      <div v-if="message" class="alert alert-subtle-success d-flex align-items-center gap-2 mb-4" role="status">
        <AppIcon name="check-circle" class="text-success fs-8 flex-shrink-0" />
        <span>{{ message }}</span>
      </div>
      <div v-if="pageError" class="alert alert-subtle-danger d-flex align-items-center gap-2 mb-4" role="alert">
        <AppIcon name="alert-circle" class="text-danger fs-8 flex-shrink-0" />
        <span>{{ pageError }}</span>
      </div>

      <!-- Hero KPI Banner -->
      <div class="order-kpi-grid mb-4">
        <!-- Metric 1: Total Price -->
        <article class="order-kpi-card is-highlight">
          <div class="kpi-icon-badge text-primary">
            <AppIcon name="gem" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Tổng thanh toán</span>
            <strong class="kpi-value text-primary font-monospace">{{ money(order.price) }}</strong>
            <small class="kpi-sub">
              {{ order.status === 'completed' ? 'Giao dịch hoàn tất' : order.status === 'returned' ? 'Đã đổi trả hàng' : 'Đã hủy đơn' }}
            </small>
          </div>
        </article>

        <!-- Metric 2: Quantity -->
        <article class="order-kpi-card">
          <div class="kpi-icon-badge text-info">
            <AppIcon name="shopping-cart" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Hàng xuất kho</span>
            <strong class="kpi-value">{{ itemQuantity }} món</strong>
            <small class="kpi-sub">{{ order.items.length }} dòng SKU mặt hàng</small>
          </div>
        </article>

        <!-- Metric 3: Customer -->
        <article class="order-kpi-card">
          <div class="kpi-icon-badge text-success">
            <AppIcon name="user" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Khách hàng</span>
            <strong class="kpi-value text-truncate" :title="order.name || 'Khách vãng lai'">
              {{ order.name || 'Khách vãng lai' }}
            </strong>
            <small class="kpi-sub">
              <RouterLink
                v-if="order.phone"
                :to="`/customers/${order.phone}`"
                class="text-decoration-none text-body-secondary hover-primary font-monospace"
                title="Xem lịch sử mua hàng"
              >
                {{ order.phone }}
                <AppIcon name="external-link" class="kpi-mini-icon ms-0.5" />
              </RouterLink>
              <span v-else class="text-body-tertiary">Chưa lưu số điện thoại</span>
            </small>
          </div>
        </article>

        <!-- Metric 4: Staff & Timestamp -->
        <article class="order-kpi-card">
          <div class="kpi-icon-badge text-secondary">
            <AppIcon name="user-check" />
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Nhân sự lập phiếu</span>
            <strong class="kpi-value text-truncate" :title="order.createdBy?.name || 'Nhân viên bán lẻ'">
              {{ order.createdBy?.name || 'Nhân viên bán lẻ' }}
            </strong>
            <small class="kpi-sub">{{ dateTime(order.createdAt) }}</small>
          </div>
        </article>
      </div>

      <!-- Main Layout: 2 Columns (Left: Large Bill & Customer | Right: Sold Products & Timeline) -->
      <div class="row g-4">
        <!-- Left Column: Large Bill Image & Customer Profile (Col-12 Col-lg-5 Col-xl-5) -->
        <div class="col-12 col-lg-5 col-xl-5">
          <!-- Card: Large Order Bill & Receipt Photo Viewer -->
          <article class="card border border-translucent shadow-sm receipt-card mb-4">
            <div class="card-header bg-transparent border-bottom py-3 px-3 px-sm-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div class="d-flex align-items-center gap-2">
                <div class="sidebar-card-icon text-info">
                  <AppIcon name="image" />
                </div>
                <div>
                  <h2 class="fs-8 fw-bold mb-0 text-body-emphasis">Hóa đơn & Chứng từ gốc</h2>
                  <p class="fs-10 text-body-tertiary mb-0 mt-0.5">Ảnh chụp đối chiếu khi tạo đơn hàng</p>
                </div>
              </div>

              <!-- Bill Tools (Zoom, Rotate, Fullscreen, Open in Tab) -->
              <div class="d-flex align-items-center gap-1.5 ms-auto">
                <span v-if="gallery.length" class="badge badge-phoenix badge-phoenix-info fs-10 me-1">
                  {{ gallery.length }} ảnh
                </span>

                <!-- Zoom Toggle Button -->
                <button
                  type="button"
                  class="btn btn-xs btn-phoenix-secondary d-flex align-items-center gap-1"
                  :class="{ 'btn-primary text-white': isZoomed }"
                  :title="isZoomed ? 'Thu nhỏ về vừa khung' : 'Phóng to 1.8x để soi nét chữ'"
                  @click="toggleZoom"
                >
                  <AppIcon name="search" />
                  <span class="d-none d-sm-inline">{{ isZoomed ? '1x' : '1.8x' }}</span>
                </button>

                <!-- Rotate Image Button -->
                <button
                  type="button"
                  class="btn btn-xs btn-phoenix-secondary d-flex align-items-center gap-1"
                  title="Xoay ảnh 90 độ"
                  @click="rotateImage"
                >
                  <AppIcon name="refresh" />
                  <span v-if="rotation" class="fs-10 fw-bold">{{ rotation }}°</span>
                </button>

                <!-- Open in New Tab Button -->
                <button
                  type="button"
                  class="btn btn-xs btn-phoenix-secondary d-flex align-items-center gap-1"
                  title="Mở ảnh gốc 100% trong tab mới để xem siêu nét"
                  @click="openOriginalImage"
                >
                  <AppIcon name="external-link" />
                </button>

                <!-- Lightbox Fullscreen Button -->
                <button
                  type="button"
                  class="btn btn-xs btn-primary d-flex align-items-center gap-1"
                  title="Phóng to toàn màn hình"
                  @click="preview = assetUrl(activeImage)"
                >
                  <AppIcon name="eye" />
                </button>
              </div>
            </div>

            <div class="card-body p-3 p-sm-4">
              <!-- Main Active Image Viewer (Large & Prominent) -->
              <div
                v-if="activeImage"
                class="receipt-frame-container"
                :class="{ 'is-zoomed': isZoomed }"
              >
                <div
                  class="receipt-image-stage"
                  @click="handleImageStageClick"
                >
                  <img
                    :src="assetUrl(activeImage)"
                    :alt="`Ảnh chứng từ đơn ${order.orderCode}`"
                    class="receipt-frame-img"
                    :style="imageTransformStyle"
                    loading="eager"
                  />
                </div>

                <!-- Hover Overlay Badge (when not zoomed) -->
                <div v-if="!isZoomed" class="receipt-frame-overlay" @click="preview = assetUrl(activeImage)">
                  <div class="receipt-overlay-pill">
                    <AppIcon name="eye" class="me-1.5" />
                    <span>Bấm xem phóng to toàn màn hình</span>
                  </div>
                </div>
              </div>

              <!-- Fallback if no images -->
              <div v-else class="receipt-fallback p-5 text-center rounded-3 border border-dashed border-translucent">
                <AppIcon name="image" class="text-body-tertiary fs-4 mb-2" />
                <p class="fs-8 text-body-emphasis fw-semibold mb-1">Chưa có ảnh hóa đơn kèm theo</p>
                <p class="fs-9 text-body-tertiary mb-0">Đơn hàng này được tạo trực tiếp mà không tải lên ảnh chứng từ.</p>
              </div>

              <!-- Bottom Bar Info & Gallery Strip -->
              <div v-if="activeImage" class="d-flex align-items-center justify-content-between gap-2 mt-2 pt-1 text-body-tertiary fs-10">
                <div class="d-flex align-items-center gap-1 text-truncate">
                  <AppIcon name="help-circle" />
                  <span>Dùng thanh công cụ bên trên để xoay ảnh, phóng to hoặc mở tab mới.</span>
                </div>
                <button
                  type="button"
                  class="btn btn-link p-0 fs-10 text-primary text-decoration-none text-nowrap"
                  @click="openOriginalImage"
                >
                  Mở ảnh gốc
                </button>
              </div>

              <!-- Thumbnails Gallery Strip if Multiple Photos -->
              <div v-if="gallery.length > 1" class="receipt-thumbs-strip mt-3 pt-2 border-top border-translucent">
                <div class="text-body-tertiary fs-10 fw-semibold mb-2">Ảnh chứng từ khác ({{ gallery.length }} ảnh):</div>
                <div class="d-flex gap-2 overflow-x-auto pb-1">
                  <button
                    v-for="(photo, index) in gallery"
                    :key="`${photo}-${index}`"
                    type="button"
                    class="receipt-thumb-item"
                    :class="{ 'is-active': photo === activeImage }"
                    :title="`Xem ảnh chứng từ số ${index + 1}`"
                    @click="selectPhoto(photo)"
                  >
                    <img :src="assetUrl(photo)" :alt="`Ảnh ${index + 1}`" />
                    <span class="receipt-thumb-badge">{{ index + 1 }}</span>
                  </button>
                </div>
              </div>

              <!-- Raw OCR Text Expander if available -->
              <details v-if="order.ocr.rawText" class="mt-3 pt-2 border-top border-translucent">
                <summary class="fs-10 fw-semibold text-body-secondary cursor-pointer">
                  <span>Chi tiết văn bản nhận diện OCR từ ảnh</span>
                </summary>
                <pre class="ocr-raw-text mt-2 mb-0 p-2.5 rounded-2 bg-body-highlight border border-translucent fs-10 font-monospace">{{ order.ocr.rawText }}</pre>
              </details>
            </div>
          </article>

          <!-- Card: Customer Profile (Directly underneath Bill for easy comparison) -->
          <article class="card border border-translucent shadow-sm mb-4">
            <div class="card-header bg-transparent border-bottom py-3 px-3 px-sm-4 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="sidebar-card-icon text-success">
                  <AppIcon name="user" />
                </div>
                <h2 class="fs-8 fw-bold mb-0 text-body-emphasis">Hồ sơ khách hàng</h2>
              </div>
              <CustomerInfoStatusBadge :status="order.customerInfoStatus" />
            </div>

            <div class="card-body p-3 p-sm-4">
              <div class="customer-profile-block mb-3">
                <div class="customer-avatar">
                  {{ customerInitials }}
                </div>
                <div class="customer-meta min-w-0">
                  <h3 class="fs-8 fw-bold text-body-emphasis mb-0.5 text-truncate" :title="order.name || 'Chưa bổ sung tên'">
                    {{ order.name || 'Chưa bổ sung tên' }}
                  </h3>
                  <div v-if="order.phone" class="d-flex align-items-center gap-2 flex-wrap">
                    <a :href="`tel:${order.phone}`" class="text-decoration-none text-body-secondary font-monospace fs-9 hover-primary" title="Gọi điện">
                      <AppIcon name="phone" class="fs-10 me-1" />
                      <span>{{ order.phone }}</span>
                    </a>
                    <RouterLink
                      :to="`/customers/${order.phone}`"
                      class="badge badge-phoenix badge-phoenix-primary fs-10 text-decoration-none"
                      title="Xem toàn bộ hồ sơ và lịch sử mua sắm của khách"
                    >
                      <span>Hồ sơ khách</span>
                      <AppIcon name="external-link" class="ms-1" style="width: 10px; height: 10px;" />
                    </RouterLink>
                  </div>
                  <div v-else class="text-body-tertiary fs-9">
                    Chưa có số điện thoại
                  </div>
                </div>
              </div>

              <!-- Customer OCR Review Action Banner -->
              <div
                v-if="order.customerInfoStatus !== 'complete'"
                class="customer-review-prompt p-3 rounded-3 border border-warning-subtle bg-warning-subtle bg-opacity-25"
              >
                <div class="d-flex align-items-start gap-2 mb-2">
                  <AppIcon name="alert-circle" class="text-warning flex-shrink-0 mt-0.5" />
                  <div class="fs-9 text-body-emphasis fw-medium">
                    {{ customerStatusDescription }}
                  </div>
                </div>

                <div v-if="order.ocr.candidateName || order.ocr.candidatePhone" class="ocr-candidate-box p-2.5 rounded-2 bg-body mb-3 border border-translucent">
                  <div class="d-flex justify-content-between gap-2 fs-9 mb-1">
                    <span class="text-body-tertiary">Tên OCR:</span>
                    <strong class="text-body-emphasis">{{ order.ocr.candidateName || "—" }}</strong>
                  </div>
                  <div class="d-flex justify-content-between gap-2 fs-9">
                    <span class="text-body-tertiary">SĐT OCR:</span>
                    <strong class="text-body-emphasis font-monospace">{{ order.ocr.candidatePhone || "—" }}</strong>
                  </div>
                </div>

                <button
                  v-if="auth.can('orders.update')"
                  type="button"
                  class="btn btn-sm btn-primary w-100 d-flex align-items-center justify-content-center gap-1.5"
                  @click="reviewOpen = true"
                >
                  <AppIcon name="user-check" />
                  <span>Đối chiếu & xác nhận ngay</span>
                </button>
              </div>

              <!-- Customer Verified Details -->
              <div
                v-else-if="order.ocr.review.mode"
                class="ocr-verified-box p-2.5 rounded-2 bg-body-highlight border border-translucent fs-9"
              >
                <div class="d-flex justify-content-between gap-2 py-1 border-bottom border-translucent">
                  <span class="text-body-tertiary">Hình thức xác thực</span>
                  <strong>{{ order.ocr.review.mode === 'ocr' ? 'Kiểm duyệt gợi ý' : 'Nhập thủ công' }}</strong>
                </div>
                <div class="d-flex justify-content-between gap-2 py-1 border-bottom border-translucent">
                  <span class="text-body-tertiary">Độ chuẩn tên</span>
                  <strong>{{ outcomeLabel(order.ocr.review.nameOutcome) }}</strong>
                </div>
                <div class="d-flex justify-content-between gap-2 py-1 border-bottom border-translucent">
                  <span class="text-body-tertiary">Độ chuẩn SĐT</span>
                  <strong>{{ outcomeLabel(order.ocr.review.phoneOutcome) }}</strong>
                </div>
                <div v-if="order.ocr.extractionVersion" class="d-flex justify-content-between gap-2 py-1 border-bottom border-translucent">
                  <span class="text-body-tertiary">Phiên bản đọc ảnh</span>
                  <strong>{{ order.ocr.extractionVersion }}</strong>
                </div>
                <div class="d-flex justify-content-between gap-2 py-1">
                  <span class="text-body-tertiary">Thời gian xử lý</span>
                  <strong>{{ dateTime(order.ocr.review.reviewedAt || order.ocr.processedAt) }}</strong>
                </div>
              </div>
            </div>
          </article>

          <!-- Card: Transaction Meta Details -->
          <article class="card border border-translucent shadow-sm mb-4">
            <div class="card-header bg-transparent border-bottom py-3 px-3 px-sm-4 d-flex align-items-center gap-2">
              <div class="sidebar-card-icon text-secondary">
                <AppIcon name="table" />
              </div>
              <h2 class="fs-8 fw-bold mb-0 text-body-emphasis">Thông tin giao dịch</h2>
            </div>
            <div class="card-body p-3 p-sm-4">
              <DetailDefinitionList :fields="detailFields" />

              <!-- Mobile Quick Actions -->
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
                    <span>Khôi phục</span>
                  </button>
                  <button
                    v-if="canDelete"
                    type="button"
                    class="btn btn-sm btn-danger d-flex align-items-center gap-1 ms-auto"
                    :disabled="saving"
                    @click="triggerAction('delete')"
                  >
                    <AppIcon name="trash-2" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- Right Column: Sold Products & Order Timeline (Col-12 Col-lg-7 Col-xl-7) -->
        <div class="col-12 col-lg-7 col-xl-7">
          <!-- Card: Sold Products List -->
          <article class="card sold-products-card overflow-hidden border border-translucent shadow-sm mb-4">
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
                <span
                  class="badge badge-phoenix fs-10 px-2.5 py-1"
                  :class="order.status === 'completed' ? 'badge-phoenix-success' : 'badge-phoenix-warning'"
                >
                  {{ order.status === 'completed' ? 'Đã xuất kho' : 'Đã hoàn tồn' }}
                </span>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="!order.items.length" class="card-body text-center py-5 px-3">
              <div class="sold-empty-icon mx-auto mb-3">
                <AppIcon name="archive" />
              </div>
              <h3 class="fs-8 fw-semibold text-body-emphasis mb-1">Chưa lưu chi tiết SKU</h3>
              <p class="fs-9 text-body-tertiary mb-0 mx-auto" style="max-width: 320px;">
                Đơn hàng này được tạo từ hệ thống cũ hoặc chưa lưu thông tin từng dòng SKU xuất kho.
              </p>
            </div>

            <!-- Items List -->
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
                      <span class="sold-tag-label me-1">Ni:</span>
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

            <!-- Card Summary Footer & Price Breakdown -->
            <div v-if="order.items.length" class="order-summary-footer bg-body-tertiary bg-opacity-25 border-top p-3 p-sm-4">
              <div class="row g-3 align-items-center justify-content-between">
                <div class="col-12 col-md-6">
                  <div class="d-flex align-items-center gap-2 text-body-secondary fs-9 mb-1">
                    <AppIcon name="shopping-cart" class="text-body-tertiary" />
                    <span>Quy mô đơn: <strong class="text-body-emphasis">{{ itemQuantity }}</strong> món hàng ({{ order.items.length }} dòng SKU)</span>
                  </div>
                  <div class="d-flex align-items-center gap-2 text-body-secondary fs-9">
                    <AppIcon name="check-circle" class="text-success" />
                    <span>Phương thức: <strong class="text-body-emphasis">Bán tại quầy (Xuất kho trực tiếp)</strong></span>
                  </div>
                </div>

                <div class="col-12 col-md-6 col-lg-5 col-xl-5">
                  <div class="order-price-breakdown">
                    <div class="breakdown-row text-body-tertiary fs-9">
                      <span>Tạm tính tiền hàng:</span>
                      <span class="font-monospace text-body-emphasis">{{ money(calculatedSubtotal) }}</span>
                    </div>
                    <div v-if="priceDifference !== 0" class="breakdown-row text-body-tertiary fs-9">
                      <span>Điều chỉnh đơn:</span>
                      <span class="font-monospace" :class="priceDifference > 0 ? 'text-success' : 'text-danger'">
                        {{ priceDifference > 0 ? '+' : '' }}{{ money(priceDifference) }}
                      </span>
                    </div>
                    <div class="breakdown-total d-flex align-items-baseline justify-content-between pt-2 border-top">
                      <span class="fw-bold text-body-emphasis fs-8">Tổng thanh toán:</span>
                      <span class="fs-6 fw-bolder text-primary font-monospace">{{ money(order.price) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <!-- Card: Order Timeline & History -->
          <article class="card border border-translucent shadow-sm overflow-hidden mb-4">
            <div class="card-header bg-transparent border-bottom py-3 px-3 px-sm-4 d-flex align-items-center gap-2">
              <div class="timeline-header-icon text-primary">
                <AppIcon name="history" />
              </div>
              <h2 class="fs-8 fs-sm-7 fw-bold mb-0 text-body-emphasis">Tiến trình đơn hàng</h2>
            </div>
            <div class="card-body p-3 p-sm-4">
              <ol class="order-timeline-list mb-0">
                <!-- Step 1: Created -->
                <li class="timeline-step is-complete">
                  <div class="timeline-marker">
                    <AppIcon name="check" />
                  </div>
                  <div class="timeline-content">
                    <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-1 mb-1">
                      <strong class="timeline-title">Đơn hàng được khởi tạo & xuất kho</strong>
                      <time class="timeline-time">{{ dateTime(order.createdAt) }}</time>
                    </div>
                    <p class="timeline-desc text-body-secondary mb-0">
                      Tạo bởi <strong>{{ order.createdBy?.name || 'Nhân viên bán lẻ' }}</strong>. Hệ thống đã tự động xuất kho và trừ tồn cho {{ itemQuantity }} sản phẩm.
                    </p>
                  </div>
                </li>

                <!-- Step 2: Customer Info & OCR Verification -->
                <li
                  class="timeline-step"
                  :class="order.customerInfoStatus === 'complete' ? 'is-complete' : 'is-pending'"
                >
                  <div class="timeline-marker">
                    <AppIcon :name="order.customerInfoStatus === 'complete' ? 'check' : 'user'" />
                  </div>
                  <div class="timeline-content">
                    <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-1 mb-1">
                      <strong class="timeline-title">Thông tin khách hàng & OCR</strong>
                      <time v-if="order.ocr.review.reviewedAt || order.ocr.processedAt" class="timeline-time">
                        {{ dateTime(order.ocr.review.reviewedAt || order.ocr.processedAt) }}
                      </time>
                    </div>
                    <div v-if="order.customerInfoStatus === 'complete'" class="timeline-desc text-body-secondary mb-0">
                      Đã xác thực thông tin khách hàng: <strong>{{ order.name || '—' }}</strong> ({{ order.phone || 'Chưa có SĐT' }}).
                      <span v-if="order.ocr.review.mode" class="badge badge-phoenix badge-phoenix-success ms-1 fs-10">
                        {{ order.ocr.review.mode === 'ocr' ? 'Kiểm duyệt gợi ý OCR' : 'Nhập thủ công' }}
                      </span>
                    </div>
                    <div v-else-if="order.customerInfoStatus === 'review_required'" class="timeline-desc text-warning mb-0">
                      Google Vision đã phân tích ảnh hóa đơn. Cần người dùng đối chiếu và xác nhận thông tin khách hàng.
                    </div>
                    <div v-else-if="order.customerInfoStatus === 'ocr_processing'" class="timeline-desc text-info mb-0">
                      Hệ thống đang chạy đọc ảnh nền. Bạn có thể bổ sung thủ công bất kỳ lúc nào.
                    </div>
                    <div v-else class="timeline-desc text-body-tertiary mb-0">
                      Chưa có thông tin nhận diện tự động từ ảnh. Cần bổ sung tên và số điện thoại khách hàng.
                    </div>
                  </div>
                </li>

                <!-- Step 3: Order Status (Completed / Returned / Cancelled) -->
                <li
                  v-if="order.status === 'returned'"
                  class="timeline-step is-warning"
                >
                  <div class="timeline-marker">
                    <AppIcon name="refresh" />
                  </div>
                  <div class="timeline-content">
                    <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-1 mb-1">
                      <strong class="timeline-title text-warning">Đã đổi trả hàng & hoàn tồn kho</strong>
                      <time class="timeline-time">{{ dateTime(order.returnedAt) }}</time>
                    </div>
                    <p class="timeline-desc text-body-secondary mb-0">
                      Đơn hàng đã được chuyển sang trạng thái Đổi trả. Toàn bộ {{ itemQuantity }} sản phẩm đã được hoàn lại vào kho hàng.
                    </p>
                  </div>
                </li>

                <li
                  v-else-if="order.status === 'cancelled'"
                  class="timeline-step is-danger"
                >
                  <div class="timeline-marker">
                    <AppIcon name="close" />
                  </div>
                  <div class="timeline-content">
                    <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-1 mb-1">
                      <strong class="timeline-title text-danger">Đã hủy đơn hàng & hoàn tồn kho</strong>
                      <time class="timeline-time">{{ dateTime(order.cancelledAt) }}</time>
                    </div>
                    <p class="timeline-desc text-body-secondary mb-0">
                      Đơn hàng đã bị hủy. Toàn bộ {{ itemQuantity }} sản phẩm đã được hoàn lại vào kho hàng.
                    </p>
                  </div>
                </li>

                <li
                  v-else
                  class="timeline-step is-complete"
                >
                  <div class="timeline-marker">
                    <AppIcon name="check-circle" />
                  </div>
                  <div class="timeline-content">
                    <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-1 mb-1">
                      <strong class="timeline-title text-success">Giao dịch thành công</strong>
                      <time class="timeline-time">{{ dateTime(order.createdAt) }}</time>
                    </div>
                    <p class="timeline-desc text-body-secondary mb-0">
                      Đơn hàng đang ở trạng thái Hoàn tất, chứng từ và dữ liệu hàng hóa đã được ghi nhận trên hệ thống.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </article>
        </div>
      </div>
    </template>

    <!-- Modals & Drawers -->
    <DrawerPanel :open="reviewOpen" title="Đối chiếu thông tin khách hàng" wide @close="reviewOpen = false">
      <OrderCustomerReview v-if="order" :order="order" :submitting="saving" :error="error" @submit="saveCustomer" />
    </DrawerPanel>

    <ConfirmDialog
      :open="Boolean(confirmAction)"
      :title="actionConfirmation.title"
      :message="actionConfirmation.message"
      :confirm-label="actionConfirmation.label"
      :confirm-variant="actionConfirmation.variant || 'danger'"
      @cancel="confirmAction = ''"
      @confirm="runAction"
    />

    <ImagePreview :src="preview" :alt="order?.orderCode || 'Ảnh đơn hàng'" @close="preview = ''" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import DetailDefinitionList from "@/components/app/DetailDefinitionList.vue";
import PageHeader, { type PageBreadcrumb } from "@/components/app/PageHeader.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import ImagePreview from "@/components/media/ImagePreview.vue";
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
      selectedImage: "",
      copiedCode: false,
      rotation: 0,
      isZoomed: false,
    };
  },
  computed: {
    auth() { return authenStore(); },
    breadcrumbs(): PageBreadcrumb[] {
      return [
        { label: "Đơn hàng", to: "/orders" },
        { label: this.order?.orderCode || "Chi tiết đơn" },
      ];
    },
    gallery(): string[] {
      if (!this.order) return [];
      const list: string[] = [];
      if (this.order.thumbnail) list.push(this.order.thumbnail);
      if (Array.isArray(this.order.images)) {
        for (const img of this.order.images) {
          if (img && !list.includes(img)) list.push(img);
        }
      }
      return list;
    },
    activeImage(): string {
      if (this.selectedImage) return this.selectedImage;
      return this.gallery[0] || this.order?.thumbnail || "";
    },
    imageTransformStyle(): Record<string, string> {
      const transforms: string[] = [];
      if (this.rotation) {
        transforms.push(`rotate(${this.rotation}deg)`);
      }
      if (this.isZoomed) {
        transforms.push("scale(1.85)");
      }
      return {
        transform: transforms.length ? transforms.join(" ") : "none",
        transformOrigin: "center center",
      };
    },
    customerInitials(): string {
      if (!this.order?.name) return "KH";
      const parts = this.order.name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },
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
    itemQuantity(): number {
      return this.order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    },
    calculatedSubtotal(): number {
      if (!this.order?.items) return 0;
      return this.order.items.reduce((sum, item) => sum + (item.lineTotal || (item.unitPrice * item.quantity)), 0);
    },
    priceDifference(): number {
      if (!this.order) return 0;
      return this.order.price - this.calculatedSubtotal;
    },
    customerStatusDescription(): string {
      if (!this.order) return "";
      if (this.order.customerInfoStatus === "ocr_processing") return "Google Vision đang đọc ảnh nền. Bạn vẫn có thể nhập thủ công ngay lập tức.";
      if (this.order.customerInfoStatus === "review_required") return "Google Vision đã đưa ra gợi ý; người dùng cần đối chiếu và xác nhận.";
      return "OCR không nhận được thông tin tin cậy; vui lòng nhập tên và số điện thoại thủ công.";
    },
    detailFields(): Array<{ label: string; value: string }> {
      if (!this.order) return [];
      return [
        { label: "Mã đơn hàng", value: this.order.orderCode },
        { label: "Khách hàng", value: this.order.name || "—" },
        { label: "Số điện thoại", value: this.order.phone || "—" },
        { label: "Hình thức bán", value: "Bán tại quầy (Trực tiếp)" },
        { label: "Trạng thái đơn", value: this.order.status === "completed" ? "Hoàn tất" : this.order.status === "returned" ? "Đã đổi trả" : "Đã hủy" },
        { label: "Ngày tạo đơn", value: this.dateTime(this.order.createdAt) },
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
    rotateImage(): void {
      this.rotation = (this.rotation + 90) % 360;
    },
    toggleZoom(): void {
      this.isZoomed = !this.isZoomed;
    },
    selectPhoto(photo: string): void {
      this.selectedImage = photo;
      this.rotation = 0;
      this.isZoomed = false;
    },
    openOriginalImage(): void {
      if (this.activeImage) {
        window.open(assetUrl(this.activeImage), "_blank");
      }
    },
    handleImageStageClick(): void {
      if (this.isZoomed) {
        this.isZoomed = false;
      } else {
        this.preview = assetUrl(this.activeImage);
      }
    },
    async copyOrderCode(): Promise<void> {
      if (!this.order?.orderCode) return;
      try {
        await navigator.clipboard.writeText(this.order.orderCode);
        this.copiedCode = true;
        setTimeout(() => {
          this.copiedCode = false;
        }, 2000);
      } catch {
        // Fallback gracefully if clipboard unavailable
      }
    },
    printOrder(): void {
      window.print();
    },
    triggerAction(action: "return" | "cancel" | "delete" | "restore"): void {
      this.actionMenuOpen = false;
      this.confirmAction = action;
    },
    async load(): Promise<void> {
      this.loading = true;
      this.error = "";
      try {
        this.order = await orderService.detail(String(this.$route.params.id));
        this.selectedImage = "";
        this.rotation = 0;
        this.isZoomed = false;
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.loading = false;
      }
    },
    async saveCustomer(value: { name: string; phone: string; review: boolean }): Promise<void> {
      if (!this.order) return;
      this.saving = true;
      this.error = "";
      try {
        this.order = await (value.review
          ? orderService.reviewCustomerInfo(this.order.id, value.name, value.phone)
          : orderService.completeCustomerInfo(this.order.id, value.name, value.phone));
        this.reviewOpen = false;
        this.message = "Đã xác nhận thông tin khách hàng";
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.saving = false;
      }
    },
    async runAction(): Promise<void> {
      if (!this.order || !this.confirmAction || this.saving) return;
      const action = this.confirmAction;
      if (action === "delete" && !this.auth.isAdmin) return;
      this.confirmAction = "";
      this.error = "";
      this.message = "";
      this.saving = true;
      try {
        if (action === "delete") {
          await orderService.permanentDelete(this.order.id);
          useOrderStore().message = "Đã xóa vĩnh viễn đơn hàng";
          await this.$router.push("/orders");
        } else if (action === "return") {
          this.order = await orderService.markReturned(this.order.id);
          this.message = "Đã đổi trả và hoàn tồn kho";
        } else if (action === "restore") {
          this.order = await orderService.restore(this.order.id);
          this.message = "Đã khôi phục đơn và cập nhật tồn kho";
        } else {
          await orderService.remove(this.order.id);
          await this.load();
          this.message = "Đã hủy đơn và hoàn tồn kho";
        }
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.saving = false;
      }
    },
  },
});
</script>

<style scoped>
.order-detail-page {
  min-width: 0;
}

/* KPI Banner Strip */
.order-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.order-kpi-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1.125rem 1.25rem;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.85rem;
  background: var(--phoenix-body-emphasis-bg);
  transition: all 0.2s ease;
}

.order-kpi-card:hover {
  border-color: rgba(var(--phoenix-primary-rgb), 0.35);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.order-kpi-card.is-highlight {
  background: linear-gradient(
    135deg,
    rgba(var(--phoenix-primary-rgb), 0.04) 0%,
    var(--phoenix-body-emphasis-bg) 100%
  );
  border-color: rgba(var(--phoenix-primary-rgb), 0.2);
}

.kpi-icon-badge {
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: var(--phoenix-body-highlight-bg);
  flex-shrink: 0;
  font-size: 1.2rem;
}

.kpi-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.kpi-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--phoenix-secondary-color);
}

.kpi-value {
  font-size: 1.15rem;
  line-height: 1.2;
  color: var(--phoenix-emphasis-color);
}

.kpi-sub {
  font-size: 0.75rem;
  color: var(--phoenix-secondary-color);
}

.kpi-mini-icon {
  width: 11px;
  height: 11px;
  vertical-align: -1px;
  opacity: 0.7;
}

.hover-primary:hover {
  color: var(--phoenix-primary) !important;
}

/* Sold Products Card & Items */
.sold-header-icon,
.timeline-header-icon,
.sidebar-card-icon {
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

.sidebar-card-icon.text-success {
  background: rgba(var(--phoenix-success-rgb, 37, 184, 100), 0.1);
}

.sidebar-card-icon.text-info {
  background: rgba(var(--phoenix-info-rgb, 0, 151, 219), 0.1);
}

.sidebar-card-icon.text-secondary {
  background: rgba(var(--phoenix-secondary-rgb, 108, 117, 125), 0.1);
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

.sold-product-sku-wrap {
  flex-shrink: 0;
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

/* Order Summary Footer */
.order-price-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Order Timeline */
.order-timeline-list {
  list-style: none;
  padding-left: 0;
  position: relative;
}

.order-timeline-list::before {
  content: "";
  position: absolute;
  top: 0.75rem;
  bottom: 0.75rem;
  left: 1rem;
  width: 2px;
  background: var(--phoenix-border-color-translucent);
}

.timeline-step {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  position: relative;
  padding-bottom: 1.5rem;
}

.timeline-step:last-child {
  padding-bottom: 0;
}

.timeline-marker {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--phoenix-body-bg);
  border: 2px solid var(--phoenix-border-color-translucent);
  color: var(--phoenix-secondary-color);
  font-size: 0.8rem;
  z-index: 2;
  flex-shrink: 0;
}

.timeline-step.is-complete .timeline-marker {
  background: var(--phoenix-success);
  border-color: var(--phoenix-success);
  color: #fff;
}

.timeline-step.is-pending .timeline-marker {
  background: var(--phoenix-warning);
  border-color: var(--phoenix-warning);
  color: #fff;
}

.timeline-step.is-warning .timeline-marker {
  background: var(--phoenix-warning);
  border-color: var(--phoenix-warning);
  color: #fff;
}

.timeline-step.is-danger .timeline-marker {
  background: var(--phoenix-danger);
  border-color: var(--phoenix-danger);
  color: #fff;
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.timeline-title {
  font-size: 0.875rem;
  color: var(--phoenix-emphasis-color);
}

.timeline-time {
  font-size: 0.75rem;
  color: var(--phoenix-secondary-color);
}

.timeline-desc {
  font-size: 0.8rem;
  line-height: 1.4;
}

/* Customer Profile Card */
.customer-profile-block {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.customer-avatar {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(var(--phoenix-primary-rgb), 0.15) 0%,
    rgba(var(--phoenix-primary-rgb), 0.3) 100%
  );
  color: var(--phoenix-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  flex-shrink: 0;
  border: 2px solid var(--phoenix-body-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.customer-meta {
  display: flex;
  flex-direction: column;
}

/* Large Receipt Photo Viewer */
.receipt-card {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.receipt-frame-container {
  width: 100%;
  min-height: 28rem;
  max-height: 48rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--phoenix-border-color-translucent);
  background: #1e2430;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.receipt-frame-container.is-zoomed {
  overflow: auto;
  cursor: grab;
}

.receipt-image-stage {
  width: 100%;
  height: 100%;
  min-height: 28rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  cursor: pointer;
}

.receipt-frame-img {
  max-width: 100%;
  max-height: 46rem;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1);
  image-rendering: -webkit-optimize-contrast;
  border-radius: 0.35rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

.receipt-frame-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.receipt-frame-container:hover .receipt-frame-overlay {
  opacity: 1;
}

.receipt-overlay-pill {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 0.825rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.receipt-thumbs-strip {
  margin-top: 0.75rem;
}

.receipt-thumb-item {
  width: 4rem;
  height: 4rem;
  flex: 0 0 auto;
  padding: 0.125rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--phoenix-border-color-translucent);
  background: var(--phoenix-body-bg);
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.receipt-thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.35rem;
}

.receipt-thumb-item.is-active {
  border-color: var(--phoenix-primary);
  box-shadow: 0 0 0 2px rgba(var(--phoenix-primary-rgb), 0.3);
}

.receipt-thumb-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
}

.ocr-raw-text {
  max-height: 12rem;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Responsive Breakpoints */
@media (max-width: 1199.98px) {
  .order-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 991.98px) {
  .receipt-frame-container {
    min-height: 22rem;
    max-height: 36rem;
  }
}

@media (max-width: 575.98px) {
  .order-kpi-grid {
    grid-template-columns: 1fr;
  }
  .receipt-frame-container {
    min-height: 18rem;
    max-height: 28rem;
  }
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

/* Print Stylesheet */
@media print {
  .print-hide,
  .dropdown,
  .btn,
  .breadcrumb,
  nav,
  .navbar,
  .sidebar,
  .cms-navbar {
    display: none !important;
  }

  .order-detail-page {
    padding: 0 !important;
  }

  .card {
    border: 1px solid #ccc !important;
    box-shadow: none !important;
    break-inside: avoid;
  }

  .order-kpi-card {
    border: 1px solid #ddd !important;
  }
}
</style>
