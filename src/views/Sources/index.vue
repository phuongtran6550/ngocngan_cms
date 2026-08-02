<template>
  <ListLayout :resource="resource" @view="openInventory" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ListLayout from "@/components/ListLayout/index.vue";
import { sourceResource } from "@/views/Sources/config";
import type { ResourceRow } from "@/config/resource";

export default defineComponent({
  name: "SourceListPage",
  components: { ListLayout },
  data() {
    return { resource: sourceResource };
  },
  methods: {
    openInventory(row: ResourceRow): void {
      const query = String(row.phone || row.name || "");
      void this.$router.push({
        path: "/warehoused-goods",
        query: { query },
      });
    },
  },
});
</script>
