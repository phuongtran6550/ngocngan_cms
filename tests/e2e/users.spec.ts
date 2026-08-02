import {
  ensureTableView,
  expect,
  mockUserApi,
  openRowActions,
  test,
  userApiPattern,
} from "./fixtures";

test("creates, edits the password, and deletes a user through the responsive UI", async ({ authenticatedPage: page }) => {
  await page.goto("/users");
  const list = await ensureTableView(page);

  await openRowActions(page, "Ngọc Châu");
  await expect(page.getByRole("button", { name: "Xóa Ngọc Châu" })).toHaveCount(0);

  await page.getByRole("button", { name: "Thêm mới" }).click();
  const createDrawer = page.getByRole("dialog", { name: "Thêm nhân sự" });
  await createDrawer.getByLabel("Họ tên").fill("Trần Thu Hà");
  await createDrawer.getByLabel("Tên đăng nhập").fill("thuhatran");
  await createDrawer.getByLabel("Mật khẩu").fill("secret123");
  await createDrawer.getByLabel("Vai trò được gán", { exact: true }).selectOption("role-sales");
  await createDrawer.getByRole("button", { name: "Thêm nhân sự" }).click();
  await expect(page.getByText("Đã thêm nhân sự", { exact: true })).toBeVisible();
  await expect(list.getByText("Trần Thu Hà", { exact: true })).toBeVisible();

  await openRowActions(page, "Nhân viên bán hàng");
  await page.getByRole("button", { name: "Sửa Nhân viên bán hàng" }).click();
  const editDrawer = page.getByRole("dialog", { name: "Cập nhật nhân sự" });
  const replacementPassword = editDrawer.getByLabel("Mật khẩu", { exact: true });
  await expect(replacementPassword).toHaveAttribute("placeholder", "Để trống nếu không đổi");
  await editDrawer.getByLabel("Họ tên").fill("Nhân viên kinh doanh");
  await replacementPassword.fill("newsecret123");
  const updateRequest = page.waitForRequest((request) => (
    request.method() === "PATCH" && new URL(request.url()).pathname.endsWith("/api/users/user-sales")
  ));
  await editDrawer.getByRole("button", { name: "Cập nhật", exact: true }).click();
  const request = await updateRequest;
  expect(request.postDataJSON()).toMatchObject({
    name: "Nhân viên kinh doanh",
    password: "newsecret123",
    role: "USER",
    roleId: "role-sales",
  });
  await expect(page.getByText("Đã cập nhật nhân sự", { exact: true })).toBeVisible();
  await expect(list.getByText("Nhân viên kinh doanh", { exact: true })).toBeVisible();

  await openRowActions(page, "Trần Thu Hà");
  await page.getByRole("button", { name: "Xóa Trần Thu Hà" }).click();
  await page.getByRole("button", { name: "Xóa nhân sự" }).click();
  await expect(page.getByText("Đã xóa nhân sự", { exact: true })).toBeVisible();
  await expect(list.getByText("Trần Thu Hà", { exact: true })).toHaveCount(0);
});

test("uses the mobile card view and switches back to the table", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.goto("/users");

  await expect(page.getByTestId("resource-card-grid")).toBeVisible();
  await expect(page.getByRole("article", { name: "Ngọc Châu" })).toBeVisible();

  await page.getByRole("button", { name: "Hiển thị dạng bảng" }).click();
  await expect(page.getByTestId("desktop-data-table")).toBeVisible();
  await expect(page.getByTestId("resource-card-grid")).toHaveCount(0);
});

test("filters users by account type", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.goto("/users");
  const table = page.getByTestId("desktop-data-table");
  const roleFilter = page.getByRole("combobox", { name: "Loại tài khoản" });

  await roleFilter.selectOption("USER");
  await expect(table.getByText("Nhân viên bán hàng", { exact: true })).toBeVisible();
  await expect(table.getByText("Ngọc Châu", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("list-total-summary")).toHaveAccessibleName("Tổng số bản ghi: 1");

  await roleFilter.selectOption("ADMINISTRATOR");
  await expect(table.getByText("Ngọc Châu", { exact: true })).toBeVisible();
  await expect(table.getByText("Nhân viên bán hàng", { exact: true })).toHaveCount(0);
});

test("validates required create fields before sending data", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390");
  await page.goto("/users");
  await page.getByRole("button", { name: "Thêm mới" }).click();
  const createDrawer = page.getByRole("dialog", { name: "Thêm nhân sự" });

  await createDrawer.getByRole("button", { name: "Thêm nhân sự" }).click();

  await expect(createDrawer.getByRole("alert").getByText("Họ tên là bắt buộc", { exact: true })).toBeVisible();
  await expect(createDrawer.getByRole("alert").getByText("Tên đăng nhập là bắt buộc", { exact: true })).toBeVisible();
  await expect(createDrawer.getByRole("alert").getByText("Mật khẩu là bắt buộc", { exact: true })).toBeVisible();
});

test("clears a create error when the user cancels the drawer", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.unroute(userApiPattern);
  await mockUserApi(page, { failCreateDuplicate: true });
  await page.goto("/users");

  await page.getByRole("button", { name: "Thêm mới" }).click();
  const createDrawer = page.getByRole("dialog", { name: "Thêm nhân sự" });
  await createDrawer.getByLabel("Họ tên").fill("Tài khoản trùng");
  await createDrawer.getByLabel("Tên đăng nhập").fill("admin");
  await createDrawer.getByLabel("Mật khẩu").fill("secret123");
  await createDrawer.getByLabel("Loại tài khoản").selectOption("USER");
  await createDrawer.getByRole("button", { name: "Thêm nhân sự" }).click();

  const duplicateError = page.getByText("Tài khoản này đã tồn tại", { exact: true });
  await expect(duplicateError.first()).toBeVisible();
  await createDrawer.getByRole("button", { name: "Hủy" }).click();

  await expect(createDrawer).toHaveCount(0);
  await expect(duplicateError).toHaveCount(0);
});

test("blocks accounts without user-management permission", async ({ readOnlyPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.goto("/users");

  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole("heading", { name: "Quản lý nhân sự" })).toHaveCount(0);
});

test("shows the normalized user-list API error", async ({ authenticatedPage: page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.unroute(userApiPattern);
  await mockUserApi(page, { failList: true });

  await page.goto("/users");

  await expect(page.getByRole("alert").getByText("Không thể tải nhân sự", { exact: true })).toBeVisible();
});
