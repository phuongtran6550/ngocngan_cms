import {
  categoryApiPattern,
  ensureTableView,
  test,
  expect,
  mockCategoryApi,
  openRowActions,
} from "./fixtures";

test("renders three separately addressable catalog pages", async ({
  authenticatedPage: page,
}) => {
  await page.goto("/categories");
  await expect(
    page.getByRole("heading", { name: "Quản lý danh mục", exact: true }),
  ).toBeVisible();
  await expect(
    (await ensureTableView(page)).getByText("Nhẫn", { exact: true }),
  ).toBeVisible();

  await page.goto("/materials");
  await expect(
    page.getByRole("heading", { name: "Quản lý chất liệu", exact: true }),
  ).toBeVisible();
  await expect(
    (await ensureTableView(page)).getByText("Vàng 18K", { exact: true }),
  ).toBeVisible();

  await page.goto("/patterns");
  await expect(
    page.getByRole("heading", { name: "Quản lý mẫu", exact: true }),
  ).toBeVisible();
  await expect(
    (await ensureTableView(page)).getByText("Bông mai", { exact: true }),
  ).toBeVisible();
  await page.getByTestId("list-create").click();
  await expect(page.getByRole("dialog", { name: "Thêm mẫu" })).toBeVisible();
});

test("creates, edits, and deletes a category on its dedicated page", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(!["desktop-1440", "mobile-390"].includes(testInfo.project.name));
  await page.goto("/categories");

  await page.getByTestId("list-create").click();
  const name = page.locator('input[name="name"]');
  await expect(name).toBeVisible();
  await name.fill("Lắc tay");
  await page.getByRole("button", { name: "Thêm danh mục" }).click();
  await expect(
    page.getByText("Đã thêm danh mục", { exact: true }),
  ).toBeVisible();

  await openRowActions(page, "Nhẫn");
  await page.getByRole("button", { name: "Sửa Nhẫn" }).click();
  await name.fill("Nhẫn cưới");
  await page
    .getByRole("dialog", { name: "Cập nhật danh mục" })
    .getByRole("button", { name: "Cập nhật", exact: true })
    .click();
  await expect(
    page.getByText("Đã cập nhật danh mục", { exact: true }),
  ).toBeVisible();

  await openRowActions(page, "Lắc tay");
  await page.getByRole("button", { name: "Xóa Lắc tay" }).click();
  await page.getByRole("button", { name: "Xóa danh mục" }).click();
  await expect(
    page.getByText("Đã xóa danh mục", { exact: true }),
  ).toBeVisible();
});

test("keeps an in-use category visible when server deletion is rejected", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.unroute(categoryApiPattern);
  await mockCategoryApi(page, { deleteInUse: true });
  await page.goto("/categories");

  await openRowActions(page, "Nhẫn");
  await page.getByRole("button", { name: "Xóa Nhẫn" }).click();
  await page.getByRole("button", { name: "Xóa danh mục" }).click();

  await expect(
    page.getByText(
      "Danh mục đang được sử dụng bởi 3 sản phẩm nên không thể xóa.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    (await ensureTableView(page)).getByText("Nhẫn", { exact: true }),
  ).toBeVisible();
});

test("renders the API error state for the dedicated Danh mục endpoint", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.unroute(categoryApiPattern);
  await mockCategoryApi(page, { failList: true });
  await page.goto("/categories");

  await expect(
    page.getByRole("alert").getByText("Lỗi hệ thống", { exact: true }),
  ).toBeVisible();
});

test("renders Danh mục as a Phoenix parent item with three child links", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.goto("/categories");

  const parent = page.locator(
    '#navbarVertical [aria-controls="sidebar-submenu-commerce-catalog"]',
  );
  await expect(parent).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "Chất liệu" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mẫu" })).toBeVisible();
});
