<template>
  <div>
    <PageHeader
      title="Thêm hàng nhập kho"
      description="Khai báo sản phẩm, quy cách SKU và để hệ thống tự động tính giá bán."
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <span
            v-if="draftStatus === 'saving'"
            class="badge badge-phoenix badge-phoenix-secondary d-inline-flex align-items-center gap-1 py-2 px-2"
            role="status"
            aria-live="polite"
          >
            <span
              class="spinner-border spinner-border-sm text-secondary"
              style="width: 0.75rem; height: 0.75rem"
              aria-hidden="true"
            />
            <span class="fs-10">Đang lưu nháp...</span>
          </span>

          <span
            v-else-if="draftStatus === 'saved' && lastSavedTime"
            class="badge badge-phoenix badge-phoenix-success d-inline-flex align-items-center gap-1 py-2 px-2"
            :title="`Bản nháp tự động lưu lúc ${lastSavedTime}`"
            role="status"
            aria-live="polite"
          >
            <AppIcon name="check-circle" class="fs-10 text-success" />
            <span class="fs-10">Đã lưu nháp {{ lastSavedTime }}</span>
          </span>

          <button
            v-if="hasStoredDraft"
            type="button"
            class="btn btn-phoenix-danger px-3"
            :disabled="submitting"
            aria-label="Xóa bản nháp"
            title="Xóa dữ liệu nháp đang lưu và làm mới biểu mẫu"
            @click="confirmDiscardDraftOpen = true"
          >
            <AppIcon name="trash-2" class="me-sm-2" />
            <span class="d-none d-sm-inline">Xóa nháp</span>
          </button>

          <RouterLink
            class="btn btn-phoenix-secondary px-3"
            to="/warehoused-goods"
            aria-label="Hủy"
            title="Hủy"
          >
            <AppIcon name="close" class="me-sm-2" />
            <span class="d-none d-sm-inline">Hủy</span>
          </RouterLink>

          <button
            class="btn btn-primary px-3"
            type="submit"
            form="warehouse-create-form"
            :disabled="submitting"
            :aria-label="submitting ? 'Đang thêm hàng nhập kho' : 'Thêm mới'"
            :title="submitting ? 'Đang thêm hàng nhập kho' : 'Thêm mới'"
          >
            <AppIcon name="plus" class="me-sm-2" />
            <span class="d-none d-sm-inline">
              {{ submitting ? "Đang thêm..." : "Thêm mới" }}
            </span>
          </button>
        </div>
      </template>
    </PageHeader>

    <div
      v-if="restoredFromDraftNotice"
      class="alert alert-subtle-info d-flex align-items-center justify-content-between mb-3 shadow-sm"
      role="status"
    >
      <div class="d-flex align-items-center gap-2">
        <AppIcon name="check-circle" class="text-info flex-shrink-0" />
        <span>
          Đã tự động khôi phục bản nháp sản phẩm chưa lưu từ phiên làm việc trước (lưu lúc {{ restoredDraftSavedAtText }}).
        </span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-subtle-danger"
          @click="confirmDiscardDraftOpen = true"
        >
          <AppIcon name="trash-2" class="me-1" />
          Bắt đầu mới
        </button>
        <button
          type="button"
          class="btn-close"
          aria-label="Đóng thông báo"
          @click="restoredFromDraftNotice = false"
        />
      </div>
    </div>

    <WarehouseCreateForm
      :model-value="form"
      :options="store.options"
      :existing-thumbnail="restoredThumbnailUrl"
      :submitting="submitting"
      :error="error || store.error"
      :field-errors="fieldErrors"
      @update:model-value="handleFormUpdate"
      @clear-field-error="clearFieldError"
      @submit="save"
    />

    <ConfirmDialog
      :open="confirmDiscardDraftOpen"
      title="Xóa bản nháp sản phẩm"
      message="Bạn có chắc chắn muốn xóa toàn bộ thông tin bản nháp đã lưu và làm mới lại biểu mẫu từ đầu?"
      confirm-label="Xóa bản nháp"
      @cancel="confirmDiscardDraftOpen = false"
      @confirm="discardDraftAndReset"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { apiError } from "@/request";
import WarehouseCreateForm from "@/views/WarehousedGoods/components/WarehouseCreateForm.vue";
import {
  clearStoredWarehouseDraft,
  formatDraftSavedTime,
  isWarehouseDraftEmpty,
  readStoredWarehouseDraft,
  writeStoredWarehouseDraft,
} from "@/views/WarehousedGoods/draft-storage";
import { warehouseService } from "@/views/WarehousedGoods/service";
import { useWarehouseStore } from "@/views/WarehousedGoods/store";
import {
  emptyWarehouseForm,
  type WarehouseFormModel,
} from "@/views/WarehousedGoods/types";
import { warehouseValidationErrors } from "@/views/WarehousedGoods/validation-errors";

