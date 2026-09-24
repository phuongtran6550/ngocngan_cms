export type OrderStatus = "draft" | "completed" | "returned" | "cancelled";
export type CustomerInfoStatus =
  | "complete"
  | "ocr_processing"
  | "review_required"
  | "manual_required";
export type OrderTypeFilter = "" | "1" | "2";
export type OcrConfidenceLevel = "high" | "medium" | "low";
export type OcrReviewOutcome = "" | "accepted" | "corrected" | "entered";
export const OCR_REASON_CODES = [
  "NAME_NOT_FOUND",
  "NAME_AMBIGUOUS",
  "PHONE_NOT_FOUND",
  "PHONE_INVALID",
  "LOW_IMAGE_RESOLUTION",
  "LOW_TEXT_COVERAGE",
  "ORIENTATION_UNCERTAIN",
  "OCR_DISAGREEMENT",
  "MULTIMODAL_UNAVAILABLE",
  "MULTIMODAL_INVALID_RESPONSE",
] as const;
export type OcrReasonCode = (typeof OCR_REASON_CODES)[number];
export const OCR_QUALITY_FLAGS = [
  "low_resolution",
  "low_text_coverage",
  "orientation_uncertain",
] as const;
export type OcrQualityFlag = (typeof OCR_QUALITY_FLAGS)[number];

export interface OrderOcrAlternative {
  value: string;
  confidence: number;
  evidence: string[];
}

export interface OrderOcrEvidence {
  field: "name" | "phone";
  lineId: string;
  text: string;
  source: "vision" | "multimodal";
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface OrderCategoryOption {
  id: string;
  name: string;
  type: "category";
}

export interface OrderItem {
  id?: string;
  productId: string | null;
  skuId: string | null;
  barcode: string;
  skuCode: string;
  productName: string;
  thumbnail: string;
  categoryId: string | null;
  category: string;
  materialId: string | null;
  material: string;
  patternId: string | null;
  pattern: string;
  size: string;
  weight: number;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  price: number;
}

export interface OrderOcrSuggestion {
  attempts: number;
  extractionVersion: string;
  strategy: string;
  candidateName: string;
  candidatePhone: string;
  nameConfidence: number;
  phoneConfidence: number;
  nameAlternatives: OrderOcrAlternative[];
  phoneAlternatives: OrderOcrAlternative[];
  evidence: OrderOcrEvidence[];
  reasonCodes: OcrReasonCode[];
  orientation: 0 | 90 | 180 | 270 | null;
  qualityFlags: OcrQualityFlag[];
  rawText: string;
  errorCode: string;
  multimodal: {
    attempted: boolean;
    provider: string;
    model: string;
    errorCode: string;
  };
  review: {
    mode: "" | "ocr" | "manual";
    reviewedAt?: string;
    nameOutcome: OcrReviewOutcome;
    phoneOutcome: OcrReviewOutcome;
  };
  processingDurationMs: number;
  processedAt?: string;
}

export interface Order {
  id: string;
  orderCode: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  price: number;
  thumbnail: string;
  images: string[];
  status: OrderStatus;
  customerInfoStatus: CustomerInfoStatus;
  ocr: OrderOcrSuggestion;
  sell: boolean;
  isRemoved: boolean;
  createdBy?: { id: string; name: string };
  createdByName?: string;
  customerDisplay?: string;
  productSummary?: string;
  itemQuantity?: number;
  items: OrderItem[];
  returnedAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderFormModel {
  name: string;
  phone: string;
  price: number;
  sell: boolean;
  items: OrderFormItem[];
}

export interface OrderFormItem {
  id?: string;
  categoryId: string | null;
  category: string;
  price: number;
}

export interface OrderCartLine {
  skuId: string;
  productId: string;
  barcode: string;
  skuCode: string;
  productName: string;
  thumbnail: string;
  category: string;
  material: string;
  pattern: string;
  size: string;
  weight: number;
  unitPrice: number;
  originalUnitPrice?: number;
  adjustedBy?: string;
  stock: number;
  status: "active" | "inactive";
  quantity: number;
  pricingType?: string;
  laborCost?: number;
  platingCost?: number;
  importPrice?: number | null;
  rawPrice?: number | null;
  manualPrice?: boolean;
}

export interface OrderCheckoutInput {
  image: File;
  name: string;
  phone: string;
  items: Array<{ skuId: string; quantity: number; unitPrice?: number }>;
}

export interface CheckoutRequestInput {
  imageId: string;
  name: string;
  phone: string;
  items: Array<{ skuId: string; quantity: number; unitPrice?: number }>;
}

export interface CheckoutRequest extends CheckoutRequestInput {
  requestId: string;
  thumbnail: string;
  status: "pending" | "processing" | "completed" | "failed";
  orderId: string | null;
  error: { code: string; message: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequestList {
  items: CheckoutRequest[];
  nextCursor: string | null;
}

export interface CheckoutAttempt {
  key: string;
  input: CheckoutRequestInput;
}

export interface OrderStatusCounts {
  all: number;
  completed: number;
  returned: number;
  cancelled: number;
  complete: number;
  ocrProcessing: number;
  reviewRequired: number;
  manualRequired: number;
}

export interface OrderListParams {
  page: number;
  limit: number;
  query?: string;
  type?: Exclude<OrderTypeFilter, "">;
  status?: OrderStatus | "";
  customerInfoStatus?: CustomerInfoStatus | "";
  from?: string;
  to?: string;
  sortBy?: "name" | "phone" | "price" | "status" | "createdAt" | "updatedAt";
  sortDirection?: "asc" | "desc";
}

export interface OrderListResponse {
  items: Order[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderOptionsResponse {
  categories: OrderCategoryOption[];
}

export interface OrderResponse {
  order?: Order;
}

export function emptyOrderForm(): OrderFormModel {
  return { name: "", phone: "", price: 0, sell: true, items: [] };
}

export function orderFormFromItem(order: Order): OrderFormModel {
  return {
    name: order.name,
    phone: order.phone,
    price: order.price,
    sell: order.sell,
    items: order.items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      category: item.category,
      price: item.price,
    })),
  };
}

export function orderWithDisplayFields(order: Order): Order {
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const labels = order.items.map((item) => item.productName || item.skuCode || item.category).filter(Boolean);
  return {
    ...order,
    createdByName: order.createdBy?.name || order.createdByName || "",
    customerDisplay: [order.name, order.phone].filter(Boolean).join(" · ") || "Khách chưa bổ sung",
    productSummary: labels.length
      ? `${labels.slice(0, 2).join(", ")}${labels.length > 2 ? ` +${labels.length - 2}` : ""}`
      : "Chưa có chi tiết sản phẩm",
    itemQuantity: quantity,
  };
}
