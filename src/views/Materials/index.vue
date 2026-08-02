<template>
  <ListLayout :resource="resource" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ListLayout from "@/components/ListLayout/index.vue";
import { materialResource } from "@/views/Materials/config";

export default defineComponent({
  name: "MaterialListPage",
  components: { ListLayout },
  data() {
    return { resource: materialResource };
  },
});
</script>
