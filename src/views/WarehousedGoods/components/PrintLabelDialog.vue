<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-label-dialog-title"
      data-testid="print-label-dialog"
    >
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <form class="modal-content" @submit.prevent="$emit('confirm')">
          <div class="modal-header">
            <div>
              <h2 id="print-label-dialog-title" class="modal-title fs-7">
                In tem SKU
              </h2>
              <p class="mb-0 mt-1 text-body-tertiary fs-10 text-break">
                {{ skuCode || "SKU chưa xác định" }}
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              :disabled="busy"
              @click="requestClose"
            />
          </div>

          <div class="modal-body">
            <label class="form-label fw-semibold" for="print-label-quantity">
              Số lượng tem
            </label>
            <input
              id="print-label-quantity"
              ref="quantityInput"
              name="printQuantity"
              type="number"
              class="form-control"
              :class="{ 'is-invalid': error }"
              :value="modelValue"
              min="1"
              max="100"
              step="1"
              inputmode="numeric"
              autocomplete="off"
              :disabled="busy"
              :aria-invalid="error ? 'true' : undefined"
              aria-describedby="print-label-quantity-help print-label-quantity-error"
              @input="updateQuantity"
            />
            <div
              v-if="error"
              id="print-label-quantity-error"
              class="invalid-feedback d-block"
              role="alert"
            >
              {{ error }}
            </div>
            <div
              id="print-label-quantity-help"
              class="form-text mt-2"
            >
              Nhập từ 1 đến 100 tem. Máy in sẽ xử lý trong một lệnh in duy
              nhất.
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-phoenix-secondary"
              :disabled="busy"
              @click="requestClose"
            >
              Hủy
            </button>
            <button type="submit" class="btn btn-primary" :disabled="busy">
              <span
                v-if="busy"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              />
              {{ busy ? "Đang gửi..." : confirmLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <button
      v-if="open"
      type="button"
      class="modal-backdrop fade show border-0 p-0"
      aria-label="Đóng"
      :disabled="busy"
      @click="requestClose"
    />
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { createOverlayBehavior } from "@/components/overlay/behavior";

export default defineComponent({
  name: "PrintLabelDialog",
  props: {
    open: Boolean,
    skuCode: { type: String, default: "" },
    modelValue: {
      type: [String, Number] as PropType<string | number>,
      default: "1",
    },
    busy: Boolean,
    error: { type: String, default: "" },
  },
  emits: ["cancel", "confirm", "update:modelValue"],
  data() {
    return {
      overlay: createOverlayBehavior(() => this.requestClose()),
    };
  },
  computed: {
    confirmLabel(): string {
      const quantity = Number(this.modelValue);
      return Number.isInteger(quantity) && quantity > 0
        ? `In ${quantity} tem`
        : "In tem";
    },
  },
  watch: {
    open: {
      immediate: true,
      handler(open: boolean) {
        this.overlay.sync(open);
        if (open) void this.focusQuantity();
      },
    },
    error(error: string) {
      if (error) void this.focusQuantity();
    },
  },
  beforeUnmount() {
    this.overlay.dispose();
  },
  methods: {
    async focusQuantity(): Promise<void> {
      await this.$nextTick();
      const input = this.$refs.quantityInput as HTMLInputElement | undefined;
      input?.focus();
      input?.select();
    },
    requestClose(): void {
      if (!this.busy) this.$emit("cancel");
    },
    updateQuantity(event: Event): void {
      this.$emit("update:modelValue", (event.target as HTMLInputElement).value);
    },
  },
});
</script>
