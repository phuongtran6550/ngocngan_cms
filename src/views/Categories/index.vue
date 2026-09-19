<template>
  <ListLayout :resource="resource">
    <template #drawer="drawer">
      <CategoryFormDrawer
        v-if="isCategoryFormModel(drawer.form)"
        :open="drawer.open"
        :editing="drawer.editing"
        :model-value="drawer.form"
        :submitting="drawer.submitting"
        :error="drawer.error"
        @close="drawer.close"
        @update:model-value="drawer.patch"
        @submit="drawer.save"
      />
    </template>
  </ListLayout>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ListLayout from "@/components/ListLayout/index.vue";
import CategoryFormDrawer from "@/views/Categories/components/CategoryFormDrawer.vue";
import { categoryResource } from "@/views/Categories/config";
import type { CategoryFormModel } from "@/views/Categories/types";

function isCategoryFormModel(value: object): value is CategoryFormModel {
  return typeof value === "object" && value !== null;
}

export default defineComponent({
  name: "CategoryListPage",
  components: { ListLayout, CategoryFormDrawer },
  data() {
    return { resource: categoryResource };
  },
  methods: {
    isCategoryFormModel,
  },
});
</script>
