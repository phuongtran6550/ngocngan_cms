<template>
  <span class="badge badge-phoenix" :class="statusClass">{{ statusLabel }}</span>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { OrderStatus } from "@/views/Orders/types";
import { resourceStatusClass, resourceStatusLabel } from "@/utils/resource-display";

export default defineComponent({
  name: "OrderStatusBadge",
  props: { status: { type: String as PropType<OrderStatus>, required: true } },
  computed: {
    statusLabel(): string { return resourceStatusLabel(this.status); },
    statusClass(): string { return resourceStatusClass(this.status); },
  },
});
</script>
