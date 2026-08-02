import { expect, test } from "./fixtures";

test.describe("permission matrix", () => {
  test("administrator sees all protected navigation and account actions", async ({ authenticatedPage: page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");
    await page.goto("/dashboard");

    await expect(page.getByRole("link", { name: /Tổng quan/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Đơn hàng/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Nhân sự/ })).toBeVisible();
    await page.getByTestId("profile-trigger").click();
    await page.getByTestId("change-password-action").click();
    await expect(page.getByRole("dialog", { name: "Đổi mật khẩu" })).toBeVisible();
  });

  test("read-only order user can view orders but cannot mutate or access user admin", async ({ readOnlyPage: page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");
    await page.goto("/orders");

    await expect(page.getByRole("heading", { name: "Quản lý đơn hàng" })).toBeVisible();
    await expect(page.getByTestId("list-create")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Xóa/ })).toHaveCount(0);

    await page.goto("/users");
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole("heading", { name: "Quản lý đơn hàng" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quản lý nhân sự" })).toHaveCount(0);
  });

  test("user with no permissions lands on the forbidden page", async ({ noPermissionPage: page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");
    await page.goto("/orders");

    await expect(page).toHaveURL(/\/403$/);
    await expect(page.getByRole("heading", { name: "Không có quyền truy cập" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Đơn hàng/ })).toHaveCount(0);
  });
});
