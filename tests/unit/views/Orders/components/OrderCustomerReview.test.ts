import { mount } from "@vue/test-utils";
import OrderCustomerReview from "@/views/Orders/components/OrderCustomerReview.vue";
import type { Order } from "@/views/Orders/types";

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    orderCode: "DH-0001",
    name: "",
    phone: "",
    normalizedPhone: "",
    price: 2_500_000,
    thumbnail: "/uploads/order.jpg",
    images: ["/uploads/order.jpg"],
    status: "completed",
    customerInfoStatus: "review_required",
    sell: true,
    isRemoved: false,
    items: [],
    ocr: {
      attempts: 1,
      extractionVersion: "2026-08-02.1",
      strategy: "vision-layout-v1",
      candidateName: "Nguyễn An",
      candidatePhone: "0909123456",
      nameConfidence: 0.7,
      phoneConfidence: 0.95,
      nameAlternatives: [{ value: "Nguyễn Ân", confidence: 0.66, evidence: ["line-1"] }],
      phoneAlternatives: [{ value: "0919123456", confidence: 0.72, evidence: ["line-2"] }],
      evidence: [],
      reasonCodes: ["NAME_AMBIGUOUS"],
      orientation: 0,
      qualityFlags: [],
      rawText: "Nguyễn An\n0909123456",
      errorCode: "",
      multimodal: { attempted: true, provider: "vertex-ai", model: "configured-model", errorCode: "" },
      review: { mode: "", reviewedAt: undefined, nameOutcome: "", phoneOutcome: "" },
      processingDurationMs: 1200,
      processedAt: "2026-08-02T00:00:00.000Z",
    },
    ...overrides,
  };
}

function mountReview(value = order()) {
  return mount(OrderCustomerReview, {
    props: { order: value },
    global: {
      stubs: {
        ResourceImageCard: true,
        ImagePreview: true,
      },
    },
  });
}

describe("OrderCustomerReview", () => {
  it("shows field confidence and translates ambiguous-name guidance", () => {
    const wrapper = mountReview();

    expect(wrapper.text()).toContain("Trung bình");
    expect(wrapper.text()).toContain("Cao");
    expect(wrapper.text()).toContain("Tên có nhiều cách đọc");
  });

  it("applies one alternative without changing the other field", async () => {
    const wrapper = mountReview();

    await wrapper.get('[data-ocr-alternative="name-0"]').trigger("click");

    expect((wrapper.get("#review-customer-name").element as HTMLInputElement).value).toBe("Nguyễn Ân");
    expect((wrapper.get("#review-customer-phone").element as HTMLInputElement).value).toBe("0909123456");
  });

  it("keeps one explicit confirmation action and never auto-submits", async () => {
    const wrapper = mountReview();

    expect(wrapper.emitted("submit")).toBeUndefined();
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]).toEqual([{
      name: "Nguyễn An",
      phone: "0909123456",
      review: true,
    }]);
  });
});
