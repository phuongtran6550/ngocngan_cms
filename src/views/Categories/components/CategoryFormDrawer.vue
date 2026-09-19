<template>
  <DrawerPanel
    :open="open"
    :title="editing ? 'Cập nhật danh mục' : 'Thêm danh mục'"
    @close="$emit('close')"
  >
    <div v-if="error" class="alert alert-subtle-danger" role="alert">
      {{ error }}
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="mb-3">
        <label class="form-label" for="category-name">
          Tên danh mục <span class="text-danger">*</span>
        </label>
        <input
          id="category-name"
          class="form-control"
          name="name"
          required
          maxlength="120"
          :value="draft.name"
          placeholder="Nhập tên danh mục (VD: Nhẫn nữ, Dây chuyền...)"
          @input="patch('name', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="mb-4">
        <label class="form-label" for="category-description">Mô tả</label>
        <textarea
          id="category-description"
          class="form-control"
          name="description"
          rows="3"
          maxlength="500"
          :value="draft.description"
          placeholder="Nhập mô tả danh mục (tùy chọn)"
          @input="patch('description', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>

      <!-- Phần cấu hình nhóm theo giá -->
      <div class="card mb-4 border border-translucent">
        <div class="card-header bg-body-tertiary py-2 px-3 d-flex align-items-center justify-content-between">
          <div>
            <h6 class="mb-0 text-body-highlight fw-bold fs-9">
              Cấu hình nhóm giá (Ghép mã SKU đồ món)
            </h6>
            <div class="fs-10 text-body-tertiary">
              Sản phẩm đồ món sẽ dựa trên giá bán để tự động gán mã nhóm vào mã SKU
            </div>
          </div>
          <button
            type="button"
            class="btn btn-xs btn-subtle-primary"
            @click="addGroup"
          >
            <AppIcon name="plus" class="me-1" />
            Thêm nhóm
          </button>
        </div>

        <div class="card-body p-0">
          <div v-if="!draftGroups.length" class="text-center py-4 text-body-tertiary fs-9">
            Chưa có nhóm nào. Bấm <strong>Thêm nhóm</strong> để tạo khoảng giá.
          </div>

          <div v-else class="table-responsive">
            <table class="table table-sm fs-9 mb-0 align-middle">
              <thead class="bg-body-secondary text-body-tertiary">
                <tr>
                  <th style="width: 25%">Tên/Mã nhóm <span class="text-danger">*</span></th>
                  <th style="width: 33%">Giá từ (₫)</th>
                  <th style="width: 33%">Giá đến (₫)</th>
                  <th class="text-end pe-2" style="width: 9%">Xóa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(group, index) in draftGroups" :key="index">
                  <td class="ps-2">
                    <input
                      v-model="group.name"
                      class="form-control form-control-sm"
                      placeholder="VD: N1, N2..."
                      maxlength="60"
                      required
                    />
                  </td>
                  <td>
                    <MoneyInput
                      :id="`group-from-${index}`"
                      :name="`group-from-${index}`"
                      v-model="group.fromPrice"
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <MoneyInput
                      :id="`group-to-${index}`"
                      :name="`group-to-${index}`"
                      v-model="group.toPrice"
                      placeholder="0"
                    />
                  </td>
                  <td class="text-end pe-2">
                    <button
                      type="button"
                      class="btn btn-sm btn-link text-danger p-0"
                      title="Xóa nhóm"
                      @click="removeGroup(index)"
                    >
                      <AppIcon name="trash-2" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 pt-3">
        <button
          type="button"
          class="btn btn-phoenix-secondary"
          @click="$emit('close')"
        >
          Hủy
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="submitting"
        >
          {{ submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm danh mục" }}
        </button>
      </div>
    </form>
  </DrawerPanel>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import MoneyInput from "@/components/Form/MoneyInput.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import type { CategoryFormModel, CategoryGroup } from "@/views/Categories/types";

export default defineComponent({
  name: "CategoryFormDrawer",
  components: { AppIcon, DrawerPanel, MoneyInput },
  props: {
    open: Boolean,
    editing: Boolean,
    modelValue: {
      type: Object as PropType<CategoryFormModel | Record<string, unknown>>,
      required: true,
    },
    submitting: Boolean,
    error: { type: String, default: "" },
  },
  emits: ["close", "submit", "update:modelValue"],
  data() {
    const val = this.modelValue as Partial<CategoryFormModel>;
    return {
      draft: {
        name: val.name || "",
        description: val.description || "",
        groups: Array.isArray(val.groups)
          ? val.groups.map((g) => ({ ...g }))
          : [],
      } as CategoryFormModel,
    };
  },
  computed: {
    draftGroups(): CategoryGroup[] {
      return Array.isArray(this.draft.groups) ? this.draft.groups : [];
    },
  },
  watch: {
    modelValue: {
      deep: true,
      handler(val: CategoryFormModel | Record<string, unknown>) {
        const item = val as Partial<CategoryFormModel>;
        this.draft = {
          name: item.name || "",
          description: item.description || "",
          groups: Array.isArray(item.groups)
            ? item.groups.map((g) => ({ ...g }))
            : [],
        };
      },
    },
  },
  methods: {
    patch(key: keyof CategoryFormModel, value: unknown): void {
      this.draft = { ...this.draft, [key]: value };
      this.$emit("update:modelValue", { ...this.draft });
    },
    addGroup(): void {
      const groups = [...this.draftGroups];
      const nextIndex = groups.length + 1;
      groups.push({
        name: `N${nextIndex}`,
        fromPrice: 0,
        toPrice: 0,
      });
      this.patch("groups", groups);
    },
    removeGroup(index: number): void {
      const groups = [...this.draftGroups];
      groups.splice(index, 1);
      this.patch("groups", groups);
    },
    handleSubmit(): void {
      this.$emit("submit", {
        name: this.draft.name.trim(),
        description: (this.draft.description || "").trim(),
        groups: this.draftGroups
          .map((g) => ({
            ...(g.id ? { id: g.id } : {}),
            name: String(g.name || "").trim(),
            fromPrice: Number(g.fromPrice) || 0,
            toPrice: Number(g.toPrice) || 0,
          }))
          .filter((g) => g.name),
      });
    },
  },
});
</script>
