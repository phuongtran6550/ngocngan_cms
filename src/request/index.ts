import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";

export interface ApiErrorShape {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

export interface RequestClientOptions {
  baseURL?: string;
  timeout?: number;
  onUnauthorized?: () => void;
}

const defaultBaseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4100/api";
const tokenKey = "ngocchau.cms2.token";

let unauthorizedHandler: (() => void) | undefined;
let authGeneration = 0;
const requestGenerations = new WeakMap<object, number>();

export function unwrapApiPayload<T>(payload: T): T {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return payload;

  const envelope = payload as Record<string, unknown>;
  if (envelope.status !== "success") return payload;

  if (Object.hasOwn(envelope, "detail")) {
    return envelope.detail as T;
  }

  if (Object.hasOwn(envelope, "data")) {
    const meta = envelope.meta as Record<string, unknown> | undefined;
    if (
      meta &&
      typeof meta === "object" &&
      Object.hasOwn(meta, "page") &&
      Object.hasOwn(meta, "take") &&
      Object.hasOwn(meta, "itemCount") &&
      Object.hasOwn(meta, "pageCount")
    ) {
      return {
        items: envelope.data,
        page: meta.page,
        limit: meta.take,
        total: meta.itemCount,
        totalPages: meta.pageCount,
      } as T;
    }

    const extra = Object.fromEntries(
      Object.entries(envelope).filter(
        ([key]) => !["status", "data"].includes(key),
      ),
    );
    return Object.keys(extra).length
      ? ({ data: envelope.data, ...extra } as T)
      : (envelope.data as T);
  }

  const { status: _status, ...body } = envelope;
  return body as T;
}

export function normalizeApiError(
  error: AxiosError<{
    message?: string;
    code?: string;
    errors?:
      Record<string, unknown> | Array<{ key?: string; msg?: unknown }> | string;
    details?: Record<string, unknown>;
  }>,
): ApiErrorShape {
  const response = error.response;
  const data = response?.data;
  const errors = data?.errors;
  const normalizedErrors = Array.isArray(errors)
    ? Object.fromEntries(
        errors.map((item, index) => [item.key || `field_${index}`, item.msg]),
      )
    : errors && typeof errors === "object"
      ? errors
      : undefined;
  const ytplusMessage = Array.isArray(errors)
    ? String(errors[0]?.msg || "")
    : errors && typeof errors === "object" && "msg" in errors
      ? String(errors.msg || "")
      : typeof errors === "string"
        ? errors
        : "";

  let rawMessage =
    data?.message ||
    ytplusMessage ||
    error.message ||
    "Có lỗi xảy ra, vui lòng thử lại";

  if (error.code === "ECONNABORTED" || /timeout of \d+ms exceeded/i.test(rawMessage)) {
    rawMessage = "Đường truyền mạng quá chậm hoặc bị gián đoạn. Vui lòng thử lại.";
  } else if (error.code === "ERR_NETWORK" || rawMessage === "Network Error") {
    rawMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
  }

  return {
    message: rawMessage,
    code: data?.code || error.code,
    status: response?.status,
    errors: normalizedErrors,
    details: data?.details,
  };
}

function token(): string {
  return window.localStorage.getItem(tokenKey) || "";
}

export const request = axios.create({
  baseURL: defaultBaseURL,
  timeout: 30_000,
  withCredentials: true,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

request.interceptors.request.use((config) => {
  requestGenerations.set(config, authGeneration);
  const accessToken = token();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    response.data = unwrapApiPayload(response.data);
    return response;
  },
  (error: AxiosError) => {
    const normalized = normalizeApiError(
      error as AxiosError<{
        message?: string;
        code?: string;
        errors?:
          | Record<string, unknown>
          | Array<{ key?: string; msg?: unknown }>
          | string;
        details?: Record<string, unknown>;
      }>,
    );
    const currentToken = token();
    const requestToken = error.config?.headers?.Authorization;
    if (
      normalized.status === 401 &&
      Boolean(error.config) &&
      requestGenerations.get(error.config as object) === authGeneration &&
      requestToken === (currentToken ? `Bearer ${currentToken}` : undefined)
    )
      unauthorizedHandler?.();
    return Promise.reject(normalized);
  },
);

export function configureRequest(
  options: RequestClientOptions = {},
): AxiosInstance {
  if (options.baseURL) request.defaults.baseURL = options.baseURL;
  if (options.timeout) request.defaults.timeout = options.timeout;
  unauthorizedHandler = options.onUnauthorized;
  return request;
}

export function setToken(value: string): void {
  authGeneration++;
  if (value) window.localStorage.setItem(tokenKey, value);
  else window.localStorage.removeItem(tokenKey);
}

export function getToken(): string {
  return token();
}

export function apiError(error: unknown): ApiErrorShape {
  if (error && typeof error === "object" && "message" in error) {
    return error as ApiErrorShape;
  }
  return { message: "Có lỗi xảy ra, vui lòng thử lại" };
}

export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const assetBase =
    import.meta.env.VITE_ASSET_BASE_URL ||
    defaultBaseURL.replace(/\/api\/?$/, "");
  return `${assetBase}${path.startsWith("/") ? path : `/${path}`}`;
}

export function cancellableConfig(signal?: AbortSignal): AxiosRequestConfig {
  return signal ? { signal } : {};
}
