<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/orders" :aria-label="APP_NAME">
        <img class="brand-mark" src="/favicon.svg" alt="">
        <span class="brand-text">{{ brandMain }}<span v-if="brandAccent"> {{ brandAccent }}</span></span>
      </RouterLink>
      <div class="profile-area">
        <span class="muted">{{ auth.user?.name }}</span>
        <button class="btn btn-light btn-icon" title="Đăng xuất" type="button" @click="logout">
          <Icon icon="heroicons-outline:logout" />
        </button>
      </div>
    </header>

    <aside class="desktop-sidebar" aria-label="Menu desktop">
      <div class="sidebar-title">Menu</div>
      <nav class="desktop-nav" aria-label="Menu chính">
        <RouterLink
          v-for="item in visibleNav"
          :key="item.to"
          class="nav-link"
          :class="{ 'router-link-active': isNavActive(item) }"
          :aria-current="isNavActive(item) ? 'page' : undefined"
          :to="item.to"
        >
          <span class="nav-icon"><Icon :icon="item.icon" /></span>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="content-wrap">
      <RouterView />
    </main>

    <nav class="bottom-nav" aria-label="Menu mobile">
      <RouterLink
        v-for="item in bottomNav"
        :key="item.to"
        class="nav-link"
        :class="{ 'router-link-active': isNavActive(item) }"
        :aria-current="isNavActive(item) ? 'page' : undefined"
        :to="item.to"
      >
        <span class="nav-icon"><Icon :icon="item.icon" /></span>
        <span class="nav-short">{{ item.short }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { APP_NAME } from '@/config/app';
import { useAuthStore } from '@/stores/auth';
import Icon from '@/components/Icon';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const [brandMain, ...brandRest] = APP_NAME.split(' ');
const brandAccent = brandRest.join(' ');

const nav = computed(() => [
  { to: '/dashboard', label: 'Tổng quan', short: 'Tổng quan', icon: 'heroicons-outline:home', permission: 'dashboard.view' },
  {
    to: '/orders',
    label: 'Đơn hàng',
    short: 'Đơn hàng',
    icon: 'heroicons-outline:shopping-bag',
    permission: 'orders.view',
    activePrefix: '/orders',
    activeExclude: ['/orders/missing']
  },
  {
    to: '/orders/missing',
    label: 'Thiếu thông tin',
    short: 'Bổ sung',
    icon: 'heroicons-outline:exclamation-circle',
    permission: 'orders.view',
    activePrefix: '/orders/missing'
  },
  {
    to: '/warehoused-goods',
    label: 'Hàng nhập',
    short: 'Hàng nhập',
    icon: 'heroicons-outline:archive',
    permission: 'warehouse.view',
    activePrefix: '/warehoused-goods'
  },
  {
    to: '/customers',
    label: 'Khách hàng',
    short: 'Khách',
    icon: 'heroicons-outline:user-group',
    permission: 'customers.view',
    activePrefix: '/customers'
  },
  { to: '/source-of-goods', label: 'Nguồn hàng', short: 'Nguồn', icon: 'heroicons-outline:truck', permission: 'source-goods.view' },
  { to: '/roles', label: 'Vai trò', short: 'Vai trò', icon: 'heroicons-outline:shield-check', permission: 'roles.manage' },
  { to: '/users', label: 'Nhân sự', short: 'Nhân sự', icon: 'heroicons-outline:users', permission: 'users.manage' },
  { to: '/zalo', label: 'Zalo', short: 'Zalo', icon: 'heroicons-outline:chat-bubble-left-right', permission: 'zalo.manage' }
]);

const visibleNav = computed(() => nav.value.filter((item) => auth.can(item.permission)));
const bottomNav = computed(() => visibleNav.value);

function normalizePath(path) {
  const normalized = String(path || '/').replace(/\/+$/, '');
  return normalized || '/';
}

function matchesPath(currentPath, targetPath) {
  const target = normalizePath(targetPath);
  return currentPath === target || currentPath.startsWith(`${target}/`);
}

function isNavActive(item) {
  const currentPath = normalizePath(route.path);
  if (item.to === '/orders' && matchesPath(currentPath, '/orders/create')) {
    return true;
  }

  if (item.activeExclude?.some((target) => matchesPath(currentPath, target))) {
    return false;
  }

  if (item.activePrefix) {
    return matchesPath(currentPath, item.activePrefix);
  }

  return currentPath === normalizePath(item.to);
}

function logout() {
  auth.logout();
  router.push('/login');
}
</script>