export default defineComponent({
  name: "WarehouseCreatePage",
  components: { AppIcon, ConfirmDialog, PageHeader, WarehouseCreateForm },
  data() {
    return {
      form: emptyWarehouseForm(),
      submitting: false,
      error: "",
      fieldErrors: {} as Record<string, string>,
      breadcrumbs: [
        { label: "Trang chủ", to: "/dashboard" },
        { label: "Hàng nhập kho", to: "/warehoused-goods" },
        { label: "Thêm hàng nhập kho" },
      ],
      draftStatus: "idle" as "idle" | "saving" | "saved",
      lastSavedTime: "",
      hasStoredDraft: false,
      restoredFromDraftNotice: false,
      restoredDraftSavedAtText: "",
      restoredThumbnailUrl: "",
      confirmDiscardDraftOpen: false,
      autoSaveTimer: null as ReturnType<typeof setTimeout> | null,
      isHydrating: false,
    };
  },
  computed: {
    store() {
      return useWarehouseStore();
    },
  },
  mounted() {
    this.hydrateDraft();
    void this.store.loadOptions();
  },
  beforeUnmount() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
      if (!this.submitting && !isWarehouseDraftEmpty(this.form)) {
        void writeStoredWarehouseDraft(this.form);
      }
    }
    if (this.restoredThumbnailUrl) {
      URL.revokeObjectURL(this.restoredThumbnailUrl);
      this.restoredThumbnailUrl = "";
    }
  },
  methods: {
    hydrateDraft(): void {
      const restored = readStoredWarehouseDraft();
      if (!restored) return;

      this.isHydrating = true;
      this.form = restored.form;
      if (restored.form.thumbnail instanceof File) {
        this.restoredThumbnailUrl = URL.createObjectURL(restored.form.thumbnail);
      }
      this.hasStoredDraft = true;
      this.restoredFromDraftNotice = true;
      this.restoredDraftSavedAtText = formatDraftSavedTime(restored.savedAt);
      this.lastSavedTime = this.restoredDraftSavedAtText;
      this.draftStatus = "saved";

      this.$nextTick(() => {
        this.isHydrating = false;
      });
    },
    handleFormUpdate(newVal: WarehouseFormModel): void {
      this.form = newVal;

      if (this.isHydrating || this.submitting) return;

      if (isWarehouseDraftEmpty(newVal)) {
        this.hasStoredDraft = false;
        this.draftStatus = "idle";
        clearStoredWarehouseDraft();
        return;
      }

      this.draftStatus = "saving";
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
      }

      this.autoSaveTimer = setTimeout(async () => {
        const ok = await writeStoredWarehouseDraft(this.form);
        if (ok) {
          this.draftStatus = "saved";
          this.lastSavedTime = formatDraftSavedTime(new Date());
          this.hasStoredDraft = true;
        } else {
          this.draftStatus = "idle";
        }
      }, 700);
    },
    discardDraftAndReset(): void {
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = null;
      }
      clearStoredWarehouseDraft();
      if (this.restoredThumbnailUrl) {
        URL.revokeObjectURL(this.restoredThumbnailUrl);
        this.restoredThumbnailUrl = "";
      }
      this.form = emptyWarehouseForm();
      this.hasStoredDraft = false;
      this.draftStatus = "idle";
      this.lastSavedTime = "";
      this.restoredFromDraftNotice = false;
      this.confirmDiscardDraftOpen = false;
      this.fieldErrors = {};
      this.error = "";
    },
    clearFieldError(key: string): void {
      if (!this.fieldErrors[key]) return;
      const { [key]: _removed, ...remaining } = this.fieldErrors;
      this.fieldErrors = remaining;
      if (!Object.keys(remaining).length) this.error = "";
    },
    async save(value: WarehouseFormModel): Promise<void> {
      this.submitting = true;
      this.error = "";
      this.fieldErrors = {};
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = null;
      }
      try {
        const item = await warehouseService.create(value);
        clearStoredWarehouseDraft();
        this.hasStoredDraft = false;
        if (this.restoredThumbnailUrl) {
          URL.revokeObjectURL(this.restoredThumbnailUrl);
          this.restoredThumbnailUrl = "";
        }
        await this.$router.replace({
          path: `/warehoused-goods/${item.id}`,
          query: { created: "1" },
        });
      } catch (error) {
        const normalized = apiError(error);
        this.error = normalized.message;
        this.fieldErrors = warehouseValidationErrors(normalized);
      } finally {
        this.submitting = false;
      }
    },
  },
});
</script>
