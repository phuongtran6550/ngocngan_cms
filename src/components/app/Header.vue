<template>
  <nav id="navbarDefault" class="navbar navbar-top fixed-top navbar-expand">
    <div class="collapse navbar-collapse justify-content-between">
      <div class="navbar-logo">
        <button
          type="button"
          class="btn navbar-toggler navbar-toggler-humburger-icon hover-bg-transparent"
          data-testid="mobile-nav-toggle"
          data-bs-target="#navbarVerticalCollapse"
          aria-controls="navbarVerticalCollapse"
          :aria-expanded="mobileOpen"
          :aria-label="mobileOpen ? 'Đóng menu' : 'Mở menu'"
          @click="$emit('toggle-mobile')"
        ><span class="navbar-toggle-icon"><span class="toggle-line" /></span></button>
        <RouterLink to="/dashboard" class="navbar-brand me-1 me-sm-3">
          <BrandLogo kind="mark" show-name hide-name-on-mobile />
        </RouterLink>
      </div>

      <div
        v-if="searchable"
        class="search-box navbar-top-search-box app-current-page-search"
      >
        <form class="position-relative" role="search" @submit.prevent="submitSearch">
          <input
            v-model="searchQuery"
            class="form-control search-input rounded-pill form-control-sm"
            type="search"
            placeholder="Tìm nhanh trong trang hiện tại..."
            aria-label="Tìm kiếm nhanh"
          />
          <AppIcon class="search-box-icon" name="search" />
        </form>
      </div>

      <ul class="navbar-nav navbar-nav-icons flex-row align-items-center">
        <li v-if="cartVisible" class="nav-item">
          <RouterLink
            to="/orders/create"
            class="nav-link px-2 position-relative"
            :aria-label="`Giỏ bán hàng có ${cartCount} sản phẩm`"
            title="Giỏ bán hàng"
          >
            <AppIcon name="shopping-cart" />
            <span v-if="cartCount" class="cart-count-badge">{{ cartCount > 99 ? "99+" : cartCount }}</span>
          </RouterLink>
        </li>
        <li class="nav-item">
          <a
            href="#"
            class="nav-link px-2"
            data-testid="theme-toggle"
            role="button"
            :aria-label="theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'"
            @click.prevent="$emit('toggle-theme')"
          >
            <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" />
          </a>
        </li>
        <li class="nav-item dropdown">
          <a
            id="navbarDropdownUser"
            class="nav-link lh-1 pe-0"
            href="#"
            data-testid="profile-trigger"
            role="button"
            aria-haspopup="menu"
            :aria-expanded="profileOpen"
            @click.prevent.stop="$emit('toggle-profile')"
          >
            <AppAvatar size="l" :src="avatar" />
          </a>
          <ProfileMenu
            :open="profileOpen"
            :display-name="displayName"
            :avatar="avatar"
            :navigation-entries="profileNavigation"
            @close="$emit('close-profile')"
            @change-password="$emit('change-password')"
            @logout="$emit('logout')"
          />
        </li>
      </ul>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import BrandLogo from "@/components/app/BrandLogo.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import AppAvatar from "@/components/ui/AppAvatar.vue";
import ProfileMenu from "@/views/Account/components/ProfileMenu.vue";
import { visibleNavigation, type NavigationEntry } from "@/config/navigation";
import { authenStore } from "@/stores/app-authen";

export default defineComponent({
  name: "AppTopbar",
  components: { AppAvatar, AppIcon, BrandLogo, ProfileMenu },
  props: {
    displayName: { type: String, required: true },
    avatar: { type: String, default: "" },
    mobileOpen: { type: Boolean, default: false },
    profileOpen: { type: Boolean, required: true },
    searchable: { type: Boolean, default: false },
    cartVisible: { type: Boolean, default: false },
    cartCount: { type: Number, default: 0 },
    theme: { type: String as PropType<"light" | "dark">, required: true },
  },
  emits: ["toggle-mobile", "toggle-theme", "toggle-profile", "close-profile", "change-password", "logout", "search"],
  data() {
    return { searchQuery: "" };
  },
  computed: {
    profileNavigation(): Array<NavigationEntry & { path: string }> {
      const auth = authenStore();
      return visibleNavigation(auth.permissions, auth.user?.role, auth.menu)
        .filter((entry): entry is NavigationEntry & { path: string } => Boolean(entry.path))
        .slice(0, 4);
    },
  },
  watch: {
    "$route.query.query": {
      immediate: true,
      handler(value: unknown) {
        this.searchQuery = typeof value === "string" ? value : "";
      },
    },
  },
  methods: {
    submitSearch(): void {
      const query = this.searchQuery.trim();
      this.searchQuery = query;
      this.$emit("search", query);
    },
  },
});
</script>

<style scoped>
.app-current-page-search {
  width: auto;
  min-width: 0;
  max-width: 25rem;
  flex: 1 1 25rem;
  margin-inline: clamp(0.35rem, 2vw, 1rem);
}

.app-current-page-search form,
.app-current-page-search .search-input {
  width: 100%;
}

.cart-count-badge {
  position: absolute;
  top: .15rem;
  right: -.05rem;
  min-width: 1.15rem;
  padding: .08rem .25rem;
  border: 2px solid var(--phoenix-body-bg);
  border-radius: 999px;
  color: #fff;
  background: var(--phoenix-danger);
  font-size: .58rem;
  font-weight: 800;
  line-height: .9rem;
  text-align: center;
}

@media (max-width: 575.98px) {
  .app-current-page-search {
    margin-inline: 0.25rem;
  }

  .app-current-page-search .search-input {
    padding-right: 0.75rem;
    padding-left: 2rem;
    font-size: 0.75rem;
  }

  .app-current-page-search .search-box-icon {
    left: 0.7rem;
  }
}
</style>
