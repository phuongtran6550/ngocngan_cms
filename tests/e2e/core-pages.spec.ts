import { ensureTableView, expect, openRowActions, test } from "./fixtures";

const functionalProjects = new Set(["desktop-1440", "mobile-390"]);

test("dashboard refreshes live data and opens actionable alerts", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(!functionalProjects.has(testInfo.project.name));
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Tổng quan kinh doanh" })).toBeVisible();
  const refreshRequest = page.waitForRequest((request) => (
    request.method() === "GET" && new URL(request.url()).pathname.endsWith("/api/dashboard/overview")
  ));
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await refreshRequest;

  await page.getByRole("link", { name: "Đơn chờ bổ sung" }).click();
  await expect(page).toHaveURL(/\/orders\/missing$/);
  await expect(page.getByRole("heading", { name: "Đơn chờ bổ sung" })).toBeVisible();
});

test("customers retain their order drill-down and return-history view", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(!functionalProjects.has(testInfo.project.name));
  await page.goto("/customers");
  const list = await ensureTableView(page);

  await expect(list.getByText("Nguyễn Minh Anh", { exact: true })).toBeVisible();
  await openRowActions(page, "Nguyễn Minh Anh");
  await page.getByRole("button", { name: "Xem Nguyễn Minh Anh" }).click();
  await expect(page).toHaveURL(/\/orders\?query=/);
  expect(new URL(page.url()).searchParams.get("query")).toBe("0909 111 222");
  const orderList = await ensureTableView(page);
  await expect(orderList.getByText("Nguyễn Minh Anh", { exact: true })).toBeVisible();

  await page.goto("/customers/history");
  const historyList = await ensureTableView(page);
  await expect(historyList.getByText("Phạm Thanh Hà", { exact: true })).toBeVisible();
});

test("profile password and Settings integrations complete their safe local actions", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(!functionalProjects.has(testInfo.project.name));
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Hồ sơ cá nhân" })).toBeVisible();
  await expect(page.locator("dl").getByText("Ngọc Châu", { exact: true })).toBeVisible();

  await page.goto("/profile/change-password");
  await page.getByTestId("change-password-new").fill("newsecret123");
  await page.getByTestId("change-password-confirm").fill("newsecret123");
  await page.getByTestId("change-password-form").getByRole("button", { name: "Cập nhật mật khẩu" }).click();
  await expect(page.getByText("Mật khẩu đã được cập nhật", { exact: true })).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Cài đặt", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Giá bạc cho sản phẩm Đồ cân" })).toBeVisible();
  await expect(page.getByText("220.000 VNĐ / chỉ", { exact: true })).toBeVisible();
  await page.getByTestId("silver-price-input").fill("230000");
  await page.getByTestId("silver-price-apply").click();
  await page.getByRole("button", { name: "Áp dụng giá bạc", exact: true }).click();
  await expect(page.getByText("Đã áp dụng giá bạc mới cho 3 sản phẩm Đồ cân", { exact: true })).toBeVisible();

  await expect(page.getByText("Ngọc Châu OA", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ngắt kết nối", exact: true }).click();
  await expect(page.getByText("Chưa có OA kết nối", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kết nối Zalo OA", exact: true })).toBeVisible();

  await page.goto("/zalo");
  await expect(page).toHaveURL(/\/settings#zalo$/);

  await page.goto("/zalo/callback?code=demo&state=oauth-state");
  await expect(page.getByRole("heading", { name: "Xử lý kết nối Zalo OA" })).toBeVisible();
  await expect(page.getByText("Ngọc Châu OA", { exact: true })).toBeVisible();
});
