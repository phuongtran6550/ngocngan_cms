<template>
  <form :id="formId" class="mb-9" @submit.prevent="submit">
    <div
      v-if="error || localError"
      class="alert alert-subtle-danger"
      role="alert"
    >
      {{ localError || error }}
    </div>

    <div class="warehouse-create-layout">
      <div ref="nameFieldRef" class="warehouse-name-field position-relative">
        <label
          class="form-label fs-8 fw-bold text-body-highlight"
          for="warehouse-name"
        >
          Tên sản phẩm <span class="text-danger">*</span>
        </label>
        <input
          id="warehouse-name"
          class="form-control"
          :class="{ 'is-invalid': hasFieldError('name') }"
          name="name"
          :value="draft.name"
          placeholder="Nhập tên sản phẩm..."
          required
          maxlength="160"
          :disabled="submitting"
          :aria-invalid="hasFieldError('name') ? 'true' : undefined"
          :aria-describedby="
            hasFieldError('name') ? fieldErrorId('name') : undefined
          "
          autocomplete="off"
          @input="onNameInput"
          @focus="onNameFocus"
          @keydown.esc="nameSuggestionsOpen = false"
        />
        <FieldError :id="fieldErrorId('name')" :message="fieldError('name')" />

        <!-- Gợi ý tên sản phẩm từ database -->
        <div
          v-if="nameSuggestionsOpen && (nameSuggestionsLoading || nameSuggestions.length > 0)"
          class="dropdown-menu show w-100 shadow-sm border border-translucent mt-1 p-1"
          style="max-height: 240px; overflow-y: auto; z-index: 1050;"
        >
          <div v-if="nameSuggestionsLoading && !nameSuggestions.length" class="px-3 py-2 text-center text-body-tertiary fs-9">
            <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
            Đang tìm gợi ý tên...
          </div>
          <div v-else>
            <div class="dropdown-header text-uppercase fs-10 fw-bold px-2 py-1 text-body-secondary">
              Gợi ý từ database (nhấp để chọn)
            </div>
            <button
              v-for="item in nameSuggestions"
              :key="item.id"
              type="button"
              class="dropdown-item d-flex align-items-center justify-content-between rounded-1 px-2 py-2 fs-9 mb-1"
              @click="selectNameSuggestion(item)"
            >
              <div class="d-flex align-items-center gap-2 min-w-0">
                <img
                  v-if="item.thumbnail"
                  :src="item.thumbnail"
                  :alt="item.title"
                  class="rounded-1 object-fit-cover flex-shrink-0"
                  width="24"
                  height="24"
                />
                <span class="text-truncate fw-semibold">{{ item.title }}</span>
              </div>
              <span v-if="item.subtitle" class="text-body-tertiary fs-10 ms-2 text-truncate">{{ item.subtitle }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="warehouse-image-section">
        <div
          class="d-flex align-items-center justify-content-between gap-3 mb-3"
        >
          <div>
            <h3 class="fs-7 mb-1">Hình ảnh sản phẩm</h3>
            <p class="text-body-tertiary fs-9 mb-0">
              Dùng ảnh rõ sản phẩm để dễ nhận diện khi nhập và xuất kho. Nếu để trống, hệ thống sẽ sử dụng ảnh mặc định.
            </p>
          </div>
          <span class="badge badge-phoenix badge-phoenix-secondary"
            >Không bắt buộc</span
          >
        </div>
        <div :class="{ 'is-invalid': hasFieldError('thumbnail') }">
          <ImageUploader
            :src="existingThumbnail"
            :disabled="submitting"
            @select="selectThumbnail"
          />
        </div>
        <FieldError
          :id="fieldErrorId('thumbnail')"
          :message="fieldError('thumbnail')"
        />
      </div>

      <div class="card sku-section border-0">
        <div class="card-body p-4 p-lg-5">
          <div
            class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4"
          >
            <div>
              <p
                class="text-uppercase text-body-tertiary fs-10 fw-bold letter-spacing mb-1"
              >
                SKU & định giá
              </p>
              <h3 class="fs-6 mb-1">Quy cách từng SKU</h3>
              <p class="text-body-tertiary fs-9 mb-0">
                Mỗi SKU có tồn kho, trọng lượng, chi phí và giá bán độc lập.
              </p>
            </div>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="badge badge-phoenix badge-phoenix-info fs-9">
                {{ draft.skus.length }} SKU
              </span>
              <select
                id="warehouse-sku-sort-select"
                v-model="skuSortOption"
                class="form-select form-select-sm sku-sort-select"
                :disabled="submitting || draft.skus.length <= 1"
                data-testid="sku-sort-select"
                aria-label="Sắp xếp danh sách SKU"
                @change="handleSkuSortChange"
              >
                <option value="">Sắp xếp SKU...</option>
                <option value="original">Thứ tự ban đầu</option>
                <optgroup label="Trọng lượng chỉ">
                  <option value="weight-asc">Trọng lượng chỉ: Tăng dần</option>
                  <option value="weight-desc">Trọng lượng chỉ: Giảm dần</option>
                </optgroup>
                <optgroup label="Tồn kho">
                  <option value="stock-asc">Tồn kho: Tăng dần</option>
                  <option value="stock-desc">Tồn kho: Giảm dần</option>
                </optgroup>
                <optgroup label="Tiền công">
                  <option value="laborCost-asc">Tiền công: Tăng dần</option>
                  <option value="laborCost-desc">Tiền công: Giảm dần</option>
                </optgroup>
                <optgroup label="Tiền xi">
                  <option value="platingCost-asc">Tiền xi: Tăng dần</option>
                  <option value="platingCost-desc">Tiền xi: Giảm dần</option>
                </optgroup>
              </select>
              <button
                type="button"
                class="btn btn-sm btn-primary"
                data-testid="add-sku"
                :disabled="submitting"
                @click="addSku"
              >
                <span class="fas fa-plus me-1" aria-hidden="true" />
                Thêm SKU
              </button>
            </div>
          </div>

          <div class="sku-list">
            <article
              v-for="(sku, index) in draft.skus"
              :key="sku.clientId"
              class="sku-item"
              data-testid="sku-card"
            >
              <header class="sku-item-header">
                <div class="d-flex align-items-center gap-3">
                  <span class="sku-number">{{
                    String(index + 1).padStart(2, "0")
                  }}</span>
                  <div>
                    <h4 class="fs-8 mb-0">SKU {{ index + 1 }}</h4>
                    <p class="fs-10 text-body-tertiary mb-0">
                      {{ sku.size || "Chưa nhập kích cỡ / ni tay" }}
                    </p>
                  </div>
                </div>
                <button
                  v-if="draft.skus.length > 1"
                  type="button"
                  class="btn btn-sm btn-phoenix-danger"
                  :data-testid="`remove-sku-${index}`"
                  :aria-label="`Xóa SKU ${index + 1}`"
                  :disabled="submitting"
                  @click="removeSku(index)"
                >
                  <span class="fas fa-trash-alt me-1" aria-hidden="true" />
                  Xóa
                </button>
              </header>

              <div class="row g-4 p-3 p-lg-4">
                <div class="col-12 col-lg-7">
                  <div class="row g-3">
                    <div class="col-12 sku-code-field">
                      <div
                        class="d-flex justify-content-between align-items-center mb-1"
                      >
                        <label
                          class="form-label mb-0"
                          :for="skuFieldId(index, 'code')"
                        >
                          Mã SKU <span class="text-danger">*</span>
                        </label>
                        <span
                          v-if="sku.codeMode === 'auto'"
                          class="badge badge-phoenix badge-phoenix-info fs-10"
                        >
                          Tự động sinh mã
                        </span>
                        <span
                          v-else
                          class="badge badge-phoenix badge-phoenix-warning fs-10"
                        >
                          Tự nhập mã
                        </span>
                      </div>
                      <div class="input-group">
                        <input
                          :id="skuFieldId(index, 'code')"
                          class="form-control font-monospace text-uppercase"
                          :class="{
                            'is-invalid': hasFieldError(`skus.${index}.code`),
                            'bg-body-tertiary': sku.codeMode === 'auto',
                          }"
                          :name="`skus[${index}].code`"
                          :value="sku.code"
                          :readonly="sku.codeMode === 'auto'"
                          :placeholder="
                            sku.codeMode === 'auto'
                              ? 'Tự tạo từ phân loại và quy cách'
                              : 'Nhập mã SKU tùy chỉnh'
                          "
                          maxlength="100"
                          required
                          :disabled="submitting"
                          :aria-invalid="
                            hasFieldError(`skus.${index}.code`)
                              ? 'true'
                              : undefined
                          "
                          :aria-describedby="
                            hasFieldError(`skus.${index}.code`)
                              ? fieldErrorId(`skus.${index}.code`)
                              : undefined
                          "
                          @input="updateSkuCode(index, $event)"
                          @blur="handleSkuCodeBlur(index)"
                        />
                        <button
                          type="button"
                          class="btn btn-phoenix-secondary"
                          :aria-label="
                            sku.codeMode === 'auto'
                              ? `Tự nhập mã SKU ${index + 1}`
                              : `Tạo tự động mã SKU ${index + 1}`
                          "
                          :disabled="submitting"
                          @click="toggleSkuCodeMode(index)"
                        >
                          <span
                            v-if="sku.codeMode === 'auto'"
                            class="fas fa-edit me-1"
                            aria-hidden="true"
                          />
                          <span
                            v-else
                            class="fas fa-sync-alt me-1"
                            aria-hidden="true"
                          />
                          {{
                            sku.codeMode === "auto"
                              ? "Tự nhập mã"
                              : "Tạo tự động"
                          }}
                        </button>
                      </div>
                      <FieldError
                        :id="fieldErrorId(`skus.${index}.code`)"
                        :message="fieldError(`skus.${index}.code`)"
                      />
                      <small class="text-body-tertiary">
                        {{
                          sku.codeMode === "auto"
                            ? "Tự động ghép danh mục, chất liệu, mẫu, trọng lượng và ni."
                            : "Mã SKU do bạn tự điều chỉnh, không bị tự động ghi đè khi đổi quy cách."
                        }}
                      </small>
                    </div>
                    <div class="col-12 col-sm-6">
                      <label
                        class="form-label"
                        :for="skuFieldId(index, 'size')"
                      >
                        Kích cỡ / Ni tay
                      </label>
                      <input
                        :id="skuFieldId(index, 'size')"
                        class="form-control"
                        :class="{
                          'is-invalid': hasFieldError(`skus.${index}.size`),
                        }"
                        :name="`skus[${index}].size`"
                        :value="sku.size"
                        placeholder="Ví dụ: Ni 12"
                        maxlength="50"
                        :disabled="submitting"
                        :aria-invalid="
                          hasFieldError(`skus.${index}.size`)
                            ? 'true'
                            : undefined
                        "
                        :aria-describedby="
                          hasFieldError(`skus.${index}.size`)
                            ? fieldErrorId(`skus.${index}.size`)
                            : undefined
                        "
                        @input="updateSkuText(index, 'size', $event)"
                        @blur="checkSkuCodesOnBlur"
                      />
                      <FieldError
                        :id="fieldErrorId(`skus.${index}.size`)"
                        :message="fieldError(`skus.${index}.size`)"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label
                        class="form-label"
                        :for="skuFieldId(index, 'weight')"
                      >
                        Trọng lượng chỉ <span v-if="isWeighted" class="text-danger">*</span>
                      </label>
                      <div class="input-group">
                        <input
                          :id="skuFieldId(index, 'weight')"
                          class="form-control"
                          :class="{
                            'is-invalid': hasFieldError(`skus.${index}.weight`),
                          }"
                          :name="`skus[${index}].weight`"
                          type="number"
                          inputmode="decimal"
                          :min="isWeighted ? 0.01 : 0"
                          step="0.01"
                          :value="sku.weight || ''"
                          placeholder="0"
                          :required="isWeighted"
                          :disabled="submitting"
                          :aria-invalid="
                            hasFieldError(`skus.${index}.weight`)
                              ? 'true'
                              : undefined
                          "
                          :aria-describedby="
                            hasFieldError(`skus.${index}.weight`)
                              ? fieldErrorId(`skus.${index}.weight`)
                              : undefined
                          "
                          @input="updateSkuNumber(index, 'weight', $event)"
                          @blur="checkSkuCodesOnBlur"
                        />
                        <span class="input-group-text">chỉ</span>
                      </div>
                      <FieldError
                        :id="fieldErrorId(`skus.${index}.weight`)"
                        :message="fieldError(`skus.${index}.weight`)"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <label
                        class="form-label"
                        :for="skuFieldId(index, 'stock')"
                      >
                        Tồn kho <span class="text-danger">*</span>
                      </label>
                      <input
                        :id="skuFieldId(index, 'stock')"
                        class="form-control"
                        :class="{
                          'is-invalid': hasFieldError(`skus.${index}.stock`),
                        }"
                        :name="`skus[${index}].stock`"
                        type="number"
                        inputmode="numeric"
                        min="0"
                        step="1"
                        :value="sku.stock"
                        required
                        :disabled="submitting"
                        :aria-invalid="
                          hasFieldError(`skus.${index}.stock`)
                            ? 'true'
                            : undefined
                        "
                        :aria-describedby="
                          hasFieldError(`skus.${index}.stock`)
                            ? fieldErrorId(`skus.${index}.stock`)
                            : undefined
                        "
                        @input="updateSkuNumber(index, 'stock', $event)"
                      />
                      <FieldError
                        :id="fieldErrorId(`skus.${index}.stock`)"
                        :message="fieldError(`skus.${index}.stock`)"
                      />
                    </div>

                    <div class="col-12 col-sm-6">
                      <label
                        class="form-label"
                        :for="skuFieldId(index, 'laborCost')"
                      >
                        Tiền công
                      </label>
                      <MoneyInput
                        :id="skuFieldId(index, 'laborCost')"
                        :name="`skus[${index}].laborCost`"
                        :model-value="sku.laborCost"
                        :disabled="submitting"
                        :invalid="hasFieldError(`skus.${index}.laborCost`)"
                        :described-by="
                          hasFieldError(`skus.${index}.laborCost`)
                            ? fieldErrorId(`skus.${index}.laborCost`)
                            : ''
                        "
                        @update:model-value="
                          updateSkuMoney(index, 'laborCost', $event)
                        "
                      />
                      <FieldError
                        :id="fieldErrorId(`skus.${index}.laborCost`)"
                        :message="fieldError(`skus.${index}.laborCost`)"
                      />
                    </div>

                    <div class="col-12 col-sm-6">
                      <label
                        class="form-label"
                        :for="skuFieldId(index, 'platingCost')"
                      >
                        Tiền xi
                      </label>
                      <MoneyInput
                        :id="skuFieldId(index, 'platingCost')"
                        :name="`skus[${index}].platingCost`"
                        :model-value="sku.platingCost"
                        :disabled="submitting"
                        :invalid="hasFieldError(`skus.${index}.platingCost`)"
                        :described-by="
                          hasFieldError(`skus.${index}.platingCost`)
                            ? fieldErrorId(`skus.${index}.platingCost`)
                            : ''
                        "
                        @update:model-value="
                          updateSkuMoney(index, 'platingCost', $event)
                        "
                      />
                      <FieldError
                        :id="fieldErrorId(`skus.${index}.platingCost`)"
                        :message="fieldError(`skus.${index}.platingCost`)"
                      />
                    </div>

                    <div v-if="isPiece" class="col-12 col-sm-6">
                      <label
                        class="form-label"
                        :for="skuFieldId(index, 'importPrice')"
                      >
                        Giá nhập <span class="text-danger">*</span>
                      </label>
                      <MoneyInput
                        :id="skuFieldId(index, 'importPrice')"
                        :name="`skus[${index}].importPrice`"
                        :model-value="sku.importPrice"
                        :disabled="submitting"
                        :invalid="hasFieldError(`skus.${index}.importPrice`)"
                        :described-by="
                          hasFieldError(`skus.${index}.importPrice`)
                            ? fieldErrorId(`skus.${index}.importPrice`)
                            : `${skuFieldId(index, 'importPrice')}-note`
                        "
                        required
                        @update:model-value="
                          updateSkuMoney(index, 'importPrice', $event)
                        "
                      />
                      <FieldError
                        :id="fieldErrorId(`skus.${index}.importPrice`)"
                        :message="fieldError(`skus.${index}.importPrice`)"
                      />
                      <small
                        :id="`${skuFieldId(index, 'importPrice')}-note`"
                        class="text-body-tertiary"
                      >
                        Nhập giá nhập để hệ thống tự tính giá bán.
                      </small>
                    </div>

                    <div v-if="isPiece" class="col-12 col-sm-6">
                      <label
                        class="form-label"
                        :for="skuFieldId(index, 'price')"
                      >
                        Giá bán <span class="text-danger">*</span>
                      </label>
                      <MoneyInput
                        :id="skuFieldId(index, 'price')"
                        :name="`skus[${index}].price`"
                        :model-value="sku.price"
                        :disabled="submitting"
                        :invalid="hasFieldError(`skus.${index}.price`)"
                        :described-by="
                          hasFieldError(`skus.${index}.price`)
                            ? fieldErrorId(`skus.${index}.price`)
                            : `${skuFieldId(index, 'price')}-note`
                        "
                        required
                        @update:model-value="
                          updateSkuMoney(index, 'price', $event)
                        "
                      />
                      <FieldError
                        :id="fieldErrorId(`skus.${index}.price`)"
                        :message="fieldError(`skus.${index}.price`)"
                      />
                      <small
                        :id="`${skuFieldId(index, 'price')}-note`"
                        class="text-body-tertiary"
                      >
                        Nhập giá bán để hệ thống tự quy ngược giá nhập.
                      </small>
                    </div>

                    <div
                      v-if="!isPiece"
                      class="col-12"
                    >
                      <label
                        class="form-label"
                        :for="skuFieldId(index, 'price')"
                      >
                        Giá bán sau làm tròn
                      </label>
                      <div
                        class="input-group input-group-lg selling-price-input"
                      >
                        <input
                          :id="skuFieldId(index, 'price')"
                          class="form-control fw-bold"
                          :class="{
                            'is-invalid': hasFieldError(`skus.${index}.price`),
                          }"
                          :name="`skus[${index}].price`"
                          type="number"
                          :value="sku.price"
                          readonly
                          :aria-invalid="
                            hasFieldError(`skus.${index}.price`)
                              ? 'true'
                              : undefined
                          "
                          :aria-describedby="
                            hasFieldError(`skus.${index}.price`)
                              ? `${skuFieldId(index, 'price')}-note ${fieldErrorId(
                                  `skus.${index}.price`,
                                )}`
                              : `${skuFieldId(index, 'price')}-note`
                          "
                        />
                        <span class="input-group-text">₫</span>
                      </div>
                      <FieldError
                        :id="fieldErrorId(`skus.${index}.price`)"
                        :message="fieldError(`skus.${index}.price`)"
                      />
                      <small
                        :id="`${skuFieldId(index, 'price')}-note`"
                        class="text-body-tertiary"
                      >
                        Hệ thống xác minh lại giá trước khi lưu.
                      </small>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-lg-5">
                  <aside
                    class="pricing-formula h-100"
                    :data-testid="`pricing-formula-${index}`"
                  >
                    <div class="d-flex align-items-center gap-2 mb-3">
                      <span class="formula-icon">
                        <span class="fas fa-calculator" aria-hidden="true" />
                      </span>
                      <div>
                        <h5 class="fs-8 mb-0">
                          Cách tính giá SKU {{ index + 1 }}
                        </h5>
                        <p class="fs-10 text-body-tertiary mb-0">
                          Chi phí tạo nên giá bán
                        </p>
                        <code
                          class="pricing-sku-code"
                          :data-testid="`pricing-sku-code-${index}`"
                        >
                          {{ sku.code || "Chưa có mã SKU" }}
                        </code>
                      </div>
                    </div>

                    <div v-if="!draft.pricingType" class="formula-empty">
                      Chọn loại sản phẩm để xem công thức và chi phí tương ứng.
                    </div>
                    <div
                      v-else-if="isWeighted && !hasSilverPrice"
                      class="alert alert-subtle-warning fs-9 mb-0"
                      role="status"
                    >
                      Chưa cấu hình giá bạc hiện tại. Vui lòng cập nhật tại
                      trang Cài đặt trước khi lưu đồ cân.
                    </div>
                    <template v-else>
                      <dl class="formula-list mb-3">
                        <template v-if="isWeighted">
                          <div>
                            <dt>Giá bạc hiện tại</dt>
                            <dd>{{ money(options.silverPrice) }}</dd>
                          </div>
                          <div>
                            <dt>Trọng lượng</dt>
                            <dd>{{ number(sku.weight) }} chỉ</dd>
                          </div>
                          <div>
                            <dt>Tiền bạc</dt>
                            <dd>{{ money(silverValue(sku)) }}</dd>
                          </div>
                          <div>
                            <dt>Tiền công</dt>
                            <dd>{{ money(sku.laborCost) }}</dd>
                          </div>
                          <div>
                            <dt>Tiền xi</dt>
                            <dd>{{ money(sku.platingCost) }}</dd>
                          </div>
                        </template>
                        <template v-else>
                          <div>
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
                            <dt>Giá nhân đôi</dt>
                            <dd>{{ money(pieceDoublePrice(sku)) }}</dd>
                          </div>
                          <div>
                            <dt>Mức giảm</dt>
                            <dd>{{ pieceDiscountLabel(sku) }}</dd>
                          </div>
                        </template>
                        <div class="formula-subtotal">
                          <dt>Tạm tính</dt>
                          <dd>{{ money(rawPrice(sku)) }}</dd>
                        </div>
                      </dl>
                      <div class="formula-total">
                        <span>Giá bán áp dụng</span>
                        <strong>{{ money(sku.price) }}</strong>
                      </div>
                    </template>
                  </aside>
                </div>
              </div>
            </article>
          </div>

          <button
            type="button"
            class="add-sku-footer"
            :disabled="submitting"
            @click="addSku"
          >
            <span class="fas fa-plus-circle" aria-hidden="true" />
            Thêm một SKU khác
          </button>
        </div>
      </div>

      <aside class="warehouse-organize">
        <div class="card organize-card position-sticky">
          <div class="card-body p-4">
            <div class="d-flex align-items-center justify-content-between mb-4">
              <div>
                <p
                  class="text-uppercase text-body-tertiary fs-10 fw-bold letter-spacing mb-1"
                >
                  Phân loại
                </p>
                <h3 class="card-title fs-7 mb-0">Sắp xếp sản phẩm</h3>
              </div>
              <span class="fas fa-tags text-warning fs-6" aria-hidden="true" />
            </div>

            <div class="mb-4">
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <label class="form-label mb-0" for="warehouse-category">
                  Danh mục <span class="text-danger">*</span>
                </label>
                <RouterLink class="fs-10 fw-bold" to="/categories"
                  >Quản lý</RouterLink
                >
              </div>
              <AutoCompleteSelect
                id="warehouse-category"
                name="categoryId"
                :model-value="draft.categoryId"
                :options="options.categories"
                placeholder="Chọn danh mục"
                search-placeholder="Tìm danh mục..."
                :disabled="submitting"
                :required="true"
                :invalid="hasFieldError('categoryId')"
                :described-by="
                  hasFieldError('categoryId')
                    ? fieldErrorId('categoryId')
                    : undefined
                "
                @update:model-value="updateSelectValue('categoryId', String($event))"
                @blur="checkSkuCodesOnBlur"
              />
              <FieldError
                :id="fieldErrorId('categoryId')"
                :message="fieldError('categoryId')"
              />
            </div>

            <div class="mb-4">
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <label class="form-label mb-0" for="warehouse-material">
                  Chất liệu <span class="text-danger">*</span>
                </label>
                <RouterLink class="fs-10 fw-bold" to="/materials"
                  >Quản lý</RouterLink
                >
              </div>
              <AutoCompleteSelect
                id="warehouse-material"
                name="materialId"
                :model-value="draft.materialId"
                :options="options.materials"
                placeholder="Chọn chất liệu"
                search-placeholder="Tìm chất liệu..."
                :disabled="submitting"
                :required="true"
                :invalid="hasFieldError('materialId')"
                :described-by="
                  hasFieldError('materialId')
                    ? fieldErrorId('materialId')
                    : undefined
                "
                @update:model-value="updateSelectValue('materialId', String($event))"
                @blur="checkSkuCodesOnBlur"
              />
              <FieldError
                :id="fieldErrorId('materialId')"
                :message="fieldError('materialId')"
              />
            </div>

            <div class="mb-4">
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <label class="form-label mb-0" for="warehouse-pattern">
                  Mẫu <span class="text-danger">*</span>
                </label>
                <RouterLink class="fs-10 fw-bold" to="/patterns"
                  >Quản lý</RouterLink
                >
              </div>
              <AutoCompleteSelect
                id="warehouse-pattern"
                name="patternId"
                :model-value="draft.patternId"
                :options="options.patterns"
                placeholder="Chọn mẫu"
                search-placeholder="Tìm mẫu..."
                :disabled="submitting"
                :required="true"
                :invalid="hasFieldError('patternId')"
                :described-by="
                  hasFieldError('patternId')
                    ? fieldErrorId('patternId')
                    : undefined
                "
                @update:model-value="updateSelectValue('patternId', String($event))"
                @blur="checkSkuCodesOnBlur"
              />
              <FieldError
                :id="fieldErrorId('patternId')"
                :message="fieldError('patternId')"
              />
            </div>

            <div>
              <label class="form-label" for="warehouse-pricing-type">
                Loại sản phẩm <span class="text-danger">*</span>
              </label>
              <AutoCompleteSelect
                id="warehouse-pricing-type"
                name="pricingType"
                :model-value="draft.pricingType"
                :options="pricingTypeOptions"
                placeholder="Chọn loại sản phẩm"
                search-placeholder="Tìm loại sản phẩm..."
                :disabled="submitting"
                :required="true"
                :invalid="hasFieldError('pricingType')"
                :described-by="
                  hasFieldError('pricingType')
                    ? fieldErrorId('pricingType')
                    : undefined
                "
                @update:model-value="setPricingType(String($event))"
              />
              <FieldError
                :id="fieldErrorId('pricingType')"
                :message="fieldError('pricingType')"
              />
              <p class="text-body-tertiary fs-10 mt-2 mb-0">
                Loại sản phẩm áp dụng cho toàn bộ SKU và quyết định công thức
                giá bán.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { RouterLink } from "vue-router";
