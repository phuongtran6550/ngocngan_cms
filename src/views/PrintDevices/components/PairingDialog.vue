<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pairing-dialog-title"
      data-testid="pairing-dialog"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h2 id="pairing-dialog-title" class="modal-title fs-7">
                Kết nối máy in
              </h2>
              <p class="mb-0 mt-1 text-body-tertiary fs-10">
                Làm lần lượt ba bước dưới đây.
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
            <ol class="pairing-steps ps-0 mb-4">
              <li data-testid="pairing-step">
                <span>1</span>
                <p>Mở <strong>Ứng dụng in Ngọc Châu</strong> trên máy tính.</p>
              </li>
              <li data-testid="pairing-step">
                <span>2</span>
                <p>Chọn GoDEX G500 đang kết nối với máy tính.</p>
              </li>
              <li data-testid="pairing-step">
                <span>3</span>
                <p>Nhập mã kết nối dưới đây rồi bấm <strong>Kết nối</strong>.</p>
              </li>
            </ol>

            <div class="pairing-code-box text-center">
              <div class="text-body-tertiary fs-10 mb-1">Mã kết nối</div>
              <div
                ref="codeElement"
                class="pairing-code"
                data-testid="pairing-code"
                tabindex="-1"
                aria-live="polite"
              >
                {{ code }}
              </div>
              <div class="text-body-tertiary fs-10 mt-2">
                Mã chỉ dùng một lần và sẽ tự hết hạn.
              </div>
            </div>
          </div>

          <div class="modal-footer justify-content-between">
            <button
              type="button"
              class="btn btn-phoenix-secondary"
              :disabled="busy"
              @click="copyCode"
            >
              <AppIcon name="copy" class="me-1" />
              Sao chép mã
            </button>
            <div class="d-flex gap-2">
              <button
                type="button"
                class="btn btn-phoenix-secondary"
                :disabled="busy"
                @click="requestClose"
              >
                Đóng
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="busy"
                @click="$emit('check')"
              >
                <span
                  v-if="busy"
                  class="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                />
                Kiểm tra kết nối
              </button>
            </div>
          </div>
        </div>
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
import { defineComponent } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { createOverlayBehavior } from "@/components/overlay/behavior";

export default defineComponent({
  name: "PairingDialog",
  components: { AppIcon },
  props: {
    open: Boolean,
    code: { type: String, default: "" },
    busy: Boolean,
  },
  emits: ["close", "check"],
  data() {
    return {
      overlay: createOverlayBehavior(() => this.requestClose()),
    };
  },
  watch: {
    open: {
      immediate: true,
      handler(open: boolean) {
        this.overlay.sync(open);
        if (open) void this.focusCode();
      },
    },
  },
  beforeUnmount() {
    this.overlay.dispose();
  },
  methods: {
    async focusCode(): Promise<void> {
      await this.$nextTick();
      (this.$refs.codeElement as HTMLElement | undefined)?.focus();
    },
    requestClose(): void {
      if (!this.busy) this.$emit("close");
    },
    async copyCode(): Promise<void> {
      if (!this.code) return;
      try {
        await navigator.clipboard?.writeText(this.code);
      } catch {
        // The code remains visible and selectable when clipboard access is unavailable.
      }
    },
  },
});
</script>

<style scoped>
.pairing-steps {
  display: grid;
  gap: 0.875rem;
  list-style: none;
}

.pairing-steps li {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: start;
}

.pairing-steps li > span {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 50%;
  color: var(--phoenix-primary);
  background: var(--phoenix-primary-bg-subtle);
  font-weight: 700;
}

.pairing-steps p {
  margin: 0.3rem 0 0;
}

.pairing-code-box {
  padding: 1rem;
  border: 1px dashed var(--phoenix-border-color);
  border-radius: 0.75rem;
  background: var(--phoenix-emphasis-bg);
}

.pairing-code {
  color: var(--phoenix-primary);
  font-size: clamp(1.75rem, 8vw, 2.5rem);
  font-weight: 800;
  letter-spacing: 0.3em;
  line-height: 1.1;
  outline: none;
}

@media (max-width: 575.98px) {
  .modal-footer,
  .modal-footer > div {
    width: 100%;
  }

  .modal-footer > button,
  .modal-footer > div > button {
    flex: 1;
  }
}
</style>
