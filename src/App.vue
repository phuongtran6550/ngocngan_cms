<template>
  <RouterView v-slot="{ Component, route }">
    <component :is="Component" v-if="route.meta.guestOnly" />
    <main
      v-else
      id="top"
      class="main"
      data-testid="app-root"
      @click="ui.closeProfile"
    >
      <AppSidebar
        :collapsed="ui.sidebarCollapsed"
        :mobile-open="ui.mobileNavOpen"
        @toggle="ui.toggleSidebar"
        @close-mobile="closeMobileNavigation"
      />
      <AppHeader
        :display-name="auth.displayName"
        :avatar="auth.user?.avatar"
        :mobile-open="ui.mobileNavOpen"
        :profile-open="ui.profileOpen"
        :searchable="Boolean(searchTarget)"
        :cart-visible="auth.can('orders.create')"
        :cart-count="cart.itemQuantity"
        :theme="ui.theme"
        @toggle-mobile="ui.toggleMobileNav"
        @toggle-theme="ui.toggleTheme"
        @toggle-profile="ui.toggleProfile"
        @close-profile="ui.closeProfile"
        @change-password="ui.openChangePassword"
        @logout="logout"
        @search="search"
      />

      <div
        ref="content"
        class="content"
        :class="{ 'is-sidebar-collapsed': ui.sidebarCollapsed }"
        data-testid="app-shell"
        tabindex="-1"
      >
        <component
          :is="Component"
          :key="`${route.path}?query=${String(route.query.query || '')}`"
        />
        <AppFooter />
      </div>
      <ChangePasswordDrawer
        :open="ui.changePasswordOpen"
        @close="ui.closeChangePassword"
      />
    </main>
  </RouterView>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AppFooter from "@/components/app/Footer.vue";
import AppHeader from "@/components/app/Header.vue";
import AppSidebar from "@/components/app/Sidebar.vue";
import ChangePasswordDrawer from "@/views/Account/components/ChangePasswordDrawer.vue";
import { authenStore } from "@/stores/app-authen";
import { useAppOptionStore } from "@/stores/app-option";
import { globalSearchTarget } from "@/utils/global-search";
import type { AuthMenuItem } from "@/views/Account/types";
import { useSalesCartStore } from "@/views/Orders/cart";

export default defineComponent({
  name: "App",
  components: {
    AppFooter,
    AppHeader,
    AppSidebar,
    ChangePasswordDrawer,
  },
  computed: {
    auth() {
      return authenStore();
    },
    ui() {
      return useAppOptionStore();
    },
    cart() {
      return useSalesCartStore();
    },
    searchTarget(): string | null {
      return globalSearchTarget(
        this.$route.path,
        this.auth.permissions,
        this.auth.user?.role,
        this.auth.menu,
      );
    },
  },
  created() {
    this.ui.initialize();
    this.cart.initialize();
  },
  watch: {
    "$route.path"() {
      void this.closeMobileNavigation();
    },
  },
  mounted() {
    window.addEventListener("menu:updated", this.handleMenuUpdated);
    window.addEventListener("menu:reload", this.reloadMenu);
  },
  beforeUnmount() {
    window.removeEventListener("menu:updated", this.handleMenuUpdated);
    window.removeEventListener("menu:reload", this.reloadMenu);
  },
  methods: {
    async closeMobileNavigation(): Promise<void> {
      if (!this.ui.mobileNavOpen) return;
      this.ui.closeMobileNav();
      await this.$nextTick();
      (this.$refs.content as HTMLElement | undefined)?.focus({
        preventScroll: true,
      });
    },
    async logout(): Promise<void> {
      this.auth.logout();
      this.ui.closeProfile();
      this.ui.closeChangePassword();
      await this.$router.replace("/login");
    },
    async search(query: string): Promise<void> {
      if (!this.searchTarget) return;
      await this.$router.push(query
        ? { path: this.searchTarget, query: { query } }
        : { path: this.searchTarget });
    },
    handleMenuUpdated(event: Event): void {
      const detail = (event as CustomEvent<AuthMenuItem[]>).detail;
      if (Array.isArray(detail)) this.auth.updateDynamicMenu(detail);
    },
    async reloadMenu(): Promise<void> {
      if (!this.auth.isAuthenticated) return;
      try {
        await this.auth.fetchMe();
      } catch {
        // The existing unauthorized interceptor owns forced logout behavior.
      }
    },
  },
});
</script>
