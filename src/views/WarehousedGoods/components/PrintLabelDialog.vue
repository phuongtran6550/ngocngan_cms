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
      <div class="modal-dialog modal-dialog-centered print-label-dialog">
        <form
          class="modal-content print-label-content"
          @submit.prevent="requestConfirm"
        >
          <div class="modal-header print-label-header">
            <div class="d-flex align-items-center gap-2 min-w-0">
              <span class="print-label-icon" aria-hidden="true">
                <AppIcon name="tag" />
              </span>
              <div class="min-w-0">
                <h2 id="print-label-dialog-title" class="modal-title">
                  In tem SKU
                </h2>
                <span class="sku-chip text-truncate">
                  {{ skuCode || "SKU chưa xác định" }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="btn-close print-label-close"
              aria-label="Đóng"
              :disabled="busy"
              @click="requestClose"
            />
          </div>

          <div class="modal-body print-label-body">
            <div
              v-if="statusBusy"
              class="printer-status printer-status-secondary"
              role="status"
              aria-live="polite"
              data-testid="print-status-loading"
            >
              <span
                class="spinner-border spinner-border-sm"
                aria-hidden="true"
              />
              <div class="status-copy">
                <strong>Đang kiểm tra GoDEX G500…</strong>
                <p>Vui lòng chờ trong giây lát.</p>
              </div>
            </div>
            <div
              v-else
              class="printer-status"
              :class="`printer-status-${statusView.tone}`"
              :role="statusView.ready ? 'status' : 'alert'"
              aria-live="polite"
              data-testid="print-device-status"
            >
              <span class="printer-status-mark" aria-hidden="true">
                {{ statusView.ready ? "✓" : "!" }}
              </span>
              <div class="status-copy min-w-0">
                <strong>{{ statusView.title }}</strong>
                <p>{{ statusView.description }}</p>
              </div>
              <div
                v-if="!statusView.ready"
                class="status-actions d-flex flex-wrap gap-2"
              >
                <RouterLink
                  to="/print-guide"
                  class="btn btn-sm btn-phoenix-secondary"
                  aria-label="Mở hướng dẫn cài đặt"
                  data-testid="open-print-guide"
                >
                  <AppIcon name="help-circle" />
                  <span class="ms-1">Hướng dẫn</span>
                </RouterLink>
                <button
                  v-if="statusView.action === 'setup' && setupAllowed"
                  type="button"
                  class="btn btn-sm btn-primary"
                  data-testid="open-print-setup"
                  @click="$emit('open-setup')"
                >
                  Thiết lập
                </button>
                <button
                  v-if="statusView.action === 'retry'"
                  type="button"
                  class="btn btn-sm btn-phoenix-secondary"
                  data-testid="retry-print-status"
                  @click="$emit('retry-status')"
                >
                  Kiểm tra
                </button>
              </div>
            </div>

            <div
              v-if="submissionError"
              class="alert alert-subtle-danger py-2 mt-3 mb-0"
              role="alert"
              data-testid="print-submission-error"
            >
              {{ submissionError }}
            </div>

            <div class="quantity-panel">
              <div class="quantity-heading">
                <label class="form-label mb-0" for="print-label-quantity">
                  Số tem cần in
                </label>
                <span class="quantity-range">Tối đa 100 tem</span>
              </div>
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
              <div id="print-label-quantity-help" class="form-text">
                Mặc định theo tồn kho hiện tại: {{ stock }} tem. Có thể điều
                chỉnh khi cần in lại.
              </div>
            </div>
          </div>

          <div class="modal-footer print-label-footer">
            <button
              type="button"
              class="btn btn-phoenix-secondary"
              :disabled="busy"
              @click="requestClose"
            >
              <AppIcon name="close" />
              Hủy
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="busy || statusBusy || !statusView.ready"
            >
              <span
                v-if="busy"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              />
              <AppIcon v-else name="tag" />
              <span class="ms-1">{{ busy ? "Đang gửi..." : confirmLabel }}</span>
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
import AppIcon from "@/components/ui/AppIcon.vue";
import { printDevicePresentation } from "@/views/PrintDevices/presentation";
import type { DefaultPrintDeviceStatus } from "@/views/PrintDevices/types";

export default defineComponent({
  name: "PrintLabelDialog",
  components: { AppIcon },
  props: {
    open: Boolean,
    skuCode: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    modelValue: {
      type: [String, Number] as PropType<string | number>,
      default: "1",
    },
    busy: Boolean,
    error: { type: String, default: "" },
    submissionError: { type: String, default: "" },
    printerStatus: {
      type: Object as PropType<DefaultPrintDeviceStatus | null>,
      default: null,
    },
    statusBusy: Boolean,
    setupAllowed: Boolean,
  },
  emits: [
    "cancel",
    "confirm",
    "retry-status",
    "open-setup",
    "update:modelValue",
  ],
  data() {
    return {
      overlay: createOverlayBehavior(() => this.requestClose()),
    };
  },
  computed: {
    statusView() {
      return printDevicePresentation(this.printerStatus);
    },
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
    requestConfirm(): void {
      if (!this.busy && !this.statusBusy && this.statusView.ready) {
        this.$emit("confirm");
      }
    },
    updateQuantity(event: Event): void {
      this.$emit("update:modelValue", (event.target as HTMLInputElement).value);
    },
  },
});
</script>

<style scoped>
.print-label-dialog {
  width: calc(100% - 2rem);
  max-width: 34rem;
}

.print-label-content {
  max-height: calc(100vh - 2rem);
  overflow: hidden;
  border: 0;
  border-radius: 1rem;
  box-shadow: 0 1.5rem 4rem rgba(18, 38, 63, 0.24);
}

.print-label-header {
  padding: 1rem 1.125rem 0.875rem;
}

.print-label-header .modal-title {
  margin-bottom: 0.25rem;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.2;
}

.print-label-icon {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 0.7rem;
  color: var(--phoenix-primary);
  background: var(--phoenix-primary-bg-subtle);
}

.sku-chip {
  display: block;
  max-width: min(21rem, 65vw);
  color: var(--phoenix-body-color);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.025em;
}

.print-label-close {
  width: 1.75rem;
  height: 1.75rem;
  flex: 0 0 auto;
  padding: 0.375rem;
  margin: 0;
}

.print-label-body {
  overflow-y: auto;
  padding: 1rem 1.125rem;
}

.printer-status {
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr) auto;
  gap: 0.625rem;
  align-items: center;
  padding: 0.75rem 0.8rem;
  border: 1px solid transparent;
  border-radius: 0.8rem;
}

