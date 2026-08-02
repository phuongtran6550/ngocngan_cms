import { collectPageErrors, expect, test } from "./fixtures";
import { activeRoutes } from "./route-catalog";

for (const route of activeRoutes) {
  test(`keeps ${route.path} inside the viewport at every required breakpoint`, async ({
    authenticatedPage: page,
  }) => {
    const pageErrors = collectPageErrors(page);
    await page.goto(route.path);
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: route.heading }).first(),
    ).toBeVisible();
    const viewportWidth = page.viewportSize()?.width || 0;

    if (route.path === "/categories") {
      const totalSummary = page.getByTestId("list-total-summary");
      const viewToggle = page.getByTestId("view-mode-toggle");
      const viewSurface = page.getByTestId("list-view-surface");
      const tableToggle = page.getByTestId("view-mode-table");
      const gridToggle = page.getByTestId("view-mode-grid");
      await expect(viewToggle).toHaveAttribute("role", "group");
      await expect(viewToggle).toHaveAttribute(
        "aria-label",
        "Chế độ hiển thị danh sách",
      );
      await expect(tableToggle).toHaveAttribute(
        "aria-label",
        "Hiển thị dạng bảng",
      );
      await expect(gridToggle).toHaveAttribute(
        "aria-label",
        "Hiển thị dạng thẻ",
      );
      await expect(viewToggle).toContainText("Bảng");
      await expect(viewToggle).toContainText("Thẻ");
      await expect(totalSummary).toContainText("ALL");
      await expect(totalSummary).toHaveAttribute(
        "aria-label",
        "Tổng số bản ghi: 1",
      );

      const summaryBox = await totalSummary.boundingBox();
      const toggleBox = await viewToggle.boundingBox();
      expect(summaryBox).not.toBeNull();
      expect(toggleBox).not.toBeNull();
      expect(summaryBox?.x || 0).toBeLessThan(toggleBox?.x || 0);
      expect(toggleBox?.height || 0).toBeGreaterThanOrEqual(34);
      expect(toggleBox?.height || 0).toBeLessThanOrEqual(44);

      await tableToggle.focus();
      await expect(tableToggle).toBeFocused();
      expect(
        await tableToggle.evaluate(
          (element) => getComputedStyle(element).boxShadow,
        ),
      ).not.toBe("none");

      if (viewportWidth < 768) {
        await expect(page.getByTestId("resource-card-grid")).toBeVisible();
        await expect(page.getByTestId("desktop-data-table")).toHaveCount(0);
        await expect(viewSurface).not.toHaveClass(/bg-body-emphasis/);
        expect(
          await viewSurface.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
          ),
        ).toBe("rgba(0, 0, 0, 0)");
      } else {
        await expect(page.getByTestId("desktop-data-table")).toBeVisible();
        await expect(page.getByTestId("resource-card-grid")).toHaveCount(0);
        await expect(viewSurface).toHaveClass(/bg-body-emphasis/);
        await expect(tableToggle).toHaveAttribute("aria-pressed", "true");
      }
    }

    const metrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(metrics.documentWidth).toBeLessThanOrEqual(
      metrics.viewportWidth + 1,
    );
    expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);

    if (route.path === "/categories") {
      const table = page.getByTestId("desktop-data-table");
      const grid = page.getByTestId("resource-card-grid");
      const viewSurface = page.getByTestId("list-view-surface");

      if (viewportWidth < 768) {
        await page.getByTestId("view-mode-table").click();
        await expect(table).toBeVisible();
        await expect(grid).toHaveCount(0);
        await expect(viewSurface).toHaveClass(/bg-body-emphasis/);
        await expect(page.getByTestId("view-mode-table")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await page.reload();
        await expect(table).toBeVisible();
      } else {
        await page.getByTestId("view-mode-grid").click();
        await expect(grid).toBeVisible();
        await expect(table).toHaveCount(0);
        await expect(viewSurface).not.toHaveClass(/bg-body-emphasis/);
        expect(
          await viewSurface.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
          ),
        ).toBe("rgba(0, 0, 0, 0)");
        await expect(page.getByTestId("view-mode-grid")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await page.reload();
        await expect(grid).toBeVisible();
      }

      const persistedMetrics = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
      }));
      expect(persistedMetrics.documentWidth).toBeLessThanOrEqual(
        persistedMetrics.viewportWidth + 1,
      );
      expect(persistedMetrics.bodyWidth).toBeLessThanOrEqual(
        persistedMetrics.viewportWidth + 1,
      );
    }
    expect(pageErrors).toEqual([]);
  });
}
