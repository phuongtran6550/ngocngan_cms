import {
  collectPageErrors,
  ensureTableView,
  expect,
  mockWarehouseApi,
  openRowActions,
  test,
  warehouseApiPattern,
} from "./fixtures";

test("inventory list preserves Phoenix data and responsive behavior", async ({
  authenticatedPage: page,
}) => {
  const pageErrors = collectPageErrors(page);
  await page.goto("/warehoused-goods");

  const list = await ensureTableView(page);
  await expect(
    list.getByText("Nhẫn kim cương Aurora", { exact: true }),
  ).toBeVisible();
  await expect(list.getByText("6.700.000 ₫", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Tìm kiếm sản phẩm")).toBeVisible();
  await expect(page.locator("#warehouse-category-filter")).toBeVisible();
  await expect(page.locator("#warehouse-material-filter")).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("keeps dense desktop inventory columns readable", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1280");
  await page.goto("/warehoused-goods");

  const table = (await ensureTableView(page)).locator("table");
  const metrics = await table.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    actionWhiteSpace: getComputedStyle(
      element.querySelector("tbody button") as HTMLElement,
    ).whiteSpace,
    actionPosition: getComputedStyle(
      element.querySelector("tbody td:last-child") as HTMLElement,
    ).position,
    actionRight: (
      element.querySelector("tbody td:last-child") as HTMLElement
    ).getBoundingClientRect().right,
    containerRight: (
      element.closest(".table-responsive") as HTMLElement
    ).getBoundingClientRect().right,
  }));

  expect(metrics.width).toBeGreaterThanOrEqual(1_120);
  expect(metrics.actionWhiteSpace).toBe("nowrap");
  expect(metrics.actionPosition).toBe("sticky");
  expect(metrics.actionRight).toBeLessThanOrEqual(metrics.containerRight + 1);
});

