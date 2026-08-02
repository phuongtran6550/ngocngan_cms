import { ensureTableView, expect, openRowActions, test } from "./fixtures";

const functionalProjects = new Set(["desktop-1440", "mobile-390"]);

test("creates, edits, and deletes a custom role while protecting system roles", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(!functionalProjects.has(testInfo.project.name));
  await page.goto("/roles");
  const list = await ensureTableView(page);

  await expect(page.getByRole("button", { name: "Thao tác với Quản trị viên" })).toHaveCount(0);
  await openRowActions(page, "Bán hàng");
  await expect(page.getByRole("button", { name: "Xóa Bán hàng" })).toHaveCount(0);

  await page.getByTestId("list-create").click();
  const createDrawer = page.getByRole("dialog", { name: "Thêm vai trò" });
  await createDrawer.getByLabel("Tên vai trò").fill("Chăm sóc khách hàng");
  await createDrawer.getByLabel("Mô tả", { exact: true }).fill("Theo dõi và hỗ trợ khách hàng");
  await createDrawer.getByRole("button", { name: "Thêm vai trò" }).click();
  await expect(page.getByText("Đã thêm vai trò", { exact: true })).toBeVisible();
  await expect(list.getByText("Chăm sóc khách hàng", { exact: true })).toBeVisible();

  await openRowActions(page, "Chăm sóc khách hàng");
  await page.getByRole("button", { name: "Sửa Chăm sóc khách hàng" }).click();
  const editDrawer = page.getByRole("dialog", { name: "Cập nhật vai trò" });
  await editDrawer.getByLabel("Tên vai trò").fill("Dịch vụ khách hàng");
  await editDrawer.getByRole("button", { name: "Cập nhật", exact: true }).click();
  await expect(page.getByText("Đã cập nhật vai trò", { exact: true })).toBeVisible();
  await expect(list.getByText("Dịch vụ khách hàng", { exact: true })).toBeVisible();

  await openRowActions(page, "Dịch vụ khách hàng");
  await page.getByRole("button", { name: "Xóa Dịch vụ khách hàng" }).click();
  await page.getByRole("button", { name: "Xóa vai trò" }).click();
  await expect(page.getByText("Đã xóa vai trò", { exact: true })).toBeVisible();
  await expect(list.getByText("Dịch vụ khách hàng", { exact: true })).toHaveCount(0);
});