import FieldError from "@/components/Form/FieldError.vue";
import AutoCompleteSelect from "@/components/Form/AutoCompleteSelect.vue";
import MoneyInput from "@/components/Form/MoneyInput.vue";
import ImageUploader from "@/components/media/ImageUploader.vue";
import { formatMoney, formatNumberValue } from "@/utils/resource-display";
import {
  calculatePiecePrice,
  calculateWeightedPrice,
  estimatePieceImportPrice,
  estimatePieceImportPrices,
} from "@/views/WarehousedGoods/pricing";
import { request } from "@/request";
import type { CategoryGroup } from "@/views/Categories/types";
import {
  normalizeSkuCode,
  suggestSkuCodes,
} from "@/views/WarehousedGoods/sku-code";
import { warehouseService } from "@/views/WarehousedGoods/service";
import {
  fetchWarehouseSuggestions,
  type SearchSuggestionItem,
} from "@/components/Form/search-suggestion";
import {
  emptyWarehouseSku,
  type InventoryCreatePricingType,
  type InventoryOption,
  type WarehouseFormModel,
  type WarehouseOptionsResponse,
  type WarehouseSkuFormModel,
} from "@/views/WarehousedGoods/types";

type ProductTextKey = "name" | "categoryId" | "materialId" | "patternId";
type SkuMoneyKey = "laborCost" | "platingCost" | "importPrice" | "price";

