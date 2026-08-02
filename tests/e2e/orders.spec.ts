import {
  collectPageErrors,
  ensureTableView,
  expect,
  mockOrderApi,
  orderApiPattern,
  test,
} from "./fixtures";

const image = {
  name: "order.png",
  mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR4AWKyKPn/H4SZGKAAAAAA//+3W6PJAAAABklEQVQDAEVWBVkdWYx2AAAAAElFTkSuQmCC", "base64"),
};

test("order list preserves Phoenix data and responsive behavior", async ({ authenticatedPage: page }) => {
  const pageErrors = collectPageErrors(page);
  await page.goto("/orders");

  const list = await ensureTableView(page);
  await expect(list.getByText("Nguyễn Minh Anh", { exact: true })).toBeVisible();
  await expect(list.getByText("8.500.000 ₫", { exact: true })).toBeVisible();
  await expect(page.locator("#order-type-filter")).toBeVisible();
  await expect(page.locator("#order-status-filter")).toBeVisible();
  await expect(page.getByRole("link", { name: "Đơn chờ bổ sung" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("creates one draft upload and completes it by patching the same order", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(!["desktop-1440", "mobile-390"].includes(testInfo.project.name));
  await page.unroute(orderApiPattern);
  const state = await mockOrderApi(page);
  const pageErrors = collectPageErrors(page);
  await page.goto("/orders/create");

  await page.locator('input[type="file"]').setInputFiles(image);
  await expect(page.getByText("Đơn nháp đã được tạo.", { exact: false })).toBeVisible();
  await page.getByLabel("Tên khách hàng", { exact: true }).fill("Lê Hoàng Nam");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0911222333");
  await page.getByLabel("Tổng thành tiền", { exact: true }).fill("3200000");
  await page.getByRole("button", { name: "Thêm sản phẩm" }).click();
  await page.getByLabel("Danh mục", { exact: true }).selectOption("category-1");
  await page.getByLabel("Giá sản phẩm", { exact: true }).fill("3200000");
  await page.getByRole("button", { name: "Hoàn tất đơn hàng" }).click();

  await expect(page).toHaveURL(/\/orders\/order-new\?created=1$/);
  await expect(page.getByRole("heading", { name: "Lê Hoàng Nam" })).toBeVisible();
  expect(state.counters.create).toBe(1);
  expect(state.counters.update).toBe(1);
  expect(state.counters.thumbnail).toBe(0);
  expect(state.writeKeys.every(Boolean)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test("retakes an image with thumbnail patch and never posts a second order", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.unroute(orderApiPattern);
  const state = await mockOrderApi(page);
  await page.goto("/orders/create");

  const picker = page.locator('input[type="file"]');
  await picker.setInputFiles(image);
  await expect(page.getByText("Đơn nháp đã được tạo.", { exact: false })).toBeVisible();
  await picker.setInputFiles({ ...image, name: "retake.png" });
  await expect.poll(() => state.counters.thumbnail).toBe(1);

  expect(state.counters.create).toBe(1);
  expect(state.counters.thumbnail).toBe(1);
});

test("completes a missing-info draft from the responsive queue", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(!["desktop-1440", "mobile-390"].includes(testInfo.project.name));
  await page.goto("/orders/missing");

  await expect(page.getByText("Chưa có tên khách", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Bổ sung thông tin" }).click();
  const drawer = page.getByRole("dialog", { name: "Bổ sung thông tin đơn hàng" });
  await drawer.getByLabel("Tên khách hàng", { exact: true }).fill("Trần Ngọc Mai");
  await drawer.getByLabel("Số điện thoại", { exact: true }).fill("0988777666");
  await drawer.getByLabel("Tổng thành tiền", { exact: true }).fill("4500000");
  await drawer.getByRole("button", { name: "Hoàn tất đơn hàng" }).click();

  await expect(page.getByText("Đã hoàn tất đơn hàng", { exact: true })).toBeVisible();
  await expect(page.getByText("Chưa có tên khách", { exact: true })).toHaveCount(0);
});

test("updates and returns an order through explicit business actions", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.goto("/orders/order-1");

  await page.getByRole("button", { name: "Cập nhật", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Cập nhật đơn hàng" });
  await drawer.getByLabel("Tên khách hàng", { exact: true }).fill("Nguyễn Minh Anh mới");
  await drawer.getByRole("button", { name: "Cập nhật đơn hàng" }).click();
  await expect(page.getByRole("heading", { name: "Nguyễn Minh Anh mới" })).toBeVisible();

  await page.getByRole("button", { name: "Đổi trả", exact: true }).click();
  await page.getByRole("button", { name: "Đánh dấu đổi trả" }).click();
  await expect(page.getByText("Đã đổi trả", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hủy đơn", exact: true })).toHaveCount(0);
});

test("cancels a completed order through the explicit business action", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.goto("/orders/order-1");

  await page.getByRole("button", { name: "Hủy đơn", exact: true }).click();
  await page.getByRole("button", { name: "Hủy đơn hàng" }).click();
  await expect(page.getByText("Đã hủy", { exact: true })).toBeVisible();
});

test("shows order loading, empty and API error states", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.unroute(orderApiPattern);
  await mockOrderApi(page, { delayMs: 300, empty: true });
  await page.goto("/orders");
  await expect(page.getByRole("status", { name: "Đang tải" })).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu", { exact: true })).toBeVisible();

  await page.unroute(orderApiPattern);
  await mockOrderApi(page, { failList: true });
  await page.reload();
  await expect(page.getByRole("alert").getByText("Không thể tải đơn hàng", { exact: true })).toBeVisible();
});

test("hides create and destructive actions for a read-only order user", async ({ readOnlyPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.goto("/orders");

  await expect(page.getByTestId("list-create")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Xóa/ })).toHaveCount(0);
  await page.goto("/orders/order-1");
  await expect(page.getByRole("button", { name: "Cập nhật", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Đổi trả", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Hủy đơn", exact: true })).toHaveCount(0);
});
