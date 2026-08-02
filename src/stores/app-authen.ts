import { defineStore } from "pinia";
import { apiError, getToken, request, setToken } from "@/request";
import type {
  AuthMeResponse,
  AuthMenuItem,
  AuthUser,
  LoginCredentials,
  LoginResponse,
} from "@/views/Account/types";
import {
  canAccess,
  normalizePermissions,
  type PermissionRequirement,
} from "@/config/permissions";

const userKey = "ngocchau.cms2.user";

type AuthPayload = LoginResponse | AuthMeResponse;

function nestedPayload(payload: AuthPayload): AuthPayload {
  return payload.detail || payload.data || payload;
}

function readMenu(...values: Array<AuthMenuItem[] | undefined>): AuthMenuItem[] | undefined {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return undefined;
}

function normalizeUser(payload: AuthPayload): AuthUser {
  const source = nestedPayload(payload);
  const user = source.user || payload.user;
  if (!user) throw new Error("Phản hồi xác thực không có thông tin người dùng");

  const menu = readMenu(
    source.menu,
    payload.menu,
    user.menu,
    user.assignedRole?.menu,
  );
  return menu ? { ...user, menu } : user;
}

function accessToken(payload: LoginResponse): string {
  const source = nestedPayload(payload) as LoginResponse;
  return source.token || source.access_token || source.authen?.access_token ||
    payload.token || payload.access_token || payload.authen?.access_token || "";
}

function readUser(): AuthUser | null {
  try {
    const value = window.localStorage.getItem(userKey);
    return value ? (JSON.parse(value) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null): void {
  if (user) window.localStorage.setItem(userKey, JSON.stringify(user));
  else window.localStorage.removeItem(userKey);
}

export const authenStore = defineStore("authen", {
  state: () => ({
    token: getToken(),
    user: readUser() as AuthUser | null,
    isLoading: false,
    isHydrated: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.role === "ADMINISTRATOR",
    permissions: (state): string[] =>
      normalizePermissions(state.user?.permissions || []),
    menu: (state): AuthMenuItem[] => state.user?.menu || [],
    can: (state) => (permission?: PermissionRequirement) =>
      canAccess(state.user?.permissions || [], permission, state.user?.role),
    displayName: (state) =>
      state.user?.name || state.user?.username || "Người dùng",
  },
  actions: {
    async login(credentials: LoginCredentials): Promise<AuthUser> {
      this.isLoading = true;
      try {
        const { data } = await request.post<LoginResponse>(
          "/auth/login",
          credentials,
        );
        const user = normalizeUser(data);
        const token = accessToken(data);
        if (!token) throw new Error("Phản hồi đăng nhập không có access token");

        this.token = token;
        this.user = user;
        setToken(token);
        persistUser(user);
        return user;
      } catch (error) {
        throw apiError(error);
      } finally {
        this.isLoading = false;
        this.isHydrated = true;
      }
    },
    async fetchMe(): Promise<AuthUser> {
      const { data } = await request.get<AuthMeResponse>("/auth/me");
      const user = normalizeUser(data);
      this.user = user;
      persistUser(user);
      return user;
    },
    async initialize(): Promise<void> {
      if (this.isHydrated) return;
      this.isHydrated = true;
      if (!this.token) return;
      if (this.user) return;
      try {
        await this.fetchMe();
      } catch {
        this.logout();
      }
    },
    async changePassword(password: string): Promise<void> {
      try {
        await request.post("/auth/change-password", { password });
      } catch (error) {
        throw apiError(error);
      }
    },
    updateDynamicMenu(menu: AuthMenuItem[]): void {
      if (!this.user) return;
      this.user = { ...this.user, menu: [...menu] };
      persistUser(this.user);
    },
    logout(): void {
      this.token = "";
      this.user = null;
      this.isHydrated = true;
      setToken("");
      persistUser(null);
    },
  },
});
