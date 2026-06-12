import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const protectedNav = [
  { path: '/dashboard', permission: 'dashboard.view' },
  { path: '/orders', permission: 'orders.view' },
  { path: '/warehoused-goods', permission: 'warehouse.view' },
  { path: '/customers', permission: 'customers.view' },
  { path: '/source-of-goods', permission: 'source-goods.view' },
  { path: '/roles', permission: 'roles.manage' },
  { path: '/users', permission: 'users.manage' },
  { path: '/zalo', permission: 'zalo.manage' }
];

function firstAllowedPath(auth) {
  return protectedNav.find((item) => auth.can(item.permission))?.path || '';
}

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/login/index.vue')
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { permission: 'dashboard.view' }
      },
      { path: 'orders', name: 'orders', component: () => import('@/views/orders/OrdersList.vue'), meta: { permission: 'orders.view' } },
      { path: 'orders/create', name: 'orders-create', component: () => import('@/views/orders/OrderCreate.vue'), meta: { permission: 'orders.create' } },
      { path: 'orders/missing', name: 'orders-missing', component: () => import('@/views/orders/OrderMissingInfo.vue'), meta: { permission: 'orders.view' } },
      { path: 'orders/:id', name: 'orders-detail', component: () => import('@/views/orders/OrderDetail.vue'), meta: { permission: 'orders.view' } },
      {
        path: 'customers',
        name: 'customers',
        component: () => import('@/views/customers/CustomersList.vue'),
        meta: { permission: 'customers.view' }
      },
      {
        path: 'customers/history',
        name: 'customers-history',
        component: () => import('@/views/customers/CustomerHistory.vue'),
        meta: { permission: 'customers.view' }
      },
      {
        path: 'warehoused-goods',
        name: 'warehoused-goods',
        component: () => import('@/views/warehousedGoods/WarehousedGoodsList.vue'),
        meta: { permission: 'warehouse.view' }
      },
      {
        path: 'warehoused-goods/create',
        name: 'warehoused-goods-create',
        component: () => import('@/views/warehousedGoods/WarehousedGoodsCreate.vue'),
        meta: { permission: 'warehouse.create' }
      },
      {
        path: 'warehoused-goods/:id',
        name: 'warehoused-goods-detail',
        component: () => import('@/views/warehousedGoods/WarehousedGoodsDetail.vue'),
        meta: { permission: 'warehouse.view' }
      },
      {
        path: 'source-of-goods',
        name: 'source-of-goods',
        component: () => import('@/views/sourceOfGoods/SourceOfGoodsList.vue'),
        meta: { permission: 'source-goods.view' }
      },
      {
        path: 'roles',
        name: 'roles',
        component: () => import('@/views/roles/RolesList.vue'),
        meta: { permission: 'roles.manage' }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/users/UsersList.vue'),
        meta: { permission: 'users.manage' }
      },
      {
        path: 'zalo',
        name: 'zalo',
        component: () => import('@/views/zalo/ZaloManagement.vue'),
        meta: { permission: 'zalo.manage' }
      },
      {
        path: 'zalo/callback',
        name: 'zalo-callback',
        component: () => import('@/views/zalo/ZaloCallback.vue'),
        meta: { permission: 'zalo.manage' }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/orders' }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (auth.token && !auth.user) {
    await auth.fetchMe().catch(() => auth.logout());
  }

  if (to.meta.requiresAuth && !auth.token) {
    return '/login';
  }

  if (to.name === 'login' && auth.token) {
    return firstAllowedPath(auth) || '/orders';
  }

  if (to.meta.permission && !auth.can(to.meta.permission)) {
    const fallback = firstAllowedPath(auth);
    return fallback && fallback !== to.path ? fallback : false;
  }

  return true;
});

export default router;
