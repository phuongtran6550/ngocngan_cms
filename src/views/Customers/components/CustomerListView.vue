<template>
  <ListLayout :key="resourceKey" :resource="resource" @view="openCustomer">
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
  createCustomerResource,
} from "@/views/Customers/config";
import type {
  CustomerMode,
  CustomerReportFilter,
} from "@/views/Customers/types";
import type { ResourceRow } from "@/config/resource";
import { inclusiveDateRangeError } from "@/utils/date-range";
import { routeQueryDate, routeQueryEnum } from "@/utils/route-query";

const customerCohorts = ["new"] as const;

export default defineComponent({
  name: "CustomerListView",
  components: { ListLayout },
  props: { mode: { type: String as PropType<CustomerMode>, required: true } },
  computed: {
    reportFilter(): CustomerReportFilter {
      if (this.mode !== "current") return {};
      const customerCohort = routeQueryEnum(
        this.$route.query.customerCohort,
        customerCohorts,
      );
      const from = routeQueryDate(this.$route.query.from);
      const to = routeQueryDate(this.$route.query.to);
      if (customerCohort !== "new" || inclusiveDateRangeError(from, to, { required: true })) return {};
      return { customerCohort, from, to };
    },
    resourceKey(): string {
      return [
        this.mode,
        this.reportFilter.customerCohort,
        this.reportFilter.from,
        this.reportFilter.to,
      ].filter(Boolean).join(":");
    },
    resource() {
      return createCustomerResource(this.mode, this.reportFilter);
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
