export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Ngọc Châu';

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api');
export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export const AUTH_TOKEN_KEY = 'ngocchau_token';
export const AUTH_USER_KEY = 'ngocchau_user';
