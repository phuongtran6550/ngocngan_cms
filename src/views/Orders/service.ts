import { request } from "@/request";
import {
  OCR_QUALITY_FLAGS,
  OCR_REASON_CODES,
} from "@/views/Orders/types";
import type {
  CheckoutRequest,
  CheckoutRequestInput,
  CheckoutRequestList,
  Order,
  OrderCheckoutInput,
  OrderFormModel,
  OrderListParams,
  OrderListResponse,
  OrderOptionsResponse,
  OrderResponse,
  OrderStatusCounts,
} from "@/views/Orders/types";

export type ProgressCallback = (progress: number) => void;

const ocrReasonCodes = new Set<string>(OCR_REASON_CODES);
const ocrQualityFlags = new Set<string>(OCR_QUALITY_FLAGS);

export function createOrderIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cms2-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function writeHeaders(contentType?: string, key = createOrderIdempotencyKey()): Record<string, string> {
  return {
    ...(contentType ? { "Content-Type": contentType } : {}),
    "Idempotency-Key": key,
  };
}

function orderFromResponse(value: Order | OrderResponse): Order {
  let order: Order;
  if (value && typeof value === "object" && "order" in value && value.order) {
    order = value.order;
  } else {
    order = value as Order;
  }
  const ocr = order?.ocr || {} as Order["ocr"];
  return {
    ...order,
    ocr: {
      attempts: Number(ocr.attempts) || 0,
      extractionVersion: ocr.extractionVersion || "",
      strategy: ocr.strategy || "",
      candidateName: ocr.candidateName || "",
      candidatePhone: ocr.candidatePhone || "",
      nameConfidence: Number(ocr.nameConfidence) || 0,
      phoneConfidence: Number(ocr.phoneConfidence) || 0,
      nameAlternatives: Array.isArray(ocr.nameAlternatives) ? ocr.nameAlternatives : [],
      phoneAlternatives: Array.isArray(ocr.phoneAlternatives) ? ocr.phoneAlternatives : [],
      evidence: Array.isArray(ocr.evidence) ? ocr.evidence : [],
      reasonCodes: Array.isArray(ocr.reasonCodes)
        ? ocr.reasonCodes.filter((value) => ocrReasonCodes.has(value))
        : [],
      orientation: [0, 90, 180, 270].includes(ocr.orientation as number)
        ? ocr.orientation
        : null,
      qualityFlags: Array.isArray(ocr.qualityFlags)
        ? ocr.qualityFlags.filter((value) => ocrQualityFlags.has(value))
        : [],
      rawText: ocr.rawText || "",
      errorCode: ocr.errorCode || "",
      multimodal: {
        attempted: ocr.multimodal?.attempted === true,
        provider: ocr.multimodal?.provider || "",
        model: ocr.multimodal?.model || "",
        errorCode: ocr.multimodal?.errorCode || "",
      },
      review: {
        mode: ocr.review?.mode || "",
        reviewedAt: ocr.review?.reviewedAt,
        nameOutcome: ocr.review?.nameOutcome || "",
        phoneOutcome: ocr.review?.phoneOutcome || "",
      },
      processingDurationMs: Number(ocr.processingDurationMs) || 0,
      processedAt: ocr.processedAt,
    },
  };
}

function normalizedOrderList(value: OrderListResponse): OrderListResponse {
  return { ...value, items: value.items.map((order) => orderFromResponse(order)) };
}

function uploadProgress(callback?: ProgressCallback) {
  if (!callback) return undefined;
  return (event: { loaded: number; total?: number }) => {
    const total = event.total || event.loaded || 1;
    callback(Math.min(100, Math.round((event.loaded / total) * 100)));
  };
}

function thumbnailBody(file: File): FormData {
  const body = new FormData();
  body.append("thumbnail", file);
  return body;
}