interface SkuCodeCheckRow {
  index: number;
  clientId: string;
  code: string;
}

function copyForm(value: WarehouseFormModel): WarehouseFormModel {
  return { ...value, skus: value.skus.map((sku) => ({ ...sku })) };
}

export default defineComponent({
  name: "WarehouseCreateForm",
  components: {
    AutoCompleteSelect,
    FieldError,
    ImageUploader,
    MoneyInput,
    RouterLink,
  },
  props: {
    modelValue: {
      type: Object as PropType<WarehouseFormModel>,
      required: true,
    },
    options: {
      type: Object as PropType<WarehouseOptionsResponse>,
      required: true,
    },
    formId: { type: String, default: "warehouse-create-form" },
    existingThumbnail: { type: String, default: "" },
    submitting: { type: Boolean, default: false },
    error: { type: String, default: "" },
    fieldErrors: {
      type: Object as PropType<Record<string, string>>,
      default: () => ({}),
    },
  },
  emits: ["update:modelValue", "clear-field-error", "submit"],
  data() {
    const draft = copyForm(this.modelValue);
    return {
      draft,
      localError: "",
      localFieldErrors: {} as Record<string, string>,
      categoryGroupsMap: {} as Record<string, CategoryGroup[]>,
      skuCodeCheckController: null as AbortController | null,
      skuCodeCheckSequence: 0,
      skuSortOption: "",
      initialSkuOrder: draft.skus.map((sku) => sku.clientId),
      nameSuggestions: [] as SearchSuggestionItem[],
      nameSuggestionsOpen: false,
      nameSuggestionsLoading: false,
      nameDebounceTimer: null as ReturnType<typeof setTimeout> | null,
      nameAbortController: null as AbortController | null,
    };
  },
  mounted() {
    document.addEventListener("click", this.handleNameClickOutside, true);
    if (this.draft.categoryId) {
      void this.fetchCategoryGroups(this.draft.categoryId);
    }
  },
  computed: {
    isWeighted(): boolean {
      return this.draft.pricingType === "Đồ cân";
    },
    isPiece(): boolean {
      return this.draft.pricingType === "Đồ món";
    },
    hasSilverPrice(): boolean {
      return Number(this.options.silverPrice) > 0;
    },
    pricingTypeOptions(): Array<{ label: string; value: string }> {
      return [
        { label: "Đồ cân", value: "Đồ cân" },
        { label: "Đồ món", value: "Đồ món" },
      ];
    },
  },
  watch: {
    modelValue: {
      deep: true,
      handler(value: WarehouseFormModel) {
        this.invalidateSkuCodeCheck(value);
        this.draft = copyForm(value);
        this.syncInitialSkuOrder(value.skus);
      },
    },
    "options.silverPrice"() {
      this.commit(this.withCalculatedPrices(copyForm(this.draft)));
    },
    fieldErrors: {
      deep: true,
      immediate: true,
      handler(errors: Record<string, string>) {
        const first = Object.keys(errors)[0];
        if (first) this.$nextTick(() => this.focusField(first));
      },
    },
    submitting(value: boolean) {
      if (value) return;
      const first = Object.keys(this.fieldErrors)[0];
      if (first) this.$nextTick(() => this.focusField(first));
    },
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleNameClickOutside, true);
    if (this.nameDebounceTimer) clearTimeout(this.nameDebounceTimer);
    this.nameAbortController?.abort();
    this.skuCodeCheckController?.abort();
  },
  methods: {
    fieldError(key: string): string {
      return this.localFieldErrors[key] || this.fieldErrors[key] || "";
    },
    fieldErrorId(key: string): string {
      return `warehouse-error-${key.replace(/[^A-Za-z0-9]+/g, "-")}`;
    },
    hasFieldError(key: string): boolean {
      return Boolean(this.fieldError(key));
    },
    fieldName(key: string): string {
      const sku = key.match(/^skus\.(\d+)\.([A-Za-z]+)$/);
      return sku ? `skus[${sku[1]}].${sku[2]}` : key;
    },
    focusField(key: string): void {
      const form = this.$el as HTMLFormElement | undefined;
      if (!form) return;
      const target =
        key === "thumbnail"
          ? form.querySelector<HTMLElement>(".warehouse-image-section button")
          : [...form.querySelectorAll<HTMLElement>("[name]")].find(
              (element) => element.getAttribute("name") === this.fieldName(key),
            );
      target?.focus();
    },
    clearFieldError(key: string): void {
      const message = this.localFieldErrors[key];
      if (message) {
        const { [key]: _removed, ...remaining } = this.localFieldErrors;
        this.localFieldErrors = remaining;
        if (this.localError === message) this.localError = "";
      }
      if (this.fieldErrors[key]) this.$emit("clear-field-error", key);
    },
    setLocalFieldError(key: string, message: string): void {
      this.localError = message;
      this.localFieldErrors = key ? { [key]: message } : {};
      if (key) this.$nextTick(() => this.focusField(key));
    },
    clearLocalValidation(): void {
      this.localError = "";
      this.localFieldErrors = {};
    },
    money(value: unknown): string {
      return formatMoney(value);
    },
    number(value: unknown): string {
      return formatNumberValue(value);
    },
    eventValue(event: Event): string {
      return (event.target as HTMLInputElement | HTMLSelectElement).value;
    },
    skuFieldId(index: number, field: string): string {
      return `warehouse-sku-${index}-${field}`;
    },
    weightedPreview(
      sku: WarehouseSkuFormModel,
    ): ReturnType<typeof calculateWeightedPrice> {
      return calculateWeightedPrice({
        silverPrice: Number(this.options.silverPrice) || 0,
        weight: sku.weight,
        laborCost: sku.laborCost,
        platingCost: sku.platingCost,
      });
    },
    piecePreview(
      sku: WarehouseSkuFormModel,
    ): ReturnType<typeof calculatePiecePrice> {
      return calculatePiecePrice(
        Number(sku.importPrice) || 0,
        Number(sku.platingCost) || 0,
        Number(sku.laborCost) || 0,
      );
    },
    rawPrice(sku: WarehouseSkuFormModel): number {
      if (this.isWeighted) return this.weightedPreview(sku).rawPrice;
      if (this.isPiece) return this.piecePreview(sku).rawPrice;
      return 0;
    },
    silverValue(sku: WarehouseSkuFormModel): number {
      return Math.round((Number(this.options.silverPrice) || 0) * sku.weight);
    },
    pieceDoublePrice(sku: WarehouseSkuFormModel): number {
      return (Number(sku.importPrice) || 0) * 2;
    },
    pieceDiscountLabel(sku: WarehouseSkuFormModel): string {
      const percentage = Math.round(
        this.piecePreview(sku).discountRate * 100,
      );
      return percentage ? `giảm ${percentage}%` : "không giảm";
    },
    optionName(options: InventoryOption[], id: string): string {
      return options.find((option) => option.id === id)?.name || "";
    },
    async fetchCategoryGroups(categoryId: string): Promise<void> {
      if (!categoryId || this.categoryGroupsMap[categoryId]) return;
      try {
        const { data } = await request.get<{
          item?: { id: string; groups?: CategoryGroup[] };
          groups?: CategoryGroup[];
        }>(`/categories/${categoryId}`);
        const item = data?.item || data;
        if (item) {
          this.categoryGroupsMap = {
            ...this.categoryGroupsMap,
            [categoryId]: Array.isArray(item.groups) ? item.groups : [],
          };
          this.commit(this.withCalculatedPrices(copyForm(this.draft)));
        }
      } catch {
        // ignore
      }
    },
    withSuggestedSkuCodes(input: WarehouseFormModel): WarehouseFormModel {
      return {
        ...input,
        skus: suggestSkuCodes(input.skus, {
          pricingType: input.pricingType,
          name: input.name,
          category: this.optionName(this.options.categories, input.categoryId),
          categoryGroups: this.categoryGroupsMap[input.categoryId] || [],
          material: this.optionName(this.options.materials, input.materialId),
          pattern: this.optionName(this.options.patterns, input.patternId),
        }),
      };
    },
    pricedSku(
      sku: WarehouseSkuFormModel,
      pricingType: WarehouseFormModel["pricingType"],
    ): WarehouseSkuFormModel {
      if (pricingType === "Đồ cân") {
        return {
          ...sku,
          importPrice: null,
          price: this.weightedPreview(sku).price,
        };
      }
      if (pricingType === "Đồ món") {
        const enteredPrice = Number(sku.price) || 0;
        const platingCost = Number(sku.platingCost) || 0;
        const laborCost = Number(sku.laborCost) || 0;
        const keepsEnteredPrice = estimatePieceImportPrices(
          enteredPrice,
          platingCost,
          laborCost,
        ).some(
          (candidate) =>
            candidate.importPrice === Number(sku.importPrice),
        );
        return {
          ...sku,
          laborCost,
          platingCost,
          price: keepsEnteredPrice
            ? enteredPrice
            : this.piecePreview(sku).price,
        };
      }
      return { ...sku, price: 0 };
    },
    withCalculatedPrices(input: WarehouseFormModel): WarehouseFormModel {
      const source = input.skus.length ? input.skus : [emptyWarehouseSku()];
      const pricedSkus = source.map((sku) =>
        this.pricedSku({ ...sku }, input.pricingType),
      );
      const skus = this.withSuggestedSkuCodes({
        ...input,
        skus: pricedSkus,
      }).skus;
      return {
        ...input,
        skus,
      };
    },
    skuCodeCheckRows(input: WarehouseFormModel): SkuCodeCheckRow[] {
      const autoReady = Boolean(
        (input.name || input.categoryId) &&
        (input.materialId ||
          /(?:^|[^A-Z0-9])(?:XV|XK)(?=[^A-Z0-9]|N\d+|$)/i.test(input.name)) &&
        (!this.isWeighted || input.skus.some((sku) => sku.weight > 0)),
      );
      return input.skus.flatMap((sku, index) => {
        const code = normalizeSkuCode(sku.code);
        const persistedCode = normalizeSkuCode(sku.codeSource);
        if (
          !code ||
          (Boolean(sku.id) && code === persistedCode) ||
          (sku.codeMode === "auto" &&
            (!autoReady || (this.isWeighted && sku.weight <= 0)))
        ) {
          return [];
        }
        return [{ index, clientId: sku.clientId, code }];
      });
    },
    skuCodeCheckKey(input: WarehouseFormModel): string {
      return this.skuCodeCheckRows(input)
        .map((row) => `${row.clientId}:${row.code}`)
        .join("|");
    },
    invalidateSkuCodeCheck(input: WarehouseFormModel): void {
      if (this.skuCodeCheckKey(this.draft) === this.skuCodeCheckKey(input)) {
        return;
      }
      this.skuCodeCheckController?.abort();
      this.skuCodeCheckController = null;
      this.skuCodeCheckSequence += 1;
    },
    async checkSkuCodesNow(): Promise<boolean> {
      const rows = this.skuCodeCheckRows(this.draft);
      if (!rows.length) return true;

      const requestKey = this.skuCodeCheckKey(this.draft);
      this.skuCodeCheckController?.abort();
      const controller = new AbortController();
      const sequence = ++this.skuCodeCheckSequence;
      this.skuCodeCheckController = controller;

      try {
        const response = await warehouseService.checkSkuCodes(
          rows.map(({ code }) => ({ code })),
          controller.signal,
        );
        if (
          sequence !== this.skuCodeCheckSequence ||
          requestKey !== this.skuCodeCheckKey(this.draft)
        ) {
          return false;
        }
        if (response.items.length !== rows.length) {
          throw new Error("Kết quả kiểm tra mã SKU không đầy đủ");
        }

        const next = copyForm(this.draft);
        const allocatedCodes = response.items.map((item) =>
          normalizeSkuCode(item.code),
        );
        if (
          allocatedCodes.some((code) => !code || code.length > 100) ||
          new Set(allocatedCodes).size !== allocatedCodes.length
        ) {
          throw new Error("Kết quả kiểm tra mã SKU không hợp lệ");
        }
        rows.forEach((row, resultIndex) => {
          next.skus[row.index] = {
            ...next.skus[row.index],
            code: allocatedCodes[resultIndex],
          };
        });

        this.commit(this.withCalculatedPrices(next), {
          preserveSkuCodeCheck: true,
        });
        return true;
      } catch {
        return false;
      } finally {
        if (this.skuCodeCheckController === controller) {
          this.skuCodeCheckController = null;
        }
      }
    },
    commit(
      input: WarehouseFormModel,
      options: { preserveSkuCodeCheck?: boolean } = {},
    ): void {
      if (!options.preserveSkuCodeCheck) this.invalidateSkuCodeCheck(input);
      this.draft = copyForm(input);
      this.$emit("update:modelValue", copyForm(input));
    },
    updateSelectValue(key: ProductTextKey, val: string): void {
      this.clearFieldError(key);
      if (key === "categoryId" && val) {
        void this.fetchCategoryGroups(val);
      }
      this.commit(
        this.withCalculatedPrices({
          ...copyForm(this.draft),
          [key]: val,
        }),
      );
    },
    setPricingType(val: string): void {
      this.clearFieldError("pricingType");
      const pricingType = val as InventoryCreatePricingType | "";
      const next = copyForm(this.draft);
      next.pricingType = pricingType;
      next.skus = next.skus.map((sku) => {
        if (pricingType === "Đồ cân") return { ...sku, importPrice: null };
        return sku;
      });
      this.commit(this.withCalculatedPrices(next));
    },
    handleNameClickOutside(event: MouseEvent): void {
      const target = event.target as Node;
      const refEl = this.$refs.nameFieldRef as HTMLElement | undefined;
      if (refEl && !refEl.contains(target)) {
        this.nameSuggestionsOpen = false;
      }
    },
    onNameInput(event: Event): void {
      this.updateText("name", event);
      const val = this.eventValue(event).trim();
      if (!val) {
        this.nameSuggestionsOpen = false;
        this.nameSuggestions = [];
        return;
      }
      if (this.nameDebounceTimer) clearTimeout(this.nameDebounceTimer);
      this.nameDebounceTimer = setTimeout(() => {
        void this.fetchNameSuggestions(val);
      }, 250);
    },
    onNameFocus(): void {
      if (this.draft.name.trim() && this.nameSuggestions.length > 0) {
        this.nameSuggestionsOpen = true;
      }
    },
    async fetchNameSuggestions(query: string): Promise<void> {
      this.nameAbortController?.abort();
      this.nameAbortController = new AbortController();
      this.nameSuggestionsLoading = true;
      this.nameSuggestionsOpen = true;
      try {
        const results = await fetchWarehouseSuggestions(
          query,
          this.nameAbortController.signal,
          5,
        );
        this.nameSuggestions = results;
      } catch {
        this.nameSuggestions = [];
      } finally {
        this.nameSuggestionsLoading = false;
      }
    },
    selectNameSuggestion(item: SearchSuggestionItem): void {
      this.nameSuggestionsOpen = false;
      const next = copyForm(this.draft);
      next.name = item.title;
      if (item.category && !next.categoryId) {
        const cat = this.options.categories.find((c) => c.name === item.category);
        if (cat) next.categoryId = cat.id;
      }
      if (item.material && !next.materialId) {
        const mat = this.options.materials.find((m) => m.name === item.material);
        if (mat) next.materialId = mat.id;
      }
      if (item.pattern && !next.patternId) {
        const pat = this.options.patterns.find((p) => p.name === item.pattern);
        if (pat) next.patternId = pat.id;
      }
      if (
        (item.pricingType === "Đồ cân" || item.pricingType === "Đồ món") &&
        !next.pricingType
      ) {
        next.pricingType = item.pricingType;
      }
      this.commit(this.withCalculatedPrices(next));
      if (next.categoryId) {
        void this.fetchCategoryGroups(next.categoryId);
      }
    },
    updateText(key: ProductTextKey, event: Event): void {
      this.clearFieldError(key);
      const val = this.eventValue(event);
      if (key === "categoryId" && val) {
        void this.fetchCategoryGroups(val);
      }
      this.commit(
        this.withCalculatedPrices({
          ...copyForm(this.draft),
          [key]: val,
        }),
      );
    },
    updateSkuText(index: number, key: "size", event: Event): void {
      this.clearFieldError(`skus.${index}.${key}`);
      const next = copyForm(this.draft);
      next.skus[index] = { ...next.skus[index], [key]: this.eventValue(event) };
      this.commit(this.withCalculatedPrices(next));
    },
    updateSkuCode(index: number, event: Event): void {
      this.clearFieldError(`skus.${index}.code`);
      const next = copyForm(this.draft);
      next.skus[index] = {
        ...next.skus[index],
        code: this.eventValue(event),
        codeMode: "manual",
        codeSource: "",
      };
      this.commit(this.withCalculatedPrices(next));
    },
    async handleSkuCodeBlur(index: number): Promise<void> {
      const next = copyForm(this.draft);
      next.skus[index] = {
        ...next.skus[index],
        code: normalizeSkuCode(next.skus[index].code),
      };
      this.commit(this.withCalculatedPrices(next));
      await this.checkSkuCodesNow();
    },
    async checkSkuCodesOnBlur(): Promise<void> {
      await this.checkSkuCodesNow();
    },
    async toggleSkuCodeMode(index: number): Promise<void> {
      const current = this.draft.skus[index];
      if (!current) return;
      if (current.codeMode === "auto") {
        this.clearFieldError(`skus.${index}.code`);
        const next = copyForm(this.draft);
        next.skus[index] = {
          ...next.skus[index],
          codeMode: "manual",
          codeSource: "",
        };
        this.commit(this.withCalculatedPrices(next));
        await this.$nextTick();
        const el = document.getElementById(this.skuFieldId(index, "code"));
        if (el instanceof HTMLInputElement) {
          el.focus();
          el.select();
        }
      } else {
        await this.regenerateSkuCode(index);
      }
    },
    async regenerateSkuCode(index: number): Promise<void> {
      this.clearFieldError(`skus.${index}.code`);
      const next = copyForm(this.draft);
      next.skus[index] = {
        ...next.skus[index],
        codeMode: "auto",
        codeSource: "",
      };
      this.commit(this.withCalculatedPrices(next));
      await this.checkSkuCodesNow();
    },
    syncInitialSkuOrder(skus: WarehouseSkuFormModel[]): void {
      const currentClientIds = new Set(skus.map((s) => s.clientId));
      const hasOverlap = this.initialSkuOrder.some((id) =>
        currentClientIds.has(id),
      );
      if (!hasOverlap) {
        this.initialSkuOrder = skus.map((s) => s.clientId);
        this.skuSortOption = "";
        return;
      }
      const existingSet = new Set(this.initialSkuOrder);
      for (const sku of skus) {
        if (sku.clientId && !existingSet.has(sku.clientId)) {
          this.initialSkuOrder.push(sku.clientId);
          existingSet.add(sku.clientId);
        }
      }
    },
    async handleSkuSortChange(): Promise<void> {
      if (!this.skuSortOption || this.draft.skus.length <= 1) return;
      this.clearLocalValidation();
      const next = copyForm(this.draft);
      const initialMap = new Map(
        this.initialSkuOrder.map((id, index) => [id, index]),
      );

      if (this.skuSortOption === "original") {
        next.skus.sort((a, b) => {
          const idxA = initialMap.get(a.clientId) ?? 9999;
          const idxB = initialMap.get(b.clientId) ?? 9999;
          return idxA - idxB;
        });
      } else {
        const [key, dir] = this.skuSortOption.split("-") as [
          "weight" | "stock" | "laborCost" | "platingCost",
          "asc" | "desc",
        ];
        next.skus.sort((a, b) => {
          const valA = Number(a[key]) || 0;
          const valB = Number(b[key]) || 0;
          if (valA !== valB) {
            return dir === "asc" ? valA - valB : valB - valA;
          }
          const idxA = initialMap.get(a.clientId) ?? 9999;
          const idxB = initialMap.get(b.clientId) ?? 9999;
          return idxA - idxB;
        });
      }

      this.commit(this.withCalculatedPrices(next));
      await this.checkSkuCodesNow();
    },
    updateSkuNumber(
      index: number,
      key: "weight" | "stock",
      event: Event,
    ): void {
      this.skuSortOption = "";
      this.clearFieldError(`skus.${index}.${key}`);
      const raw = this.eventValue(event);
      const next = copyForm(this.draft);
      next.skus[index] = {
        ...next.skus[index],
        [key]: raw === "" ? 0 : Number(raw),
      };
      this.commit(this.withCalculatedPrices(next));
    },
    updateSkuMoney(
      index: number,
      key: SkuMoneyKey,
      value: number | null,
    ): void {
      this.skuSortOption = "";
      this.clearFieldError(`skus.${index}.${key}`);
      const next = copyForm(this.draft);
      if (this.isPiece && key === "importPrice") {
        this.clearFieldError(`skus.${index}.price`);
        const importPrice = value;
        next.skus[index] = {
          ...next.skus[index],
          importPrice,
          price: calculatePiecePrice(
            Number(importPrice) || 0,
            Number(next.skus[index].platingCost) || 0,
            Number(next.skus[index].laborCost) || 0,
          ).price,
        };
        this.commit(this.withCalculatedPrices(next));
        return;
      }
      if (this.isPiece && key === "laborCost") {
        const laborCost = value ?? 0;
        next.skus[index] = {
          ...next.skus[index],
          laborCost,
        };
        if (next.skus[index].importPrice) {
          next.skus[index].price = calculatePiecePrice(
            Number(next.skus[index].importPrice) || 0,
            Number(next.skus[index].platingCost) || 0,
            laborCost,
          ).price;
        }
        this.commit(this.withCalculatedPrices(next));
        return;
      }
      if (this.isPiece && key === "platingCost") {
        const platingCost = value ?? 0;
        next.skus[index] = {
          ...next.skus[index],
          platingCost,
        };
        if (next.skus[index].importPrice) {
          next.skus[index].price = calculatePiecePrice(
            Number(next.skus[index].importPrice) || 0,
            platingCost,
            Number(next.skus[index].laborCost) || 0,
          ).price;
        }
        this.commit(this.withCalculatedPrices(next));
        return;
      }
      if (this.isPiece && key === "price") {
        this.clearFieldError(`skus.${index}.importPrice`);
        const price = value ?? 0;
        if (!(price > 0)) {
          next.skus[index] = { ...next.skus[index], price: 0 };
          this.commit(next);
          return;
        }
        const estimate = estimatePieceImportPrice(
          price,
          Number(next.skus[index].importPrice) || 0,
          Number(next.skus[index].platingCost) || 0,
          Number(next.skus[index].laborCost) || 0,
        );
        next.skus[index] = {
          ...next.skus[index],
          price,
          importPrice: estimate?.importPrice ?? null,
        };
        this.commit(this.withCalculatedPrices(next));
        return;
      }
      next.skus[index] = {
        ...next.skus[index],
        [key]: key === "importPrice" ? value : value ?? 0,
      };
      this.commit(this.withCalculatedPrices(next));
    },
    updatePricingType(event: Event): void {
      this.clearFieldError("pricingType");
      const pricingType = this.eventValue(event) as
        InventoryCreatePricingType | "";
      const next = copyForm(this.draft);
      next.pricingType = pricingType;
      next.skus = next.skus.map((sku) => {
        if (pricingType === "Đồ cân") return { ...sku, importPrice: null };
        return sku;
      });
      this.commit(this.withCalculatedPrices(next));
    },
    addSku(): void {
      this.skuSortOption = "";
      const next = copyForm(this.draft);
      const newSku = emptyWarehouseSku();
      this.initialSkuOrder.push(newSku.clientId);
      next.skus.push(newSku);
      this.commit(this.withCalculatedPrices(next));
    },
    removeSku(index: number): void {
      if (this.draft.skus.length <= 1) return;
      this.skuSortOption = "";
      const next = copyForm(this.draft);
      next.skus.splice(index, 1);
      this.commit(this.withCalculatedPrices(next));
    },
    selectThumbnail(file: File): void {
      this.clearFieldError("thumbnail");
      this.commit({ ...copyForm(this.draft), thumbnail: file });
    },
    preparedSubmission(
      options: { allowDuplicateCodes?: boolean } = {},
    ): WarehouseFormModel | null {
      const required: Array<[boolean, string, string]> = [
        [Boolean(this.draft.name.trim()), "name", "Vui lòng nhập tên sản phẩm"],
        [
          Boolean(this.draft.categoryId),
          "categoryId",
          "Vui lòng chọn danh mục",
        ],
        [
          Boolean(this.draft.materialId),
          "materialId",
          "Vui lòng chọn chất liệu",
        ],
        [Boolean(this.draft.patternId), "patternId", "Vui lòng chọn mẫu"],
        [
          Boolean(this.draft.pricingType),
          "pricingType",
          "Vui lòng chọn loại sản phẩm",
        ],
        [this.draft.skus.length > 0, "", "Cần ít nhất 1 SKU"],
        [
          !this.isWeighted || this.hasSilverPrice,
          "",
          "Chưa cấu hình giá bạc hiện tại",
        ],
      ];
      const invalid = required.find(([valid]) => !valid);
      if (invalid) {
        this.setLocalFieldError(invalid[1], invalid[2]);
        return null;
      }

      const prepared = copyForm(this.draft);
      const seenCodes = new Set<string>();
      for (const [index, sku] of prepared.skus.entries()) {
        sku.code = normalizeSkuCode(sku.code);
        if (!sku.code) {
          this.setLocalFieldError(
            `skus.${index}.code`,
            `SKU ${index + 1}: Mã SKU là bắt buộc`,
          );
          return null;
        }
        if (sku.code.length > 100) {
          this.setLocalFieldError(
            `skus.${index}.code`,
            `SKU ${index + 1}: Mã SKU không được vượt quá 100 ký tự`,
          );
          return null;
        }
        if (!options.allowDuplicateCodes && seenCodes.has(sku.code)) {
          this.setLocalFieldError(
            `skus.${index}.code`,
            `SKU ${index + 1}: Mã SKU "${sku.code}" bị trùng`,
          );
          return null;
        }
        seenCodes.add(sku.code);
        if (this.isWeighted) {
          if (!(sku.weight > 0)) {
            this.setLocalFieldError(
              `skus.${index}.weight`,
              `SKU ${index + 1}: Trọng lượng chỉ phải lớn hơn 0`,
            );
            return null;
          }
        } else if (sku.weight < 0) {
          this.setLocalFieldError(
            `skus.${index}.weight`,
            `SKU ${index + 1}: Trọng lượng chỉ không được âm`,
          );
          return null;
        }
        if (!Number.isInteger(sku.stock)) {
          this.setLocalFieldError(
            `skus.${index}.stock`,
            `SKU ${index + 1}: Tồn kho phải là số nguyên`,
          );
          return null;
        }
        if (this.isPiece) {
          if (!(Number(sku.importPrice) > 0)) {
            this.setLocalFieldError(
              `skus.${index}.importPrice`,
              `SKU ${index + 1}: Giá nhập phải lớn hơn 0`,
            );
            return null;
          }
          if (!(Number(sku.price) > 0)) {
            this.setLocalFieldError(
              `skus.${index}.price`,
              `SKU ${index + 1}: Giá bán phải lớn hơn 0`,
            );
            return null;
          }
        }
      }
      return prepared;
    },
    async submit(): Promise<void> {
      this.clearLocalValidation();
      const normalized = copyForm(this.draft);
      normalized.skus = normalized.skus.map((sku) => ({
        ...sku,
        code: normalizeSkuCode(sku.code),
      }));
      this.commit(normalized);
      if (!this.preparedSubmission({ allowDuplicateCodes: true })) return;

      const allocated = await this.checkSkuCodesNow();
      if (!allocated) {
        this.setLocalFieldError(
          "",
          "Không thể tạo mã SKU khả dụng. Vui lòng kiểm tra kết nối và thử lại.",
        );
        return;
      }

      const prepared = this.preparedSubmission();
      if (!prepared) return;
      this.$emit("submit", prepared);
    },
  },
});
</script>

