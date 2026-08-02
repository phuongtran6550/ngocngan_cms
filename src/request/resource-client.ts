import type { AxiosRequestConfig, RawAxiosResponseHeaders } from "axios";
import { apiError, request } from "@/request";

/**
 * Stable request result consumed by declarative resources while the Axios
 * client continues to own Ngoc Chau's API envelope normalization.
 */
export interface RequestSuccess<T> {
  status: "success";
  statusCode: number;
  status_code: number;
  response: T;
  headers: RawAxiosResponseHeaders;
}

export async function requestResult<T>(
  config: AxiosRequestConfig,
): Promise<RequestSuccess<T>> {
  try {
    const result = await request.request<T>(config);
    return {
      status: "success",
      statusCode: result.status,
      status_code: result.status,
      response: result.data,
      headers: result.headers,
    };
  } catch (error) {
    throw apiError(error);
  }
}

export type ResourceRequestSuccess<T> = RequestSuccess<T>;
export const resourceRequest = requestResult;