export const orderService = {
  async list(params: OrderListParams, signal?: AbortSignal): Promise<OrderListResponse> {
    const { data } = await request.get<OrderListResponse>("/orders", { params, signal });
    return normalizedOrderList(data);
  },
  async missing(params: OrderListParams, signal?: AbortSignal): Promise<OrderListResponse> {
    const { data } = await request.get<OrderListResponse>("/orders/missing-info", { params, signal });
    return normalizedOrderList(data);
  },
  async options(signal?: AbortSignal): Promise<OrderOptionsResponse> {
    const { data } = await request.get<OrderOptionsResponse>("/orders/options", { signal });
    return data;
  },
  async counts(signal?: AbortSignal): Promise<OrderStatusCounts> {
    const { data } = await request.get<OrderStatusCounts>("/orders/status-counts", { signal });
    return data;
  },
  async detail(id: string, signal?: AbortSignal): Promise<Order> {
    const { data } = await request.get<Order | OrderResponse>(`/orders/${id}`, { signal });
    return orderFromResponse(data);
  },
  async checkout(
    input: OrderCheckoutInput,
    key: string,
    onProgress?: ProgressCallback,
  ): Promise<Order> {
    const body = new FormData();
    body.append("thumbnail", input.image);
    body.append("name", input.name.trim());
    body.append("phone", input.phone.trim());
    body.append("items", JSON.stringify(input.items));
    const { data } = await request.post<Order | OrderResponse>("/orders/checkout", body, {
      headers: writeHeaders("multipart/form-data", key),
      onUploadProgress: uploadProgress(onProgress),
    });
    return orderFromResponse(data);
  },
  async uploadCheckoutImage(file: File, signal?: AbortSignal): Promise<{ imageId: string }> {
    const { data } = await request.post<{ imageId: string }>(
      "/orders/checkout-images", thumbnailBody(file),
      { headers: writeHeaders("multipart/form-data"), signal },
    );
    return data;
  },
  async acceptCheckout(input: CheckoutRequestInput, key: string): Promise<CheckoutRequest> {
    const { data, status } = await request.post<CheckoutRequest>("/orders/checkout", input, {
      headers: writeHeaders(undefined, key),
    });
    if (status !== 202 || !data?.requestId || data.imageId !== input.imageId
      || !["pending", "processing", "completed", "failed"].includes(data.status)) {
      throw new Error("Chưa nhận được xác nhận hợp lệ. Vui lòng kiểm tra lại yêu cầu.");
    }
    return data;
  },
  async checkoutRequests(status: "active" | "completed", cursor?: string, signal?: AbortSignal): Promise<CheckoutRequestList> {
    const { data } = await request.get<CheckoutRequestList>("/orders/checkout-requests", {
      params: { status, cursor }, signal,
    });
    return data;
  },
  async checkoutRequest(requestId: string, signal?: AbortSignal): Promise<CheckoutRequest> {
    const { data } = await request.get<CheckoutRequest>(`/orders/checkout-requests/${requestId}`, { signal });
    return data;
  },
  async retryCheckout(requestId: string): Promise<CheckoutRequest> {
    const { data } = await request.post<CheckoutRequest>(`/orders/checkout-requests/${requestId}/retry`, {});
    return data;
  },
  async createDraft(file: File, onProgress?: ProgressCallback): Promise<Order> {
    const body = thumbnailBody(file);
    body.append("status", "draft");
    body.append("sell", "true");
    const { data } = await request.post<Order | OrderResponse>("/orders", body, {
      headers: writeHeaders("multipart/form-data"),
      onUploadProgress: uploadProgress(onProgress),
    });
    return orderFromResponse(data);
  },
  async update(id: string, input: OrderFormModel): Promise<Order> {
    const { data } = await request.patch<Order | OrderResponse>(`/orders/${id}`, input, {
      headers: writeHeaders(),
    });
    return orderFromResponse(data);
  },
  async updateThumbnail(id: string, file: File, onProgress?: ProgressCallback): Promise<Order> {
    const { data } = await request.patch<Order | OrderResponse>(`/orders/${id}/thumbnail`, thumbnailBody(file), {
      headers: writeHeaders("multipart/form-data"),
      onUploadProgress: uploadProgress(onProgress),
    });
    return orderFromResponse(data);
  },
  async markReturned(id: string): Promise<Order> {
    const { data } = await request.post<Order | OrderResponse>(`/orders/${id}/mark-returned`, {}, {
      headers: writeHeaders(),
    });
    return orderFromResponse(data);
  },
  async reviewCustomerInfo(id: string, name: string, phone: string): Promise<Order> {
    const { data } = await request.post<Order | OrderResponse>(
      `/orders/${id}/customer-info/review`,
      { name, phone },
      { headers: writeHeaders() },
    );
    return orderFromResponse(data);
  },
  async completeCustomerInfo(id: string, name: string, phone: string): Promise<Order> {
    const { data } = await request.post<Order | OrderResponse>(
      `/orders/${id}/customer-info/manual`,
      { name, phone },
      { headers: writeHeaders() },
    );
    return orderFromResponse(data);
  },
  async restore(id: string): Promise<Order> {
    const { data } = await request.post<Order | OrderResponse>(`/orders/${id}/restore`, {}, {
      headers: writeHeaders(),
    });
    return orderFromResponse(data);
  },
  async remove(id: string): Promise<void> {
    await request.delete(`/orders/${id}`, { headers: writeHeaders() });
  },
  async permanentDelete(id: string): Promise<void> {
    await request.delete(`/orders/${id}/permanent`, { headers: writeHeaders() });
  },
};
