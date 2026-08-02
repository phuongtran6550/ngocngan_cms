<template>
  <form @submit.prevent="submit">
    <div v-if="error || localError" class="alert alert-subtle-danger" role="alert">{{ localError || error }}</div>
    <div class="row g-4">
      <div class="col-12 col-xl-4">
        <div class="card h-100">
          <div class="card-header bg-transparent border-bottom"><h3 class="fs-8 mb-0">Ảnh đơn hàng</h3></div>
          <div class="card-body">
            <ImageUploader
              :src="existingThumbnail"
              :disabled="submitting || mediaBusy"
              :busy="mediaBusy"
              :progress="mediaProgress"
              @select="$emit('thumbnail', $event)"
            />
            <p class="text-body-tertiary fs-10 mt-3 mb-0">Ảnh được tối ưu JPEG 960px ngay trên thiết bị trước khi tải lên.</p>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-8">
        <div class="card mb-4">
          <div class="card-header bg-transparent border-bottom"><h3 class="fs-8 mb-0">Thông tin khách hàng</h3></div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12 col-md-7">
                <label class="form-label" for="order-name">Tên khách hàng</label>
                <input id="order-name" class="form-control" name="name" maxlength="100" :value="draft.name" :disabled="submitting" @input="update('name', value($event))" />
              </div>
              <div class="col-12 col-md-5">
                <label class="form-label" for="order-phone">Số điện thoại</label>
                <input id="order-phone" class="form-control" name="phone" inputmode="tel" maxlength="50" :value="draft.phone" :disabled="submitting" @input="update('phone', value($event))" />
              </div>
              <div class="col-12 col-md-7">
                <label class="form-label" for="order-price">Tổng thành tiền</label>
                <input id="order-price" class="form-control" name="price" type="number" min="0" step="1000" :value="draft.price" :disabled="submitting" @input="update('price', Number(value($event)) || 0)" />
              </div>
              <div class="col-12 col-md-5 d-flex align-items-end">
                <div class="form-check form-switch pb-2">
                  <input id="order-sell" class="form-check-input" name="sell" type="checkbox" :checked="draft.sell" :disabled="submitting" @change="updateSell" />
                  <label class="form-check-label" for="order-sell">Ghi nhận là đơn bán</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header bg-transparent border-bottom"><h3 class="fs-8 mb-0">Sản phẩm đơn hàng</h3></div>
          <div class="card-body">
            <OrderItemsEditor :model-value="draft.items" :categories="options.categories" :disabled="submitting" @update:model-value="update('items', $event)" />
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex flex-wrap justify-content-end gap-2 pt-4">
      <button v-if="showCancel" type="button" class="btn btn-phoenix-secondary" :disabled="submitting" @click="$emit('cancel')">Đóng</button>
      <button v-if="allowQuickSave" type="button" class="btn btn-phoenix-secondary" aria-label="Lưu nhanh đơn nháp" :disabled="submitting || mediaBusy" @click="quickSave">Lưu nhanh</button>
      <button type="submit" class="btn btn-primary" :disabled="submitting || mediaBusy">{{ submitting ? "Đang lưu..." : submitLabel }}</button>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import ImageUploader from "@/components/media/ImageUploader.vue";
import OrderItemsEditor from "@/views/Orders/components/OrderItemsEditor.vue";
import type { OrderFormModel, OrderOptionsResponse } from "@/views/Orders/types";

function cloneForm(value: OrderFormModel): OrderFormModel {
  return { ...value, items: value.items.map((item) => ({ ...item })) };
}

export default defineComponent({
  name: "OrderForm",
  components: { ImageUploader, OrderItemsEditor },
  props: {
    modelValue: { type: Object as PropType<OrderFormModel>, required: true },
    options: { type: Object as PropType<OrderOptionsResponse>, required: true },
    existingThumbnail: { type: String, default: "" },
    draftReady: { type: Boolean, default: true },
    allowQuickSave: { type: Boolean, default: false },
    showCancel: { type: Boolean, default: false },
    submitLabel: { type: String, default: "Hoàn tất đơn hàng" },
    submitting: { type: Boolean, default: false },
    mediaBusy: { type: Boolean, default: false },
    mediaProgress: { type: Number, default: 0 },
    error: { type: String, default: "" },
  },
  emits: ["update:modelValue", "thumbnail", "submit", "quick-save", "cancel"],
  data() { return { draft: cloneForm(this.modelValue), localError: "" }; },
  watch: {
    modelValue: { deep: true, handler(value: OrderFormModel) { this.draft = cloneForm(value); } },
  },
  methods: {
    value(event: Event): string { return (event.target as HTMLInputElement | HTMLSelectElement).value; },
    updateSell(event: Event): void { this.update("sell", (event.target as HTMLInputElement).checked); },
    update(key: keyof OrderFormModel, value: unknown): void {
      this.draft = cloneForm({ ...this.draft, [key]: value });
      this.$emit("update:modelValue", cloneForm(this.draft));
    },
    validateDraft(): boolean {
      this.localError = "";
      if (!this.draftReady) {
        this.localError = "Vui lòng chụp hoặc chọn ảnh trước khi lưu đơn hàng";
        return false;
      }
      return true;
    },
    submit(): void {
      if (!this.validateDraft()) return;
      if (!this.draft.name.trim() || !this.draft.phone.trim() || this.draft.price <= 0) {
        this.localError = "Vui lòng nhập đủ tên, số điện thoại và thành tiền để hoàn tất đơn hàng";
        return;
      }
      this.$emit("submit", cloneForm(this.draft));
    },
    quickSave(): void {
      if (this.validateDraft()) this.$emit("quick-save", cloneForm(this.draft));
    },
  },
});
</script>
