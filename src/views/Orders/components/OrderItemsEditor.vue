<template>
  <div>
    <div class="d-flex align-items-center justify-content-between gap-3 mb-3">
      <div>
        <h3 class="fs-8 mb-1">Sản phẩm trong đơn</h3>
        <p class="text-body-tertiary fs-10 mb-0">Danh mục được tải trực tiếp từ API, không hardcode trong giao diện.</p>
      </div>
      <button type="button" class="btn btn-sm btn-phoenix-primary" aria-label="Thêm sản phẩm" :disabled="disabled" @click="addItem">Thêm sản phẩm</button>
    </div>

    <div v-if="!draftItems.length" class="border border-translucent rounded-3 px-3 py-4 text-center text-body-tertiary fs-9">
      Chưa có sản phẩm chi tiết.
    </div>
    <div v-for="(item, index) in draftItems" :key="item.id || index" class="row g-3 align-items-end border-bottom border-translucent py-3">
      <div class="col-12 col-sm-7">
        <label class="form-label" :for="`order-item-category-${index}`">Danh mục</label>
        <select
          :id="`order-item-category-${index}`"
          class="form-select"
          :value="item.categoryId || ''"
          :disabled="disabled"
          @change="updateCategory(index, value($event))"
        >
          <option value="">Chọn danh mục</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
      </div>
      <div class="col-9 col-sm-4">
        <label class="form-label" :for="`order-item-price-${index}`">Giá sản phẩm</label>
        <input
          :id="`order-item-price-${index}`"
          class="form-control"
          type="number"
          min="0"
          step="1000"
          :value="item.price"
          :disabled="disabled"
          @input="updatePrice(index, $event)"
        />
      </div>
      <div class="col-3 col-sm-1 d-grid">
        <button type="button" class="btn btn-phoenix-danger" :aria-label="`Xóa ${item.category || `sản phẩm ${index + 1}`}`" :disabled="disabled" @click="removeItem(index)">×</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { OrderCategoryOption, OrderFormItem } from "@/views/Orders/types";

function cloneItems(items: OrderFormItem[]): OrderFormItem[] {
  return items.map((item) => ({ ...item }));
}

export default defineComponent({
  name: "OrderItemsEditor",
  props: {
    modelValue: { type: Array as PropType<OrderFormItem[]>, default: () => [] },
    categories: { type: Array as PropType<OrderCategoryOption[]>, default: () => [] },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  data() { return { draftItems: cloneItems(this.modelValue) }; },
  watch: {
    modelValue: { deep: true, handler(value: OrderFormItem[]) { this.draftItems = cloneItems(value); } },
  },
  methods: {
    value(event: Event): string { return (event.target as HTMLInputElement | HTMLSelectElement).value; },
    emitItems(): void { this.$emit("update:modelValue", cloneItems(this.draftItems)); },
    addItem(): void {
      this.draftItems.push({ categoryId: null, category: "", price: 0 });
      this.emitItems();
    },
    removeItem(index: number): void {
      this.draftItems.splice(index, 1);
      this.emitItems();
    },
    updateCategory(index: number, categoryId: string): void {
      const category = this.categories.find((item) => item.id === categoryId);
      this.draftItems[index] = {
        ...this.draftItems[index],
        categoryId: category?.id || null,
        category: category?.name || "",
      };
      this.emitItems();
    },
    updatePrice(index: number, event: Event): void {
      this.draftItems[index] = { ...this.draftItems[index], price: Number(this.value(event)) || 0 };
      this.emitItems();
    },
  },
});
</script>