.status-copy strong,
.status-copy p {
  display: block;
}

.status-copy strong {
  font-size: 0.82rem;
  line-height: 1.35;
}

.status-copy p {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  line-height: 1.4;
}

.printer-status-mark {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  font-weight: 800;
}

.status-actions {
  justify-content: flex-end;
}

.status-actions .btn {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  padding: 0.3rem 0.55rem;
  font-size: 0.7rem;
  white-space: nowrap;
}

.quantity-panel {
  margin-top: 0.875rem;
  padding: 0.875rem;
  border: 1px solid var(--phoenix-border-color);
  border-radius: 0.8rem;
  background: var(--phoenix-emphasis-bg);
}

.quantity-heading {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.quantity-heading .form-label {
  color: var(--phoenix-body-color);
  font-size: 0.8rem;
  font-weight: 800;
}

.quantity-range {
  color: var(--phoenix-tertiary-color);
  font-size: 0.68rem;
  font-weight: 600;
}

.quantity-panel .form-control {
  height: 2.75rem;
  margin-top: 0.625rem;
  font-size: 1rem;
  font-weight: 700;
}

.quantity-panel .invalid-feedback {
  margin-top: 0.35rem;
  font-size: 0.72rem;
}

.quantity-panel .form-text {
  margin-top: 0.4rem;
  font-size: 0.7rem;
  line-height: 1.35;
}

.print-label-footer {
  gap: 0.625rem;
  padding: 0.75rem 1.125rem;
  background: var(--phoenix-emphasis-bg);
}

.print-label-footer .btn {
  display: inline-flex;
  min-width: 7.5rem;
  min-height: 2.6rem;
  align-items: center;
  justify-content: center;
}

.printer-status-success {
  color: var(--phoenix-success-text-emphasis);
  border-color: var(--phoenix-success-border-subtle);
  background: var(--phoenix-success-bg-subtle);
}

.printer-status-warning,
.printer-status-secondary {
  color: var(--phoenix-warning-text-emphasis);
  border-color: var(--phoenix-warning-border-subtle);
  background: var(--phoenix-warning-bg-subtle);
}

.printer-status-danger {
  color: var(--phoenix-danger-text-emphasis);
  border-color: var(--phoenix-danger-border-subtle);
  background: var(--phoenix-danger-bg-subtle);
}

.printer-status-success .printer-status-mark {
  color: #fff;
  background: var(--phoenix-success);
}

.printer-status-warning .printer-status-mark,
.printer-status-secondary .printer-status-mark {
  color: var(--phoenix-warning-text-emphasis);
  background: var(--phoenix-warning-border-subtle);
}

.printer-status-danger .printer-status-mark {
  color: #fff;
  background: var(--phoenix-danger);
}

@media (max-width: 575.98px) {
  .print-label-dialog {
    width: calc(100% - 1.25rem);
    margin: 0.625rem auto;
  }

  .print-label-content {
    max-height: calc(100vh - 1.25rem);
  }

  .print-label-header,
  .print-label-body,
  .print-label-footer {
    padding-right: 0.875rem;
    padding-left: 0.875rem;
  }

  .printer-status {
    grid-template-columns: 1.75rem minmax(0, 1fr);
  }

  .status-actions {
    grid-column: 2;
    justify-content: flex-start;
  }

  .quantity-panel {
    padding: 0.8rem;
  }

  .print-label-footer .btn {
    min-width: 0;
    flex: 1;
  }
}

@media (max-width: 380px) {
  .status-actions {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .status-actions .btn {
    justify-content: center;
  }
}
</style>
