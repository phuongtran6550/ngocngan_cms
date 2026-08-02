import { test, expect } from "./fixtures";

test("keeps global Phoenix styles stable across route changes", async ({ authenticatedPage: page }) => {
  const documentRequests: string[] = [];
  const stylesheetRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") documentRequests.push(request.url());
    if (request.resourceType() === "stylesheet") stylesheetRequests.push(request.url());
  });

  await page.goto("/categories");
  const before = await page.evaluate(() => ({
    styles: document.styleSheets.length,
    styleHrefs: [...document.styleSheets].map((sheet) => sheet.href),
    shell: document.querySelector('[data-testid="app-shell"]')?.getAttribute("data-spa-sentinel"),
  }));
  await page.locator('[data-testid="app-shell"]').evaluate((shell) => {
    shell.setAttribute("data-spa-sentinel", "preserved");
  });
  const documentRequestCount = documentRequests.length;
  const stylesheetRequestCount = stylesheetRequests.length;

  await page.getByTestId("profile-trigger").click();
  await page.getByTestId("profile-link").click();
  await expect(page).toHaveURL(/\/profile$/);
  const after = await page.evaluate(() => ({
    styles: document.styleSheets.length,
    styleHrefs: [...document.styleSheets].map((sheet) => sheet.href),
    shell: document.querySelector('[data-testid="app-shell"]')?.getAttribute("data-spa-sentinel"),
  }));

  expect(after.styles).toBe(before.styles);
  expect(after.styleHrefs).toEqual(before.styleHrefs);
  expect(after.shell).toBe("preserved");
  expect(documentRequests).toHaveLength(documentRequestCount);
  expect(stylesheetRequests).toHaveLength(stylesheetRequestCount);
});
