<template>
  <div>
    <PageHeader
      title="Thêm hàng nhập kho"
      description="Khai báo sản phẩm, quy cách SKU và để hệ thống tự động tính giá bán."
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
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
      </template>
    </PageHeader>
    <WarehouseCreateForm
      :model-value="form"
      :options="store.options"
      :submitting="submitting"
      :error="error || store.error"
      :field-errors="fieldErrors"
      @update:model-value="form = $event"
      @clear-field-error="clearFieldError"
      @submit="save"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { apiError } from "@/request";
import WarehouseCreateForm from "@/views/WarehousedGoods/components/WarehouseCreateForm.vue";
import { warehouseService } from "@/views/WarehousedGoods/service";
import { useWarehouseStore } from "@/views/WarehousedGoods/store";
import {
  emptyWarehouseForm,
  type WarehouseFormModel,
} from "@/views/WarehousedGoods/types";
import { warehouseValidationErrors } from "@/views/WarehousedGoods/validation-errors";

export default defineComponent({
  name: "WarehouseCreatePage",
  components: { AppIcon, PageHeader, WarehouseCreateForm },
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
    };
  },
  computed: {
    store() {
      return useWarehouseStore();
    },
  },
  mounted() {
    void this.store.loadOptions();
  },
  methods: {
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
      try {
        const item = await warehouseService.create(value);
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
