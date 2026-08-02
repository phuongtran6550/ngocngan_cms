<template>
  <nav
    :id="navigationId()"
    :class="[
      'navbar navbar-vertical navbar-expand-lg',
      mobile ? 'position-static top-0 w-100 h-100' : '',
    ]"
    aria-label="Điều hướng chính"
  >
    <div
      :id="collapseId()"
      :class="[
        'collapse navbar-collapse',
        mobile ? 'show d-flex flex-column flex-grow-1 h-100' : { show: mobileOpen },
      ]"
    >
      <div class="navbar-vertical-content">
        <ul :id="navigationListId()" class="navbar-nav flex-column">
          <li v-for="group in groups" :key="group.key" class="nav-item">
            <template v-if="group.label">
              <p class="navbar-vertical-label">{{ group.label }}</p>
              <hr class="navbar-vertical-line" />
            </template>
            <SidebarNavItem
              v-for="entry in group.entries"
              :key="entry.key"
              :entry="entry"
              :level="1"
              :node-id="`${group.key}-${entry.key}`"
              :parent-id="collapseId()"
              :collapsed="collapsed"
              @navigate="closeMobile"
            />
          </li>
        </ul>
      </div>

      <div v-if="!mobile" class="navbar-vertical-footer">
        <button
          type="button"
          class="btn navbar-vertical-toggle border-0 fw-semibold w-100 white-space-nowrap d-flex align-items-center"
          data-testid="sidebar-toggle"
          :aria-label="collapsed ? 'Mở rộng menu' : 'Thu gọn menu'"
          @click="$emit('toggle')"
        >
          <AppIcon :name="collapsed ? 'expand' : 'collapse'" />
          <span class="navbar-vertical-footer-text ms-2">Thu gọn menu</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import Collapse from "bootstrap/js/dist/collapse";
import { defineComponent } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import SidebarNavItem from "@/components/app/SidebarNavItem.vue";
import { authenStore } from "@/stores/app-authen";
import { visibleNavigationGroups } from "@/config/navigation";

export default defineComponent({
  name: "AppSidebar",
  components: { AppIcon, SidebarNavItem },
  props: {
    collapsed: { type: Boolean, default: false },
    mobile: { type: Boolean, default: false },
    mobileOpen: { type: Boolean, default: false },
  },
  emits: ["toggle", "close-mobile"],
  computed: {
    groups() {
      const auth = authenStore();
      return visibleNavigationGroups(auth.permissions, auth.user?.role, auth.menu);
    },
  },
  mounted() {
    this.showActiveSubmenus();
  },
  watch: {
    "$route.path"() {
      this.$nextTick(() => this.showActiveSubmenus());
    },
    groups: {
      deep: true,
      handler() {
        this.$nextTick(() => this.showActiveSubmenus());
      },
    },
  },
  methods: {
    navigationId(): string {
      return this.mobile ? "navbarVerticalMobile" : "navbarVertical";
    },
    collapseId(): string {
      return this.mobile
        ? "navbarVerticalCollapseMobile"
        : "navbarVerticalCollapse";
    },
    navigationListId(): string {
      return this.mobile ? "navbarVerticalNavMobile" : "navbarVerticalNav";
    },
    showActiveSubmenus(): void {
      const root = this.$el as HTMLElement;
      root.querySelectorAll<HTMLElement>("[data-sidebar-submenu='true']").forEach((submenu) => {
        const collapse = Collapse.getOrCreateInstance(submenu, { toggle: false });
        if (submenu.dataset.sidebarActive === "true") collapse.show();
        else collapse.hide();
      });
    },
    closeMobile(): void {
      this.$emit("close-mobile");
    },
  },
});
</script>