<style scoped>
.letter-spacing {
  letter-spacing: 0.08em;
}

.warehouse-create-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(20rem, 1fr);
  grid-template-areas:
    "name organize"
    "images organize"
    "skus organize";
  gap: 3rem;
  align-items: start;
}

.warehouse-name-field {
  grid-area: name;
}

.warehouse-image-section {
  grid-area: images;
}

.sku-section {
  grid-area: skus;
}

.warehouse-organize {
  grid-area: organize;
}

.sku-section {
  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(240, 171, 0, 0.13),
      transparent 28%
    ),
    var(--phoenix-body-bg);
  box-shadow:
    inset 0 0 0 1px var(--phoenix-border-color-translucent),
    0 18px 45px rgba(36, 48, 74, 0.06);
}

.sku-list {
  display: grid;
  gap: 1.25rem;
}

.sku-item {
  overflow: hidden;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 1rem;
  background: var(--phoenix-body-bg);
  box-shadow: 0 10px 24px rgba(36, 48, 74, 0.05);
}

.sku-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid var(--phoenix-border-color-translucent);
  background: linear-gradient(90deg, rgba(240, 171, 0, 0.1), transparent 58%);
}

.sku-number {
  display: inline-grid;
  width: 2.4rem;
  height: 2.4rem;
  place-items: center;
  border-radius: 0.75rem;
  color: #fff;
  background: linear-gradient(135deg, #8a5a00, #c17b00);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.pricing-formula {
  padding: 1.25rem;
  border: 1px solid rgba(240, 171, 0, 0.28);
  border-radius: 0.9rem;
  background: linear-gradient(
    145deg,
    rgba(255, 193, 7, 0.11),
    var(--phoenix-body-bg)
  );
}

.formula-icon {
  display: inline-grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 0.75rem;
  color: #8a5a00;
  background: rgba(240, 171, 0, 0.2);
}

.formula-empty {
  padding: 1rem;
  border: 1px dashed var(--phoenix-border-color);
  border-radius: 0.75rem;
  color: var(--phoenix-tertiary-color);
  font-size: 0.8rem;
  line-height: 1.55;
}

.formula-list > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.45rem 0;
  font-size: 0.78rem;
  border-bottom: 1px dashed rgba(82, 91, 117, 0.18);
}

