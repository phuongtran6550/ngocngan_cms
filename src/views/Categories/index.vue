<template>
  <ListLayout :resource="resource" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ListLayout from "@/components/ListLayout/index.vue";
import { categoryResource } from "@/views/Categories/config";

export default defineComponent({
  name: "CategoryListPage",
  components: { ListLayout },
  data() {
    return { resource: categoryResource };
  },
});
</script>
