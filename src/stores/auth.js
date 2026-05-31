import { defineStore } from 'pinia';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/config/app';
import { api } from '@/services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(AUTH_TOKEN_KEY) || '',
    user: JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null')
  }),
  getters: {
    isAdmin: (state) => state.user?.role === 'ADMINISTRATOR',
    permissions: (state) => state.user?.permissions || [],
    can: (state) => (permission) => {
      if (!permission) return true;
      if (state.user?.role === 'ADMINISTRATOR') return true;
      return (state.user?.permissions || []).includes(permission);
    }
  },
  actions: {
    async login(credentials) {
      const { data } = await api.post('/auth/login', credentials);
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return data.user;
    },
    async fetchMe() {
      const { data } = await api.get('/auth/me');
      this.user = data.user;
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return data.user;
    },
    async changePassword(password) {
      await api.post('/auth/change-password', { password });
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }
});
