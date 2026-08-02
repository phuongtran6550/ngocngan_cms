import { collectPageErrors, expect, test } from "./fixtures";
import { activeRoutes } from "./route-catalog";

test.describe("active route matrix", () => {
  for (const route of activeRoutes) {
    test(`renders ${route.path}`, async ({ authenticatedPage: page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-1440");
      const pageErrors = collectPageErrors(page);

      await page.goto(route.path);

      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
      await expect(page.getByTestId("app-shell")).toBeVisible();
      await expect(page.getByText("Phoenix foundation is ready")).toHaveCount(0);
      expect(pageErrors).toEqual([]);
    });
  }
});
