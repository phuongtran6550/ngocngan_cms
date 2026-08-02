import {
  collectPageErrors,
  ensureTableView,
  expect,
  mockSourceApi,
  openRowActions,
  sourceApiPattern,
  test,
} from "./fixtures";

test("source list aggregates import values responsively", async ({
  authenticatedPage: page,
}) => {
  const pageErrors = collectPageErrors(page);
  await page.goto("/source-of-goods");

  const list = await ensureTableView(page);
  await expect(
    list.getByText("Kim Hoàn Minh Anh", { exact: true }),
  ).toBeVisible();
  await expect(list.getByText("11.700.000 ₫", { exact: true })).toBeVisible();
  await expect(list.getByText("2", { exact: true })).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("opens filtered inventory from a source without losing the initial query", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(!["desktop-1440", "mobile-390"].includes(testInfo.project.name));
  const pageErrors = collectPageErrors(page);
  await page.goto("/source-of-goods");

  await openRowActions(page, "Kim Hoàn Minh Anh");
  await page.getByRole("button", { name: "Xem Kim Hoàn Minh Anh" }).click();
  await expect(page).toHaveURL(
    /\/warehoused-goods\?query=0909(\+|%20)123(\+|%20)456$/,
  );
  await expect(page.getByPlaceholder("Tìm kiếm sản phẩm")).toHaveValue(
    "0909 123 456",
  );

  const list = await ensureTableView(page);
  await expect(
    list.getByText("Nhẫn kim cương Aurora", { exact: true }),
  ).toBeVisible();
  await expect(
    list.getByText("Lắc tay Celeste", { exact: true }),
  ).toBeVisible();
  await expect(
    list.getByText("Mặt dây chuyền Luna", { exact: true }),
  ).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});

test("shows source loading and empty states", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.unroute(sourceApiPattern);
  await mockSourceApi(page, { delayMs: 350, empty: true });
  await page.goto("/source-of-goods");

  await expect(page.getByRole("status", { name: "Đang tải" })).toBeVisible();
  await expect(
    page.getByText("Chưa có dữ liệu", { exact: true }),
  ).toBeVisible();
});

test("shows the source API error state", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.unroute(sourceApiPattern);
  await mockSourceApi(page, { failList: true });
  await page.goto("/source-of-goods");

  await expect(
    page
      .getByRole("alert")
      .getByText("Không thể tải nguồn hàng", { exact: true }),
  ).toBeVisible();
});
