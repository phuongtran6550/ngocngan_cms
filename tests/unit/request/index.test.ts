import {
  configureRequest,
  normalizeApiError,
  request,
  unwrapApiPayload,
} from "@/request";

describe("request client", () => {
  it("configures and returns the single shared Axios instance", () => {
    const originalBaseURL = request.defaults.baseURL;
    const configured = configureRequest({ baseURL: "http://localhost:4999/api" });

    expect(configured).toBe(request);
    expect(request.defaults.baseURL).toBe("http://localhost:4999/api");
    configureRequest({ baseURL: originalBaseURL });
  });

  it("unwraps YTPlus success envelopes without changing module service contracts", () => {
    expect(unwrapApiPayload({ status: "success", data: [{ id: "1" }] })).toEqual([{ id: "1" }]);
    expect(unwrapApiPayload({ status: "success", detail: { items: [], total: 0 } })).toEqual({
      items: [],
      total: 0,
    });
    expect(unwrapApiPayload({ status: "success", item: { id: "1" } })).toEqual({
      item: { id: "1" },
    });
    expect(unwrapApiPayload({
      status: "success",
      data: [{ id: "1" }],
      meta: {
        page: 2,
        take: 20,
        itemCount: 45,
        pageCount: 3,
        hasPreviousPage: true,
        hasNextPage: true,
      },
    })).toEqual({
      items: [{ id: "1" }],
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it("normalizes YTPlus and shared API error payloads to one CMS error shape", () => {
    expect(normalizeApiError({
      message: "Request failed",
      response: {
        status: 400,
        data: { status: "error", errors: { msg: "Dữ liệu không hợp lệ" } },
      },
    })).toMatchObject({
      message: "Dữ liệu không hợp lệ",
      status: 400,
    });

    expect(normalizeApiError({
      message: "Request failed",
      response: {
        status: 422,
        data: { message: "Dữ liệu không hợp lệ", code: "VALIDATION_ERROR" },
      },
    })).toMatchObject({
      message: "Dữ liệu không hợp lệ",
      code: "VALIDATION_ERROR",
      status: 422,
    });

    expect(normalizeApiError({
      message: "Request failed",
      response: {
        status: 400,
        data: { status: "error", errors: [{ key: "name", msg: "Tên là bắt buộc" }] },
      },
    })).toMatchObject({
      message: "Tên là bắt buộc",
      status: 400,
      errors: { name: "Tên là bắt buộc" },
    });
  });
});
