<template>
  <div>
    <LoadingSkeleton v-if="loading" />
    <div
      v-else-if="error && !item"
      class="alert alert-subtle-danger"
      role="alert"
    >
      {{ error }}
    </div>
    <template v-else-if="item">
      <PageHeader
        title="Cập nhật hàng nhập kho"
        :description="`Chỉnh sửa thông tin và quy cách SKU của ${item.name}.`"
        :breadcrumbs="breadcrumbs"
      >
        <template #actions>
          <RouterLink
            class="btn btn-phoenix-secondary px-3"
            :to="`/warehoused-goods/${item.id}`"
            aria-label="Hủy"
            title="Hủy"
          >
            <AppIcon name="close" class="me-sm-2" />
            <span class="d-none d-sm-inline">Hủy</span>
          </RouterLink>
          <button
            class="btn btn-primary px-3"
            type="submit"
            form="warehouse-edit-form"
            :disabled="submitting"
            :aria-label="
              submitting
                ? 'Đang cập nhật hàng nhập kho'
                : 'Cập nhật hàng nhập kho'
            "
            :title="
              submitting
                ? 'Đang cập nhật hàng nhập kho'
                : 'Cập nhật hàng nhập kho'
            "
          >
            <AppIcon name="edit" class="me-sm-2" />
            <span class="d-none d-sm-inline">
              {{ submitting ? "Đang cập nhật..." : "Cập nhật hàng nhập kho" }}
            </span>
          </button>
        </template>
      </PageHeader>
      <WarehouseCreateForm
        form-id="warehouse-edit-form"
        :model-value="form"
        :options="store.options"
        :existing-thumbnail="assetUrl(item.thumbnail)"
        :submitting="submitting"
        :error="error || store.error"
        :field-errors="fieldErrors"
        @update:model-value="form = $event"
        @clear-field-error="clearFieldError"
        @submit="save"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import { apiError, assetUrl } from "@/request";
import WarehouseCreateForm from "@/views/WarehousedGoods/components/WarehouseCreateForm.vue";
import { warehouseService } from "@/views/WarehousedGoods/service";
import { useWarehouseStore } from "@/views/WarehousedGoods/store";
import {
  emptyWarehouseForm,
  warehouseFormFromItem,
  type WarehouseFormModel,
  type WarehouseItem,
} from "@/views/WarehousedGoods/types";
import { warehouseValidationErrors } from "@/views/WarehousedGoods/validation-errors";

export default defineComponent({
  name: "WarehouseEditPage",
  components: { AppIcon, LoadingSkeleton, PageHeader, WarehouseCreateForm },
  data() {
    return {
      item: null as WarehouseItem | null,
      form: emptyWarehouseForm(),
      loading: true,
      submitting: false,
      error: "",
      fieldErrors: {} as Record<string, string>,
    };
  },
  computed: {
    store() {
      return useWarehouseStore();
    },
    breadcrumbs(): Array<{ label: string; to?: string }> {
      return [
        { label: "Trang chủ", to: "/dashboard" },
        { label: "Hàng nhập kho", to: "/warehoused-goods" },
        {
          label: this.item?.name || "Chi tiết hàng nhập kho",
          to: this.item
            ? `/warehoused-goods/${this.item.id}`
            : undefined,
        },
        { label: "Cập nhật" },
      ];
    },
  },
  mounted() {
    void this.load();
  },
  methods: {
    assetUrl,
    clearFieldError(key: string): void {
      if (!this.fieldErrors[key]) return;
      const { [key]: _removed, ...remaining } = this.fieldErrors;
      this.fieldErrors = remaining;
      if (!Object.keys(remaining).length) this.error = "";
    },
    async load(): Promise<void> {
      this.loading = true;
      this.error = "";
      try {
        const [item] = await Promise.all([
          warehouseService.detail(String(this.$route.params.id)),
          this.store.loadOptions(),
        ]);
        this.item = item;
        this.form = warehouseFormFromItem(item);
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.loading = false;
      }
    },
    async save(value: WarehouseFormModel): Promise<void> {
      if (!this.item) return;
      this.submitting = true;
      this.error = "";
      this.fieldErrors = {};
      try {
        const item = await warehouseService.update(this.item.id, value);
        await this.$router.replace({
          path: `/warehoused-goods/${item.id}`,
          query: { updated: "1" },
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
