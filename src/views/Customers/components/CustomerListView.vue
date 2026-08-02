<template>
  <ListLayout :key="mode" :resource="resource" @view="openCustomer">
    <template #tabs>
      <li class="nav-item">
        <RouterLink
          class="nav-link"
          :class="{ active: mode === 'current' }"
          to="/customers"
          >Khách hiện tại</RouterLink
        >
      </li>
      <li class="nav-item">
        <RouterLink
          class="nav-link"
          :class="{ active: mode === 'history' }"
          to="/customers/history"
          >Lịch sử đổi trả</RouterLink
        >
      </li>
    </template>
  </ListLayout>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import ListLayout from "@/components/ListLayout/index.vue";
import {
  currentCustomerResource,
  historyCustomerResource,
} from "@/views/Customers/config";
import type { CustomerMode } from "@/views/Customers/types";
import type { ResourceRow } from "@/config/resource";

export default defineComponent({
  name: "CustomerListView",
  components: { ListLayout },
  props: { mode: { type: String as PropType<CustomerMode>, required: true } },
  computed: {
    resource() {
      return this.mode === "history"
        ? historyCustomerResource
        : currentCustomerResource;
    },
  },
  methods: {
    openCustomer(row: ResourceRow): void {
      const phone = String(row.phone || "").trim();
      if (phone) void this.$router.push(`/customers/${encodeURIComponent(phone)}`);
    },
  },
});
</script>
