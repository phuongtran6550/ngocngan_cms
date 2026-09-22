<template>
  <ListLayout :resource="resource" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ListLayout from "@/components/ListLayout/index.vue";
import { priceRoundingResource } from "@/views/PriceRoundings/config";

export default defineComponent({
  name: "PriceRoundingListPage",
  components: { ListLayout },
  data() {
    return { resource: priceRoundingResource };
  },
});
</script>
