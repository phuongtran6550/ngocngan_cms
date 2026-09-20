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
      <PageHeader :title="item.name" :breadcrumbs="breadcrumbs">
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
      <div
        v-if="actionSuccess"
        class="alert alert-subtle-success d-flex align-items-center justify-content-between"
        role="status"
        data-testid="sku-action-success-alert"
      >
        <span>{{ actionSuccess }}</span>
        <button
          type="button"
          class="btn-close"
          aria-label="Đóng"
          @click="actionSuccess = ''"
        />
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
              <span v-if="item.category">
                <small>Danh mục</small>{{ item.category }}
              </span>
              <span v-if="item.material">
                <small>Chất liệu</small>{{ item.material }}
              </span>
              <span v-if="item.pattern">
                <small>Mẫu</small>{{ item.pattern }}
              </span>
              <span v-if="item.pricingType" class="pricing-type">
                <small>Loại sản phẩm</small>{{ item.pricingType }}
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
              <div>
                <dt>Trọng lượng</dt>
                <dd data-testid="product-weight-range">{{ summary.weight }}</dd>
              </div>
              <div>
                <dt>Ni tay</dt>
                <dd data-testid="product-size-range">{{ summary.size }}</dd>
              </div>
            </dl>
            <p v-if="item.updatedAt" class="text-body-tertiary fs-10 mt-3 mb-0">
              Cập nhật {{ formatDateTime(item.updatedAt) }}
            </p>
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
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span class="sku-count"> {{ summary.skuCount }} SKU </span>
            <button
              v-if="auth.can(permissions.warehouseView)"
              type="button"
              class="btn btn-sm btn-phoenix-primary"
              data-testid="print-all-stock-labels"
              :disabled="printingAll || Boolean(printingSkuId) || Boolean(printSku) || !displaySkus.some(sku => sku.stock > 0)"
              :aria-busy="printingAll"
              @click="printAllStockLabels"
            >
              <span v-if="printingAll" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
              <AppIcon v-else name="tag" class="me-1" />
              {{ printingAll ? "Đang gửi tem…" : "In tất cả theo tồn kho" }}
            </button>
            <button
              v-if="auth.can(permissions.warehouseUpdate) && selectedSkuIds.length > 0"
              type="button"
              class="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
              data-testid="bulk-delete-skus-btn"
              :disabled="isBulkDeleteDisabled"
              :title="isBulkDeleteDisabled ? 'Sản phẩm phải có ít nhất 1 SKU. Không thể xóa tất cả SKU.' : `Xóa ${selectedSkuIds.length} SKU đã chọn`"
              @click="requestBulkDeleteSkus"
            >
              <AppIcon name="trash-2" class="fs-10" />
              <span>Xóa đã chọn ({{ selectedSkuIds.length }})</span>
            </button>
            <button
              v-if="auth.can(permissions.warehouseUpdate)"
              type="button"
              class="btn btn-sm btn-primary"
              data-testid="add-new-sku-btn"
              @click="openAddSkuModal"
            >
              <AppIcon name="plus" class="me-1" />
              Thêm SKU mới
            </button>
          </div>
        </div>

        <!-- Thông báo thao tác SKU trực tiếp trên bảng SKU -->
        <div
          v-if="skuActionSuccess"
          class="alert alert-subtle-success d-flex align-items-center justify-content-between mb-3 shadow-sm"
          role="status"
          data-testid="sku-section-action-success"
        >
          <div class="d-flex align-items-center gap-2">
            <AppIcon name="check-circle" class="flex-shrink-0 text-success" />
            <span class="fw-semibold">{{ skuActionSuccess }}</span>
          </div>
          <button
            type="button"
            class="btn-close"
            aria-label="Đóng"
            @click="skuActionSuccess = ''"
          />
        </div>
        <div
          v-if="skuActionError"
          class="alert alert-subtle-danger d-flex align-items-center justify-content-between mb-3 shadow-sm"
          role="alert"
          data-testid="sku-section-action-error"
        >
          <div class="d-flex align-items-center gap-2">
            <AppIcon name="alert-circle" class="flex-shrink-0 text-danger" />
            <span class="fw-semibold">{{ skuActionError }}</span>
          </div>
          <button
            type="button"
            class="btn-close"
            aria-label="Đóng"
            @click="skuActionError = ''"
          />
        </div>

        <div class="sku-table-wrap">
          <table
            class="sku-table"
            :class="{ 'sku-table-weighted': isWeighted }"
          >
            <thead>
              <tr>
                <th
                  v-if="auth.can(permissions.warehouseUpdate)"
                  scope="col"
                  class="sku-select-column"
                >
                  <div class="form-check d-inline-flex m-0 align-items-center justify-content-center">
                    <input
                      ref="allSkusCheckbox"
                      class="form-check-input cursor-pointer"
                      type="checkbox"
                      :checked="isAllSkusSelected"
                      :disabled="displaySkus.length === 0"
                      aria-label="Chọn tất cả SKU"
                      data-testid="select-all-skus-checkbox"
                      @change="toggleSelectAllSkus"
                    />
                  </div>
                </th>
                <th scope="col" :aria-sort="skuAriaSort('code')">
                  <button
                    type="button"
                    class="sku-th-btn"
                    data-testid="sort-sku-code"
                    title="Sắp xếp theo mã SKU"
                    @click="toggleSkuSort('code')"
                  >
                    <span>SKU</span>
                    <AppIcon
                      :name="skuSortIcon('code')"
                      class="sku-sort-icon"
                      :class="{ 'sku-sort-icon-active': skuSortKey === 'code' }"
                    />
                  </button>
                </th>
                <th scope="col" :aria-sort="skuAriaSort('size')">
                  <button
                    type="button"
                    class="sku-th-btn"
                    data-testid="sort-sku-size"
                    title="Sắp xếp theo ni tay"
                    @click="toggleSkuSort('size')"
                  >
                    <span>Ni tay</span>
                    <AppIcon
                      :name="skuSortIcon('size')"
                      class="sku-sort-icon"
                      :class="{ 'sku-sort-icon-active': skuSortKey === 'size' }"
                    />
                  </button>
                </th>
                <th scope="col" class="sku-numeric" :aria-sort="skuAriaSort('weight')">
                  <button
                    type="button"
                    class="sku-th-btn sku-th-btn-end"
                    data-testid="sort-sku-weight"
                    title="Sắp xếp theo trọng lượng"
                    @click="toggleSkuSort('weight')"
                  >
                    <span>Trọng lượng</span>
                    <AppIcon
                      :name="skuSortIcon('weight')"
                      class="sku-sort-icon"
                      :class="{ 'sku-sort-icon-active': skuSortKey === 'weight' }"
                    />
                  </button>
                </th>
                <th v-if="!isWeighted" scope="col" class="sku-numeric" :aria-sort="skuAriaSort('importPrice')">
                  <button
                    type="button"
                    class="sku-th-btn sku-th-btn-end"
                    data-testid="sort-sku-importPrice"
                    title="Sắp xếp theo giá nhập"
                    @click="toggleSkuSort('importPrice')"
                  >
                    <span>Giá nhập</span>
                    <AppIcon
                      :name="skuSortIcon('importPrice')"
                      class="sku-sort-icon"
                      :class="{ 'sku-sort-icon-active': skuSortKey === 'importPrice' }"
                    />
                  </button>
                </th>
                <th scope="col" class="sku-numeric" :aria-sort="skuAriaSort('laborCost')">
                  <button
                    type="button"
                    class="sku-th-btn sku-th-btn-end"
                    data-testid="sort-sku-laborCost"
                    title="Sắp xếp theo tiền công"
                    @click="toggleSkuSort('laborCost')"
                  >
                    <span>Tiền công</span>
                    <AppIcon
                      :name="skuSortIcon('laborCost')"
                      class="sku-sort-icon"
                      :class="{ 'sku-sort-icon-active': skuSortKey === 'laborCost' }"
                    />
                  </button>
                </th>
                <th scope="col" class="sku-numeric" :aria-sort="skuAriaSort('platingCost')">
                  <button
                    type="button"
                    class="sku-th-btn sku-th-btn-end"
                    data-testid="sort-sku-platingCost"
                    title="Sắp xếp theo tiền xi"
                    @click="toggleSkuSort('platingCost')"
                  >
                    <span>Tiền xi</span>
                    <AppIcon
                      :name="skuSortIcon('platingCost')"
                      class="sku-sort-icon"
                      :class="{ 'sku-sort-icon-active': skuSortKey === 'platingCost' }"
                    />
                  </button>
                </th>
                <th scope="col" class="sku-numeric" :aria-sort="skuAriaSort('price')">
                  <button
                    type="button"
                    class="sku-th-btn sku-th-btn-end"
                    data-testid="sort-sku-price"
                    title="Sắp xếp theo giá bán"
                    @click="toggleSkuSort('price')"
                  >
                    <span>Giá bán</span>
                    <AppIcon
                      :name="skuSortIcon('price')"
                      class="sku-sort-icon"
                      :class="{ 'sku-sort-icon-active': skuSortKey === 'price' }"
                    />
                  </button>
                </th>
                <th scope="col" class="sku-numeric" :aria-sort="skuAriaSort('stock')">
                  <button
                    type="button"
                    class="sku-th-btn sku-th-btn-end"
                    data-testid="sort-sku-stock"
                    title="Sắp xếp theo tồn kho"
                    @click="toggleSkuSort('stock')"
                  >
                    <span>Tồn kho</span>
                    <AppIcon
                      :name="skuSortIcon('stock')"
                      class="sku-sort-icon"
                      :class="{ 'sku-sort-icon-active': skuSortKey === 'stock' }"
                    />
                  </button>
                </th>
                <th scope="col" class="sku-numeric text-center" :aria-sort="skuAriaSort('printCount')">
                  <button
                    type="button"
                    class="sku-th-btn sku-th-btn-center"
                    data-testid="sort-sku-printCount"
                    title="Sắp xếp theo số lần in"
                    @click="toggleSkuSort('printCount')"
                  >
                    <span>Số lần in</span>
                    <AppIcon
                      :name="skuSortIcon('printCount')"
                      class="sku-sort-icon"
                      :class="{ 'sku-sort-icon-active': skuSortKey === 'printCount' }"
                    />
                  </button>
                </th>
                <th
                  scope="col"
                  class="sku-numeric position-relative"
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
                <td
                  v-if="auth.can(permissions.warehouseUpdate)"
                  class="sku-select-column text-center align-middle"
                >
                  <div class="form-check d-inline-flex m-0 align-items-center justify-content-center">
                    <input
                      class="form-check-input cursor-pointer"
                      type="checkbox"
                      :checked="isSkuSelected(sku)"
                      :aria-label="`Chọn SKU ${sku.code}`"
                      :data-testid="`select-sku-${index}`"
                      @change="toggleSelectSku(sku, $event)"
                    />
                  </div>
                </td>
                <td>
                  <RouterLink
                    v-if="sku.id"
                    :to="`/products/${sku.id}`"
                    class="text-decoration-none"
                  >
                    <code class="sku-code-cell">{{ sku.code || "—" }}</code>
                  </RouterLink>
                  <code v-else class="sku-code-cell">{{ sku.code || "—" }}</code>
                  <span class="sku-code-sub">
                    SKU {{ String(index + 1).padStart(2, "0") }} ·
                    {{ item.pricingType || "—" }}
                  </span>
                </td>
                <td>{{ sku.size || "—" }}</td>
                <td class="sku-numeric">
                  {{ weight(sku.weight) }}
                </td>
                <td v-if="!isWeighted" class="sku-numeric">
                  {{ money(sku.importPrice) }}
                </td>
                <td class="sku-numeric">
                  {{ money(sku.laborCost) }}
                </td>
                <td class="sku-numeric">
                  {{ money(sku.platingCost) }}
                </td>
                <td class="sku-numeric sku-sale-price">
                  {{ money(sku.price) }}
                </td>
                <td class="sku-numeric" :data-testid="`sku-stock-${index}`">
                  <span class="sku-stock-value">{{ sku.stock }}</span>
                </td>
                <td
                  class="sku-numeric text-center"
                  :data-testid="`sku-print-count-${index}`"
                >
                  <span
                    v-if="!sku.printCount"
                    class="badge badge-phoenix badge-phoenix-secondary fs-10"
                  >
                    Chưa in
                  </span>
                  <span
                    v-else
                    class="badge badge-phoenix fs-10"
                    :class="
                      sku.printCount === 1
                        ? 'badge-phoenix-success'
                        : 'badge-phoenix-warning'
                    "
                  >
                    {{ sku.printCount }} lần
                  </span>
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
                      :disabled="Boolean(printingSkuId) || printingAll"
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
                    <button
                      v-if="auth.can(permissions.warehouseUpdate)"
                      type="button"
                      class="sku-edit-action"
                      :data-testid="`edit-sku-${index}`"
                      :aria-label="`Sửa SKU ${sku.code}`"
                      title="Sửa SKU"
                      @click="openEditSkuModal(sku)"
                    >
                      <AppIcon name="edit" />
                      Sửa
                    </button>
                    <button
                      v-if="auth.can(permissions.warehouseUpdate)"
                      type="button"
                      class="sku-delete-action"
                      :class="{ 'opacity-50': displaySkus.length <= 1 }"
                      :data-testid="`delete-sku-${index}`"
                      :aria-label="`Xóa SKU ${sku.code}`"
                      :title="displaySkus.length <= 1 ? 'Sản phẩm phải có ít nhất 1 SKU' : `Xóa SKU ${sku.code}`"
                      @click="requestDeleteSku(sku)"
                    >
                      <AppIcon name="trash-2" />
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mobile-sku-list gap-3">
          <!-- Thanh sắp xếp nhanh trên mobile -->
          <div
            v-if="displaySkus.length > 1"
            class="mobile-sku-sort-bar d-flex align-items-center justify-content-between gap-2 p-2 rounded bg-body-tertiary border border-translucent"
          >
            <div class="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
              <label for="mobile-sku-sort-select" class="fs-10 fw-bold text-body-tertiary text-nowrap mb-0">
                Sắp xếp:
              </label>
              <select
                id="mobile-sku-sort-select"
                v-model="skuSortKey"
                class="form-select form-select-sm fs-10 py-1"
                aria-label="Sắp xếp danh sách SKU"
              >
                <option value="">Mặc định (theo thứ tự)</option>
                <option value="code">Mã SKU</option>
                <option value="size">Ni tay</option>
                <option value="weight">Trọng lượng</option>
                <option v-if="!isWeighted" value="importPrice">Giá nhập</option>
                <option value="laborCost">Tiền công</option>
                <option value="platingCost">Tiền xi</option>
                <option value="price">Giá bán</option>
                <option value="stock">Tồn kho</option>
                <option value="printCount">Số lần in</option>
              </select>
            </div>
            <button
              v-if="skuSortKey"
              type="button"
              class="btn btn-sm btn-phoenix-secondary px-2 py-1 fs-10 d-inline-flex align-items-center gap-1 flex-shrink-0"
              :aria-label="skuSortDirection === 'asc' ? 'Đang xếp tăng dần, bấm để giảm dần' : 'Đang xếp giảm dần, bấm để tăng dần'"
              @click="toggleSkuSortDirection"
            >
              <AppIcon
                :name="skuSortDirection === 'asc' ? 'chevron-up' : 'chevron-down'"
                class="fs-10"
              />
              <span>{{ skuSortDirection === "asc" ? "Tăng" : "Giảm" }}</span>
            </button>
          </div>

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
                <div class="d-flex align-items-center gap-2 min-w-0">
                  <div
                    v-if="auth.can(permissions.warehouseUpdate)"
                    class="form-check m-0 d-flex align-items-center flex-shrink-0"
                  >
                    <input
                      class="form-check-input cursor-pointer"
                      type="checkbox"
                      :checked="isSkuSelected(sku)"
                      :aria-label="`Chọn SKU ${sku.code}`"
                      :data-testid="`mobile-select-sku-${index}`"
                      @change="toggleSelectSku(sku, $event)"
                    />
                  </div>
                  <div class="min-w-0">
                    <RouterLink
                      v-if="sku.id"
                      :to="`/products/${sku.id}`"
                      class="text-decoration-none"
                    >
                      <code class="sku-code-cell text-break">
                        {{ sku.code || "—" }}
                      </code>
                    </RouterLink>
                    <code v-else class="sku-code-cell text-break">
                      {{ sku.code || "—" }}
                    </code>
                    <span class="sku-code-sub">
                      SKU {{ String(index + 1).padStart(2, "0") }} ·
                      {{ item.pricingType || "—" }}
                    </span>
                  </div>
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
                    :disabled="Boolean(printingSkuId) || printingAll"
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
                  <button
                    v-if="auth.can(permissions.warehouseUpdate)"
                    type="button"
                    class="sku-edit-action"
                    :data-testid="`mobile-edit-sku-${index}`"
                    :aria-label="`Sửa SKU ${sku.code}`"
                    title="Sửa SKU"
                    @click="openEditSkuModal(sku)"
                  >
                    <AppIcon name="edit" />
                    Sửa
                  </button>
                  <button
                    v-if="auth.can(permissions.warehouseUpdate)"
                    type="button"
                    class="sku-delete-action"
                    :class="{ 'opacity-50': displaySkus.length <= 1 }"
                    :data-testid="`mobile-delete-sku-${index}`"
                    :aria-label="`Xóa SKU ${sku.code}`"
                    :title="displaySkus.length <= 1 ? 'Sản phẩm phải có ít nhất 1 SKU' : `Xóa SKU ${sku.code}`"
                    @click="requestDeleteSku(sku)"
                  >
                    <AppIcon name="trash-2" />
                    Xóa
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
                <div v-if="!isWeighted">
                  <dt>Giá nhập</dt>
                  <dd>{{ money(sku.importPrice) }}</dd>
                </div>
                <div>
                  <dt>Tiền công</dt>
                  <dd>{{ money(sku.laborCost) }}</dd>
                </div>
                <div>
                  <dt>Tiền xi</dt>
                  <dd>{{ money(sku.platingCost) }}</dd>
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
                <div>
                  <dt>Số lần in</dt>
                  <dd>
                    <span
                      v-if="!sku.printCount"
                      class="badge badge-phoenix badge-phoenix-secondary fs-10"
                    >
                      Chưa in
                    </span>
                    <span
                      v-else
                      class="badge badge-phoenix fs-10"
                      :class="
                        sku.printCount === 1
                          ? 'badge-phoenix-success'
                          : 'badge-phoenix-warning'
                      "
                    >
                      {{ sku.printCount }} lần
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </article>
        </div>
      </div>
    </template>

    <!-- Floating Toast thông báo kết quả SKU cố định góc trên màn hình -->
    <Teleport to="body">
      <Transition name="sku-toast-fade">
        <div
          v-if="skuToastMessage"
          class="position-fixed top-0 end-0 p-3"
          style="z-index: 100000;"
          role="status"
          aria-live="polite"
        >
          <div
            class="toast show shadow-lg border-0"
            :class="skuToastType === 'success' ? 'bg-success text-white' : 'bg-danger text-white'"
            style="min-width: 320px; max-width: 480px;"
          >
            <div class="d-flex align-items-center justify-content-between p-3 gap-3">
              <div class="d-flex align-items-center gap-2 min-w-0">
                <AppIcon
                  :name="skuToastType === 'success' ? 'check-circle' : 'alert-circle'"
                  class="fs-7 flex-shrink-0"
                />
                <span class="fs-9 fw-medium text-break">{{ skuToastMessage }}</span>
              </div>
              <button
                type="button"
                class="btn-close btn-close-white flex-shrink-0"
                aria-label="Đóng"
                @click="skuToastMessage = ''"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <PrintLabelDialog
      :open="Boolean(printSku)"
      :sku-code="printSku?.code || ''"
      :stock="printSku?.stock ?? 0"
      :model-value="printQuantity"
      :busy="Boolean(printingSkuId)"
      :error="printQuantityError"
      :submission-error="printSubmissionError"
      @update:model-value="updatePrintQuantity"
      @cancel="closePrintDialog"
      @confirm="confirmPrintLabel"
    />

    <WarehouseSkuModal
      v-if="item"
      :open="skuModalOpen"
      :sku="editingSku"
      :product="item"
      :silver-price="silverPrice"
      :existing-codes="existingSkuCodes"
      :submitting="skuModalSubmitting"
      :error="skuModalError"
      @cancel="closeSkuModal"
      @submit="saveSku"
    />

    <ConfirmDialog
      :open="deleteSkuOpen"
      title="Xóa SKU"
      :message="deleteSkuMessage"
      confirm-label="Xóa SKU"
      @cancel="cancelDeleteSku"
      @confirm="confirmDeleteSku"
    />

    <ConfirmDialog
      :open="bulkDeleteSkuOpen"
      title="Xóa SKU đã chọn"
      :message="bulkDeleteSkuMessage"
      confirm-label="Xóa SKU"
      @cancel="cancelBulkDeleteSkus"
      @confirm="confirmBulkDeleteSkus"
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
import {
  labelPrintFailureMessage,
} from "@/views/PrintDevices/presentation";
import PrintLabelDialog from "@/views/WarehousedGoods/components/PrintLabelDialog.vue";
import WarehouseSkuModal from "@/views/WarehousedGoods/components/WarehouseSkuModal.vue";
import { isInventoryBarcode } from "@/views/WarehousedGoods/inventory-barcode";
import { productSkuSummary } from "@/views/WarehousedGoods/product-summary";
import { warehouseService } from "@/views/WarehousedGoods/service";
import { useWarehouseStore } from "@/views/WarehousedGoods/store";
import {
  warehouseFormFromItem,
  type WarehouseItem,
  type WarehouseSku,
  type WarehouseSkuFormModel,
} from "@/views/WarehousedGoods/types";
import { authenStore } from "@/stores/app-authen";
import { formatDateTime, formatMoney } from "@/utils/resource-display";

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
    WarehouseSkuModal,
  },
  data() {
    return {
      item: null as WarehouseItem | null,
      loading: true,
      deleteOpen: false,
      error: "",
      preview: "",
      actionSuccess: "",
      skuActionSuccess: "",
      skuActionError: "",
      skuToastMessage: "",
      skuToastType: "success" as "success" | "danger",
      skuToastTimeout: null as ReturnType<typeof setTimeout> | null,
      skuActionTimeout: null as ReturnType<typeof setTimeout> | null,
      skuModalOpen: false,
      editingSku: null as WarehouseSku | null,
      skuModalSubmitting: false,
      skuModalError: "",
      deleteSkuOpen: false,
      deletingSku: null as WarehouseSku | null,
      deleteSkuSubmitting: false,
      selectedSkuIds: [] as string[],
      bulkDeleteSkuOpen: false,
      bulkDeleteSkuSubmitting: false,
      printingSkuId: "",
      printingAll: false,
      printAllStopped: false,
      printError: "",
      printSuccess: "",
      printSku: null as WarehouseSku | null,
      printQuantity: "1",
      printQuantityError: "",
      printSubmissionError: "",
      skuSortKey: "" as keyof WarehouseSku | "",
      skuSortDirection: "asc" as "asc" | "desc",
    };
  },
  computed: {
    permissions() {
      return PERMISSIONS;
    },
    auth() {
      return authenStore();
    },
    store() {
      return useWarehouseStore();
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
    silverPrice(): number | null {
      return this.store.options.silverPrice;
    },
    displaySkus(): WarehouseSku[] {
      const skus = [...(this.item?.skus || [])];
      if (!this.skuSortKey) return skus;

      const key = this.skuSortKey;
      const isDesc = this.skuSortDirection === "desc";
      const direction = isDesc ? -1 : 1;

      return skus.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        // 1. Cột chuỗi ký tự: code, size
        if (key === "code" || key === "size") {
          const strA = String(valA ?? "").trim();
          const strB = String(valB ?? "").trim();

          if (!strA && !strB) return 0;
          if (!strA) return 1;
          if (!strB) return -1;

          const cmp = strA.localeCompare(strB, "vi", {
            numeric: true,
            sensitivity: "base",
          });
          if (cmp !== 0) return direction * cmp;
          return (a.code || "").localeCompare(b.code || "", "vi", { numeric: true });
        }

        // 2. Cột số: weight, laborCost, platingCost, importPrice, price, stock, printCount
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        const numA = Number(valA);
        const numB = Number(valB);
        const validA = Number.isFinite(numA);
        const validB = Number.isFinite(numB);

        if (!validA && !validB) return 0;
        if (!validA) return 1;
        if (!validB) return -1;

        if (numA !== numB) {
          return direction * (numA - numB);
        }

        return (a.code || "").localeCompare(b.code || "", "vi", { numeric: true });
      });
    },
    existingSkuCodes(): string[] {
      return this.displaySkus.map((s) => s.code);
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
    deleteSkuMessage(): string {
      if (!this.deletingSku) return "";
      const sizeText = this.deletingSku.size ? `Ni ${this.deletingSku.size}, ` : "";
      return `Bạn có chắc chắn muốn xóa SKU "${this.deletingSku.code}" (${sizeText}${this.deletingSku.weight} chỉ)? Thao tác này sẽ cập nhật lại kho hàng.`;
    },
    isAllSkusSelected(): boolean {
      return (
        this.displaySkus.length > 0 &&
        this.displaySkus.every((s) => this.selectedSkuIds.includes(s.id || s.code))
      );
    },
    isSkuIndeterminate(): boolean {
      return this.selectedSkuIds.length > 0 && !this.isAllSkusSelected;
    },
    isBulkDeleteDisabled(): boolean {
      return (
        this.selectedSkuIds.length === 0 ||
        this.selectedSkuIds.length >= this.displaySkus.length
      );
    },
    bulkDeleteSkuMessage(): string {
      return `Bạn có chắc chắn muốn xóa ${this.selectedSkuIds.length} SKU đã chọn? Thao tác này sẽ cập nhật lại kho hàng.`;
    },
  },
  watch: {
    isSkuIndeterminate: {
      immediate: true,
      handler(val: boolean) {
        this.$nextTick(() => {
          const el = this.$refs.allSkusCheckbox as HTMLInputElement | undefined;
          if (el) {
            el.indeterminate = val;
          }
        });
      },
    },
    isAllSkusSelected() {
      this.$nextTick(() => {
        const el = this.$refs.allSkusCheckbox as HTMLInputElement | undefined;
        if (el) {
          el.indeterminate = this.isSkuIndeterminate;
        }
      });
    },
  },
  mounted() {
    void this.load();
    void this.store.loadOptions();
  },
  beforeUnmount() {
    this.printAllStopped = true;
    if (this.skuToastTimeout) clearTimeout(this.skuToastTimeout);
    if (this.skuActionTimeout) clearTimeout(this.skuActionTimeout);
  },
  methods: {
    assetUrl,
    formatDateTime,
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
      if (!this.item || this.printingSkuId || this.printingAll) return;
      if (!isInventoryBarcode(sku.barcode)) {
        this.printError = `SKU ${sku.code || "không xác định"} chưa có barcode hợp lệ.`;
        this.printSuccess = "";
        await this.focusPrintError();
        return;
      }
      if (!sku.id) {
        this.printError = `SKU ${sku.code || "không xác định"} chưa có định danh hợp lệ.`;
        this.printSuccess = "";
        await this.focusPrintError();
        return;
      }

      this.printError = "";
      this.printSuccess = "";
      this.printQuantityError = "";
      this.printSubmissionError = "";
      this.printSku = sku;
      this.printQuantity = String(sku.stock);
      if (sku.stock < 1) {
        this.printQuantityError = "SKU này hiện không có tồn kho để in tem";
      } else if (sku.stock > 100) {
        this.printQuantityError =
          "Tồn kho vượt quá giới hạn 100 tem mỗi lệnh. Vui lòng chia thành nhiều lần in";
      }
    },
    updatePrintQuantity(value: string | number): void {
      this.printQuantity = String(value);
      if (this.printQuantityError) this.printQuantityError = "";
    },
    closePrintDialog(): void {
      if (this.printingSkuId) return;
      this.printSku = null;
      this.printQuantity = "1";
      this.printQuantityError = "";
      this.printSubmissionError = "";
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
        this.printQuantityError = "Số lượng tem phải là số nguyên từ 1 đến 100";
        return;
      }

      this.printQuantityError = "";
      this.printSubmissionError = "";
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
        const printedQuantity = result.quantity || quantity;
        const skuLabel = sku.code || "không xác định";
        sku.printCount = (sku.printCount || 0) + 1;
        this.printSuccess =
          result.transport === "agent"
            ? `Đã xếp hàng ${printedQuantity} tem SKU ${skuLabel}.`
            : `Đã gửi ${printedQuantity} tem SKU ${skuLabel} đến GoDEX G500.`;
        this.printingSkuId = "";
        this.closePrintDialog();
      } catch (error) {
        const normalized = apiError(error);
        this.printSubmissionError = labelPrintFailureMessage(
          normalized.code,
          sku.code,
        );
      } finally {
        this.printingSkuId = "";
      }
    },
    async printAllStockLabels(): Promise<void> {
      if (!this.item || this.printingAll || this.printingSkuId || this.printSku) return;
      this.printingAll = true;
      this.printAllStopped = false;
      this.printError = "";
      this.printSuccess = "";
      let accepted = 0;
      let currentCode = "";
      let remaining = 0;
      try {
        const product = await warehouseService.detail(this.item.id);
        if (this.printAllStopped) return;
        const skus = product.skus.filter(sku => sku.stock > 0);
        const invalid = skus.find(sku => !Number.isSafeInteger(sku.stock) || !sku.id || !isInventoryBarcode(sku.barcode));
        if (invalid) {
          this.printError = `SKU ${invalid.code} có tồn kho hoặc barcode không hợp lệ. Chưa gửi lệnh in.`;
          await this.focusPrintError();
          return;
        }
        this.item = product;
        if (!skus.length) {
          this.printSuccess = "Không có SKU còn tồn kho để in tem.";
          return;
        }
        // The existing endpoint accepts one SKU and at most 100 labels per request.
        for (const sku of skus) {
          currentCode = sku.code;
          remaining = sku.stock;
          while (remaining > 0) {
            // Space submissions below the API limit of 30 print requests per minute.
            if (accepted) await new Promise(resolve => setTimeout(resolve, 2100));
            if (this.printAllStopped) return;
            const quantity = Math.min(100, remaining);
            const result = await warehouseService.printLabel(product.id, sku.id, quantity);
            if (!result.queued || result.quantity !== quantity) throw new Error("Máy chủ chưa xác nhận đủ số tem");
            accepted += quantity;
            remaining -= quantity;
            sku.printCount = (sku.printCount || 0) + 1;
            this.printSuccess = `Đã gửi ${accepted} tem vào hàng đợi in.`;
          }
        }
        this.printSuccess = `Đã gửi ${accepted} tem của ${skus.length} SKU theo tồn kho vào hàng đợi in.`;
      } catch (error) {
        if (this.printAllStopped) return;
        const message = labelPrintFailureMessage(apiError(error).code, currentCode);
        this.printError = currentCode
          ? `${message} Đã xác nhận ${accepted} tem trước đó. Dừng tại SKU ${currentCode}, còn ${remaining} tem chưa xác nhận. Kiểm tra hàng đợi trước khi in lại để tránh trùng tem.`
          : "Chưa tải được tồn kho mới nhất. Chưa gửi lệnh in, vui lòng thử lại.";
        await this.focusPrintError();
      } finally {
        this.printingAll = false;
      }
    },
    async load(): Promise<void> {
      this.loading = true;
      this.error = "";
      this.selectedSkuIds = [];
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
    openAddSkuModal(): void {
      this.editingSku = null;
      this.skuModalError = "";
      this.skuModalOpen = true;
    },
    openEditSkuModal(sku: WarehouseSku): void {
      this.editingSku = sku;
      this.skuModalError = "";
      this.skuModalOpen = true;
    },
    closeSkuModal(): void {
      if (this.skuModalSubmitting) return;
      this.skuModalOpen = false;
      this.editingSku = null;
      this.skuModalError = "";
    },
    showSkuFeedback(message: string, type: "success" | "danger" = "success"): void {
      this.skuToastMessage = message;
      this.skuToastType = type;
      if (type === "success") {
        this.skuActionSuccess = message;
        this.skuActionError = "";
        this.actionSuccess = message;
      } else {
        this.skuActionError = message;
        this.skuActionSuccess = "";
      }

      if (this.skuToastTimeout) {
        clearTimeout(this.skuToastTimeout);
      }
      this.skuToastTimeout = setTimeout(() => {
        this.skuToastMessage = "";
        this.skuToastTimeout = null;
      }, 4500);

      if (this.skuActionTimeout) {
        clearTimeout(this.skuActionTimeout);
      }
      this.skuActionTimeout = setTimeout(() => {
        this.skuActionSuccess = "";
        this.skuActionError = "";
        this.skuActionTimeout = null;
      }, 5000);
    },
    async saveSku(skuForm: WarehouseSkuFormModel): Promise<void> {
      if (!this.item) return;
      this.skuModalSubmitting = true;
      this.skuModalError = "";
      try {
        const baseForm = warehouseFormFromItem(this.item);
        let updatedSkus: WarehouseSkuFormModel[];
        if (this.editingSku) {
          const targetId = this.editingSku.id;
          const targetCode = this.editingSku.code;
          updatedSkus = baseForm.skus.map((s) => {
            if ((targetId && s.id === targetId) || s.code === targetCode) {
              return { ...s, ...skuForm };
            }
            return s;
          });
        } else {
          updatedSkus = [...baseForm.skus, skuForm];
        }
        const updatePayload = {
          ...baseForm,
          skus: updatedSkus,
        };
        this.item = await warehouseService.update(this.item.id, updatePayload);
        const successMsg = this.editingSku
          ? `Đã cập nhật SKU "${skuForm.code}" thành công.`
          : `Đã thêm mới SKU "${skuForm.code}" thành công.`;
        this.showSkuFeedback(successMsg, "success");
        this.closeSkuModal();
      } catch (error) {
        const errMsg = apiError(error).message;
        this.skuModalError = errMsg;
        this.showSkuFeedback(errMsg, "danger");
      } finally {
        this.skuModalSubmitting = false;
      }
    },
    requestDeleteSku(sku: WarehouseSku): void {
      if (this.displaySkus.length <= 1) {
        const msg = "Sản phẩm phải có ít nhất 1 SKU. Không thể xóa SKU cuối cùng.";
        this.error = msg;
        this.showSkuFeedback(msg, "danger");
        return;
      }
      this.deletingSku = sku;
      this.deleteSkuOpen = true;
    },
    cancelDeleteSku(): void {
      if (this.deleteSkuSubmitting) return;
      this.deleteSkuOpen = false;
      this.deletingSku = null;
    },
    async confirmDeleteSku(): Promise<void> {
      if (!this.item || !this.deletingSku) return;
      this.deleteSkuSubmitting = true;
      const skuToDelete = this.deletingSku;
      try {
        const baseForm = warehouseFormFromItem(this.item);
        const updatedSkus = baseForm.skus.filter((s) => {
          if (skuToDelete.id && s.id) {
            return s.id !== skuToDelete.id;
          }
          return s.code !== skuToDelete.code;
        });
        if (updatedSkus.length === 0) {
          throw new Error("Sản phẩm phải có ít nhất 1 SKU");
        }
        const updatePayload = {
          ...baseForm,
          skus: updatedSkus,
        };
        this.item = await warehouseService.update(this.item.id, updatePayload);
        this.selectedSkuIds = this.selectedSkuIds.filter(
          (id) => id !== (skuToDelete.id || skuToDelete.code),
        );
        const successMsg = `Đã xóa SKU "${skuToDelete.code}" thành công.`;
        this.showSkuFeedback(successMsg, "success");
        this.cancelDeleteSku();
      } catch (error) {
        const errMsg = apiError(error).message;
        this.error = errMsg;
        this.showSkuFeedback(errMsg, "danger");
        this.cancelDeleteSku();
      } finally {
        this.deleteSkuSubmitting = false;
      }
    },
    isSkuSelected(sku: WarehouseSku): boolean {
      const key = sku.id || sku.code;
      return this.selectedSkuIds.includes(key);
    },
    toggleSelectSku(sku: WarehouseSku, event: Event): void {
      const checked = (event.target as HTMLInputElement).checked;
      const key = sku.id || sku.code;
      if (checked) {
        if (!this.selectedSkuIds.includes(key)) {
          this.selectedSkuIds.push(key);
        }
      } else {
        this.selectedSkuIds = this.selectedSkuIds.filter((id) => id !== key);
      }
    },
    toggleSelectAllSkus(event: Event): void {
      const checked = (event.target as HTMLInputElement).checked;
      if (checked) {
        this.selectedSkuIds = this.displaySkus.map((s) => s.id || s.code);
      } else {
        this.selectedSkuIds = [];
      }
    },
    requestBulkDeleteSkus(): void {
      if (this.selectedSkuIds.length === 0) return;
      if (this.selectedSkuIds.length >= this.displaySkus.length) {
        const msg = "Sản phẩm phải có ít nhất 1 SKU. Không thể xóa tất cả SKU.";
        this.error = msg;
        this.showSkuFeedback(msg, "danger");
        return;
      }
      this.bulkDeleteSkuOpen = true;
    },
    cancelBulkDeleteSkus(): void {
      if (this.bulkDeleteSkuSubmitting) return;
      this.bulkDeleteSkuOpen = false;
    },
    async confirmBulkDeleteSkus(): Promise<void> {
      if (!this.item || this.selectedSkuIds.length === 0) return;
      if (this.selectedSkuIds.length >= this.displaySkus.length) {
        const msg = "Sản phẩm phải có ít nhất 1 SKU. Không thể xóa tất cả SKU.";
        this.error = msg;
        this.showSkuFeedback(msg, "danger");
        this.cancelBulkDeleteSkus();
        return;
      }
      this.bulkDeleteSkuSubmitting = true;
      const countToDelete = this.selectedSkuIds.length;
      const selectedKeys = new Set(this.selectedSkuIds);
      try {
        const baseForm = warehouseFormFromItem(this.item);
        const updatedSkus = baseForm.skus.filter((s) => {
          const key = s.id || s.code;
          return !selectedKeys.has(key);
        });
        if (updatedSkus.length === 0) {
          throw new Error("Sản phẩm phải có ít nhất 1 SKU");
        }
        const updatePayload = {
          ...baseForm,
          skus: updatedSkus,
        };
        this.item = await warehouseService.update(this.item.id, updatePayload);
        this.selectedSkuIds = [];
        const successMsg = `Đã xóa thành công ${countToDelete} SKU đã chọn.`;
        this.showSkuFeedback(successMsg, "success");
        this.cancelBulkDeleteSkus();
      } catch (error) {
        const errMsg = apiError(error).message;
        this.error = errMsg;
        this.showSkuFeedback(errMsg, "danger");
        this.cancelBulkDeleteSkus();
      } finally {
        this.bulkDeleteSkuSubmitting = false;
      }
    },
    toggleSkuSort(key: keyof WarehouseSku): void {
      if (this.skuSortKey === key) {
        this.skuSortDirection = this.skuSortDirection === "asc" ? "desc" : "asc";
      } else {
        this.skuSortKey = key;
        this.skuSortDirection = "asc";
      }
    },
    toggleSkuSortDirection(): void {
      this.skuSortDirection = this.skuSortDirection === "asc" ? "desc" : "asc";
    },
    skuSortIcon(key: keyof WarehouseSku): string {
      if (this.skuSortKey === key) {
        return this.skuSortDirection === "asc" ? "chevron-up" : "chevron-down";
      }
      return "chevrons-up-down";
    },
    skuAriaSort(key: keyof WarehouseSku): "ascending" | "descending" | "none" {
      if (this.skuSortKey === key) {
        return this.skuSortDirection === "asc" ? "ascending" : "descending";
      }
      return "none";
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
  display: inline-flex;
  gap: 0.35rem;
  align-items: baseline;
  padding: 0.375rem 0.5625rem;
  border-radius: 999px;
  color: var(--phoenix-body-color);
  background: var(--phoenix-secondary-bg);
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
}

.product-classification small {
  color: var(--phoenix-tertiary-color);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
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

.sku-table .sku-select-column {
  width: 2.75rem;
  min-width: 2.75rem;
  padding: 0.6875rem 0.5rem;
  text-align: center;
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

.sku-th-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  text-transform: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s ease-in-out;
}

.sku-th-btn:hover {
  color: var(--phoenix-primary);
}

.sku-th-btn:focus-visible {
  outline: 2px solid var(--phoenix-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

.sku-th-btn-end {
  justify-content: flex-end;
  width: 100%;
}

.sku-th-btn-center {
  justify-content: center;
  width: 100%;
}

.sku-sort-icon {
  width: 0.8125rem;
  height: 0.8125rem;
  opacity: 0.35;
  flex-shrink: 0;
  transition: opacity 0.15s ease-in-out, color 0.15s ease-in-out;
}

.sku-th-btn:hover .sku-sort-icon {
  opacity: 0.85;
  color: var(--phoenix-primary);
}

.sku-sort-icon-active {
  opacity: 1 !important;
  color: var(--phoenix-primary) !important;
}

.mobile-sku-sort-bar {
  margin-bottom: 0.25rem;
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
  transition: color 150ms ease;
}

a:hover .sku-code-cell {
  color: var(--phoenix-primary) !important;
  text-decoration: underline;
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
.sku-history-action,
.sku-edit-action,
.sku-delete-action {
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
  transition: all 0.15s ease-in-out;
}

.sku-history-action,
.sku-edit-action {
  border-color: var(--phoenix-border-color);
  color: var(--phoenix-body-color);
  background: var(--phoenix-body-bg);
  text-decoration: none;
}

.sku-edit-action:hover {
  background: var(--phoenix-secondary-bg);
  color: var(--phoenix-primary);
  border-color: var(--phoenix-primary);
}

.sku-delete-action {
  border-color: rgba(229, 62, 62, 0.3);
  color: #e53e3e;
  background: rgba(229, 62, 62, 0.08);
}

.sku-delete-action:hover:not(:disabled) {
  background: rgba(229, 62, 62, 0.16);
  color: #c53030;
  border-color: #e53e3e;
}

.sku-print-action:focus-visible,
.sku-history-action:focus-visible,
.sku-edit-action:focus-visible,
.sku-delete-action:focus-visible {
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
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.375rem;
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

.sku-toast-fade-enter-active,
.sku-toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.sku-toast-fade-enter-from,
.sku-toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
</style>
