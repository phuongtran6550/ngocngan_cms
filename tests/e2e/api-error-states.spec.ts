import {
  customerApiPattern,
  dashboardApiPattern,
  expect,
  mockCustomerApi,
  mockDashboardApi,
  mockRoleApi,
  mockSettingsApi,
  mockUserApi,
  mockZaloApi,
  roleApiPattern,
  settingsApiPattern,
  test,
  userApiPattern,
  zaloApiPattern,
} from "./fixtures";

test.describe("API error states", () => {
  test("dashboard shows the normalized API error", async ({ authenticatedPage: page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");
    await page.unroute(dashboardApiPattern);
    await mockDashboardApi(page, { failOverview: true });

    await page.goto("/dashboard");

    await expect(page.getByRole("alert").getByText("Không thể tải tổng quan", { exact: true })).toBeVisible();
  });

  test("customers, roles, and users render list-level API errors", async ({ authenticatedPage: page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");

    await page.unroute(customerApiPattern);
    await mockCustomerApi(page, { failList: true });
    await page.goto("/customers");
    await expect(page.getByRole("alert").getByText("Không thể tải khách hàng", { exact: true })).toBeVisible();

    await page.unroute(roleApiPattern);
    await mockRoleApi(page, { failList: true });
    await page.goto("/roles");
    await expect(page.getByRole("alert").getByText("Không thể tải vai trò", { exact: true })).toBeVisible();

    await page.unroute(userApiPattern);
    await mockUserApi(page, { failList: true });
    await page.goto("/users");
    await expect(page.getByRole("alert").getByText("Không thể tải nhân sự", { exact: true })).toBeVisible();
  });

  test("Settings integrations and callback expose typed safe errors", async ({ authenticatedPage: page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");

    await page.unroute(settingsApiPattern);
    await mockSettingsApi(page, { failStatus: true });
    await page.goto("/settings");
    await expect(page.getByRole("alert").getByText("Không thể tải giá bạc", { exact: true })).toBeVisible();

    await page.unroute(zaloApiPattern);
    await mockZaloApi(page, { failStatus: true });
    await page.goto("/settings");
    await expect(page.getByRole("alert").getByText("Không thể tải trạng thái Zalo OA", { exact: true })).toBeVisible();

    await page.unroute(zaloApiPattern);
    await mockZaloApi(page, { failCallback: true });
    await page.goto("/zalo/callback?code=demo&state=bad");
    await expect(page.getByRole("alert").getByText("Callback Zalo không hợp lệ", { exact: true })).toBeVisible();
  });
});