test("prints multiple labels through one quantity-modal request", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  let printRequests = 0;
  let requestedQuantity = 0;
  page.on("request", (request) => {
    if (!request.url().endsWith("/print-label")) return;
    printRequests += 1;
    requestedQuantity = Number(request.postDataJSON()?.quantity);
  });
  await page.goto("/warehoused-goods/warehouse-1");

  await page
    .getByRole("button", {
      name: "In tem NH-V18K-BM-1P25C-N12",
      exact: true,
    })
    .first()
    .click();

  const dialog = page.getByTestId("print-label-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("NH-V18K-BM-1P25C-N12");
  await dialog.getByLabel("Số lượng tem").fill("5");
  await dialog.getByRole("button", { name: "In 5 tem" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId("print-label-success")).toContainText(
    "Đã gửi 5 tem SKU NH-V18K-BM-1P25C-N12",
  );
  expect(printRequests).toBe(1);
  expect(requestedQuantity).toBe(5);
});

test("creates inventory with catalog, image, and automatic Đồ món pricing", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(!["desktop-1440", "mobile-390"].includes(testInfo.project.name));
  const pageErrors = collectPageErrors(page);
  await page.goto("/warehoused-goods/create");

  await page
    .getByLabel("Tên sản phẩm *", { exact: true })
    .fill("Bông tai Solis");
  await page
    .getByLabel("Danh mục *", { exact: true })
    .selectOption("category-1");
  await page
    .getByLabel("Chất liệu *", { exact: true })
    .selectOption("material-1");
  await page.getByLabel("Mẫu *", { exact: true }).selectOption("pattern-1");
  await page
    .getByLabel("Loại sản phẩm *", { exact: true })
    .selectOption("Đồ món");
  await page.locator('input[name="skus[0].size"]').fill("12");
  await page.locator('input[name="skus[0].stock"]').fill("3");
  const firstWeight = page.getByLabel("Trọng lượng chỉ *", { exact: true });
  await firstWeight.fill("1.25");
  await expect(page.locator('input[name="skus[0].code"]')).toHaveValue(
    "NH-V18K-BM-1P25C-N12",
  );
  await expect(page.getByTestId("sku-code-status-0")).toHaveCount(0);

  await firstWeight.press("Tab");
  await expect(page.locator('input[name="skus[0].code"]')).toHaveValue(
    "NH-V18K-BM-1P25C-N12-02",
  );
  await expect(page.getByTestId("sku-code-status-0")).toHaveCount(0);
  await expect(page.getByTestId("pricing-sku-code-0")).toHaveText(
    "NH-V18K-BM-1P25C-N12-02",
  );
  const firstImportPrice = page.getByLabel("Giá nhập *", { exact: true });
  await firstImportPrice.fill("4200000");
  await expect(firstImportPrice).toHaveValue("4,200,000");
  await expect(
    page.getByLabel("Giá bán sau làm tròn", { exact: true }),
  ).toHaveValue("6700000");
  await expect(page.getByTestId("pricing-formula-0")).toContainText("giảm 20%");
  await page.getByTestId("add-sku").click();
  await page.locator('input[name="skus[1].size"]').fill("14");
  await page.locator('input[name="skus[1].weight"]').fill("1.4");
  await page.locator('input[name="skus[1].stock"]').fill("7");
  await page.locator('input[name="skus[1].importPrice"]').fill("350000");
  await expect(page.locator('input[name="skus[1].importPrice"]')).toHaveValue(
    "350,000",
  );
  await expect(page.locator('input[name="skus[1].code"]')).toHaveValue(
    "NH-V18K-BM-1P4C-N14-02",
  );
  await expect(page.getByTestId("pricing-sku-code-1")).toHaveText(
    "NH-V18K-BM-1P4C-N14-02",
  );
  await page.locator('input[name="skus[1].code"]').fill("custom sku 14");
  await page.locator('input[name="skus[1].code"]').blur();
  await page
    .getByLabel("Chất liệu *", { exact: true })
    .selectOption("material-2");
  await expect(page.locator('input[name="skus[0].code"]')).toHaveValue(
    "NH-B925-BM-1P25C-N12",
  );
  await expect(page.locator('input[name="skus[1].code"]')).toHaveValue(
    "CUSTOM-SKU-14",
  );
  await expect(page.getByTestId("pricing-sku-code-1")).toHaveText(
    "CUSTOM-SKU-14",
  );
  await expect(page.locator('input[name="skus[1].price"]')).toHaveValue(
    "650000",
  );
  const createLayout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(createLayout.documentWidth).toBeLessThanOrEqual(
    createLayout.viewport + 1,
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: "solis.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nVQAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByAltText("Ảnh xem trước")).toBeVisible();

  await page.getByRole("button", { name: "Lưu sản phẩm" }).click();
  await expect(page).toHaveURL(
    /\/warehoused-goods\/warehouse-4\?created=1$/,
  );
  await expect(
    page.getByRole("heading", { name: "Bông tai Solis" }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Đã thêm hàng nhập kho thành công", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Bông mai", { exact: true }).first(),
  ).toBeVisible();
  const skuDetails =
    testInfo.project.name === "mobile-390"
      ? page.getByTestId("mobile-sku-card")
      : page.getByTestId("desktop-sku-row");
  await expect(
    skuDetails.getByText("6.700.000 ₫", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByTestId("sku-stock-0")).toHaveText("3");
  await expect(page.getByTestId("sku-stock-1")).toHaveText("7");
  await expect(page.getByText("2 SKU", { exact: true })).toBeVisible();
  await expect(
    skuDetails.getByText("NH-B925-BM-1P25C-N12", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    skuDetails.getByText("CUSTOM-SKU-14", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    skuDetails.getByText("14", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    skuDetails.getByText("650.000 ₫", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Thêm mới", exact: true }),
  ).toHaveAttribute("href", "/warehoused-goods/create");
  await expect(page.getByTestId("product-price-range")).toContainText(
    "650.000 ₫ – 6.700.000 ₫",
  );
  await expect(page.getByTestId("product-weight-range")).toContainText(
    "1,25 – 1,4 chỉ",
  );
  await expect(page.getByTestId("product-size-range")).toContainText(
    "Ni 12 – 14",
  );
  if (testInfo.project.name === "mobile-390") {
    await expect(page.getByTestId("mobile-sku-card").first()).toBeVisible();
  } else {
    await expect(page.getByTestId("desktop-sku-row").first()).toBeVisible();
  }

  const firstPrintButton = page.getByRole("button", {
    name: "In tem NH-B925-BM-1P25C-N12",
    exact: true,
  });
  await expect(firstPrintButton).toBeVisible();
  await firstPrintButton.click();

  const printDialog = page.getByTestId("print-label-dialog");
  await printDialog.getByLabel("Số lượng tem").fill("2");
  await printDialog.getByRole("button", { name: "In 2 tem" }).click();
  await expect(page.getByTestId("print-label-success")).toContainText(
    "Đã gửi 2 tem SKU NH-B925-BM-1P25C-N12",
  );

  expect(pageErrors).toEqual([]);
});

test("shows API validation beside and focuses the exact SKU input", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(!["desktop-1440", "mobile-390"].includes(testInfo.project.name));
  await page.unroute(warehouseApiPattern);
  await mockWarehouseApi(page, {
    saveErrors: {
      "skus.0.stock": "SKU 1: Tồn kho phải là số nguyên không âm",
    },
  });
  await page.goto("/warehoused-goods/create");

  await page.getByLabel("Tên sản phẩm *", { exact: true }).fill("Nhẫn Solis");
  await page
    .getByLabel("Danh mục *", { exact: true })
    .selectOption("category-1");
  await page
    .getByLabel("Chất liệu *", { exact: true })
    .selectOption("material-1");
  await page.getByLabel("Mẫu *", { exact: true }).selectOption("pattern-1");
  await page
    .getByLabel("Loại sản phẩm *", { exact: true })
    .selectOption("Đồ cân");
  const weight = page.getByLabel("Trọng lượng chỉ *", { exact: true });
  await weight.fill("3");
  const stock = page.locator('input[name="skus[0].stock"]');
  await page.locator('input[type="file"]').setInputFiles({
    name: "solis.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nVQAAAAASUVORK5CYII=",
      "base64",
    ),
  });

  await page.getByRole("button", { name: "Lưu sản phẩm" }).click();

  await expect(stock).toHaveClass(/is-invalid/);
  await expect(stock).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#warehouse-error-skus-0-stock")).toContainText(
    "Tồn kho phải là số nguyên không âm",
  );
  await expect(stock).toBeFocused();
});

test("edits inventory through the shared create form and keeps persisted SKU codes", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(!["desktop-1440", "mobile-390"].includes(testInfo.project.name));
  const pageErrors = collectPageErrors(page);
  await page.goto("/warehoused-goods");

  await openRowActions(page, "Nhẫn kim cương Aurora");
  await page.getByRole("button", { name: "Xem Nhẫn kim cương Aurora" }).click();
  await expect(page).toHaveURL(/\/warehoused-goods\/warehouse-1$/);
  await expect(page.getByTestId("create-another-product")).toHaveCount(0);
  const productContent = page.getByTestId("app-shell");
  await expect(
    productContent.getByText("Nguồn hàng", { exact: true }),
  ).toHaveCount(0);
  await expect(
    productContent.getByText("Số điện thoại", { exact: true }),
  ).toHaveCount(0);
  await expect(
    productContent.getByText("Trạng thái", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("2 SKU", { exact: true })).toBeVisible();
  await expect(page.getByTestId("product-price-range")).toContainText(
    "650.000 ₫ – 6.700.000 ₫",
  );
  await expect(page.getByTestId("product-weight-range")).toContainText(
    "1,25 – 1,4 chỉ",
  );
  await expect(page.getByTestId("product-size-range")).toContainText(
    "Ni 12 – 14",
  );

  await page.getByRole("link", { name: "Cập nhật", exact: true }).click();
  await expect(page).toHaveURL(
    /\/warehoused-goods\/warehouse-1\/edit$/,
  );
  await expect(
    page.getByRole("heading", { name: "Cập nhật hàng nhập kho" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByAltText("Ảnh xem trước")).toBeVisible();
  await expect(page.locator('input[name="supplierName"]')).toHaveCount(0);
  await expect(page.locator('input[name="supplierPhone"]')).toHaveCount(0);
  await expect(page.locator('select[name="status"]')).toHaveCount(0);
  await expect(page.getByLabel("Tên sản phẩm *", { exact: true })).toHaveValue(
    "Nhẫn kim cương Aurora",
  );
  await expect(page.getByLabel("Danh mục *", { exact: true })).toHaveValue(
    "category-1",
  );
  await expect(page.getByLabel("Chất liệu *", { exact: true })).toHaveValue(
    "material-1",
  );
  await expect(page.getByLabel("Mẫu *", { exact: true })).toHaveValue(
    "pattern-1",
  );
  await expect(page.getByLabel("Loại sản phẩm *", { exact: true })).toHaveValue(
    "Đồ món",
  );
  await expect(page.locator('[data-testid="sku-card"]')).toHaveCount(2);
  await expect(page.locator('input[name="skus[0].code"]')).toHaveValue(
    "NH-V18K-BM-1P25C-N12",
  );
  await expect(page.locator('input[name="skus[1].code"]')).toHaveValue(
    "NH-V18K-BM-1P4C-N14",
  );

  let skuCodeCheckRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/warehoused-goods/sku-codes/check")) {
      skuCodeCheckRequests += 1;
    }
  });
  await page
    .getByLabel("Tên sản phẩm *", { exact: true })
    .fill("Nhẫn Aurora phiên bản mới");
  await page.locator('input[name="skus[0].stock"]').fill("9");
  await page.locator('input[name="skus[1].stock"]').fill("5");
  await page.locator('input[name="skus[0].importPrice"]').fill("500000");
  await expect(page.locator('input[name="skus[0].importPrice"]')).toHaveValue(
    "500,000",
  );
  await expect(page.locator('input[name="skus[0].price"]')).toHaveValue(
    "850000",
  );
  await page
    .getByRole("button", { name: "Cập nhật hàng nhập kho" })
    .click();
  await expect(page).toHaveURL(
    /\/warehoused-goods\/warehouse-1\?updated=1$/,
  );
  expect(skuCodeCheckRequests).toBe(0);
  await expect(
    page.getByRole("heading", { name: "Nhẫn Aurora phiên bản mới" }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Đã cập nhật hàng nhập kho", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("sku-stock-0")).toHaveText("9");
  await expect(page.getByTestId("sku-stock-1")).toHaveText("5");
  const updatedSkuDetails =
    testInfo.project.name === "mobile-390"
      ? page.getByTestId("mobile-sku-card")
      : page.getByTestId("desktop-sku-row");
  await expect(
    updatedSkuDetails
      .getByText("NH-V18K-BM-1P25C-N12", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    updatedSkuDetails.getByText("NH-V18K-BM-1P4C-N14", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    updatedSkuDetails.getByText("850.000 ₫", { exact: true }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Xóa", exact: true }).click();
  await page.getByRole("button", { name: "Xóa hàng nhập kho" }).click();
  await expect(page).toHaveURL(/\/warehoused-goods$/);
  await expect(
    page.getByText("Nhẫn Aurora phiên bản mới", { exact: true }),
  ).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});

test("shows inventory loading and empty states", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.unroute(warehouseApiPattern);
  await mockWarehouseApi(page, { delayMs: 350, empty: true });
  await page.goto("/warehoused-goods");

  await expect(page.getByRole("status", { name: "Đang tải" })).toBeVisible();
  await expect(
    page.getByText("Chưa có dữ liệu", { exact: true }),
  ).toBeVisible();
});

test("shows the inventory API error state", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.unroute(warehouseApiPattern);
  await mockWarehouseApi(page, { failList: true });
  await page.goto("/warehoused-goods");

  await expect(
    page
      .getByRole("alert")
      .getByText("Không thể tải sản phẩm", { exact: true }),
  ).toBeVisible();
});