.formula-list dt {
  color: var(--phoenix-tertiary-color);
  font-weight: 600;
}

.formula-list dd {
  margin: 0;
  color: var(--phoenix-emphasis-color);
  font-weight: 700;
  text-align: right;
}

.formula-list .formula-subtotal {
  padding-top: 0.7rem;
  border-bottom: 0;
}

.formula-total {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  color: #fff;
  background: linear-gradient(135deg, #8a5a00, #c17b00);
}

.formula-total span {
  font-size: 0.7rem;
  opacity: 0.78;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.formula-total strong {
  font-size: 1.2rem;
}

.selling-price-input .form-control {
  color: var(--phoenix-warning-text-emphasis);
  background: var(--phoenix-emphasis-bg);
}

.sku-code-field .input-group .form-control {
  min-width: 0;
  letter-spacing: 0.035em;
}

.pricing-sku-code {
  display: inline-block;
  max-width: 100%;
  margin-top: 0.3rem;
  padding: 0.2rem 0.45rem;
  overflow-wrap: anywhere;
  border: 1px solid rgba(240, 171, 0, 0.28);
  border-radius: 0.4rem;
  color: var(--phoenix-warning-text-emphasis);
  background: rgba(240, 171, 0, 0.1);
  font-size: 0.72rem;
  font-weight: 800;
}

.add-sku-footer {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding: 0.85rem;
  border: 1px dashed rgba(240, 171, 0, 0.55);
  border-radius: 0.85rem;
  color: var(--phoenix-warning-text-emphasis);
  background: rgba(240, 171, 0, 0.06);
  font-weight: 700;
}

.add-sku-footer:hover:not(:disabled) {
  border-style: solid;
  background: rgba(240, 171, 0, 0.12);
}

.add-sku-footer:disabled {
  opacity: 0.55;
}

.organize-card {
  top: 5.5rem;
}

@media (max-width: 1199.98px) {
  .warehouse-create-layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "name"
      "images"
      "organize"
      "skus";
    gap: 2rem;
  }

  .organize-card {
    position: static !important;
  }
}

@media (max-width: 575.98px) {
  .sku-section .card-body {
    padding: 1.25rem !important;
  }

  .sku-item-header {
    padding: 0.75rem;
  }

  .pricing-formula {
    padding: 1rem;
  }

  .sku-code-field .input-group {
    flex-direction: column;
  }

  .sku-code-field .input-group > .form-control,
  .sku-code-field .input-group > .btn {
    width: 100%;
    border-radius: var(--phoenix-border-radius) !important;
  }

  .sku-code-field .input-group > .btn {
    margin-top: 0.5rem;
  }

  .sku-sort-select {
    width: 100%;
  }
}

.sku-sort-select {
  min-width: 12.5rem;
  width: auto;
}
</style>
