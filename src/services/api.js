import axios from 'axios';
import { API_BASE_URL, ASSET_BASE_URL, AUTH_TOKEN_KEY } from '@/config/app';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function assetUrl(path) {
  if (!path) {
    return '';
  }
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${ASSET_BASE_URL}${path}`;
}

export function apiMessage(error) {
  return error?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
}
