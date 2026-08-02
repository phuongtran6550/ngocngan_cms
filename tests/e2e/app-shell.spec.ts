import { test, expect } from "./fixtures";
import type { Locator } from "@playwright/test";

async function visibleTextX(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect().x;
  });
}

test.describe("Phoenix app shell", () => {
  test("renders the neutral default user avatar when the account has no avatar image", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/categories");

    const avatar = page
      .getByTestId("profile-trigger")
      .getByTestId("default-avatar");
    await expect(avatar).toBeVisible();

    const metrics = await avatar.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        viewBox: element.getAttribute("viewBox"),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });

    expect(metrics).toEqual({
      viewBox: "0 0 48 48",
      width: 40,
      height: 40,
    });
  });

  test("anchors the profile dropdown with Phoenix geometry", async ({
    authenticatedPage: page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");
    await page.goto("/categories");

    await page.getByTestId("profile-trigger").click();
    const metrics = await page.getByTestId("profile-menu").evaluate((menu) => {
      const trigger = document.querySelector('[data-testid="profile-trigger"]');
      if (!trigger) throw new Error("Profile trigger is missing");

      const menuRect = menu.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      return {
        width: menuRect.width,
        topGap: menuRect.top - triggerRect.bottom,
      };
    });

    expect(metrics.width).toBeGreaterThanOrEqual(292);
    expect(metrics.width).toBeLessThanOrEqual(294);
    expect(metrics.topGap).toBeGreaterThanOrEqual(7);
    expect(metrics.topGap).toBeLessThanOrEqual(9);
  });

  test("keeps the Phoenix profile dropdown inside mobile viewports", async ({
    authenticatedPage: page,
  }, testInfo) => {
    test.skip(!["mobile-390", "mobile-360"].includes(testInfo.project.name));
    await page.goto("/categories");

    await page.getByTestId("profile-trigger").click();
    const metrics = await page.getByTestId("profile-menu").evaluate((menu) => {
      const menuRect = menu.getBoundingClientRect();
      return {
        left: menuRect.left,
        right: menuRect.right,
        viewportWidth: window.innerWidth,
      };
    });

    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth);
  });

  test("keeps profile, theme, and collapse actions functional", async ({
    authenticatedPage: page,
  }, testInfo) => {
    test.skip(
      !["desktop-1440", "desktop-1280", "tablet-1024"].includes(
        testInfo.project.name,
      ),
    );
    await page.goto("/categories");

    const profileTrigger = page.getByTestId("profile-trigger");
    await expect(profileTrigger).toHaveCount(1);
    await profileTrigger.click();
    await expect(page.getByTestId("profile-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("profile-menu")).toHaveCount(0);

    await profileTrigger.click();
    await expect(page.getByTestId("profile-menu")).toBeVisible();

    const themeToggle = page.getByRole("button", {
      name: "Chuyển sang giao diện tối",
    });
    await expect(themeToggle).toHaveCount(1);
    await themeToggle.click();
    await expect
      .poll(() => page.locator("html").getAttribute("data-bs-theme"))
      .toBe("dark");

    const sidebarToggle = page.getByTestId("sidebar-toggle");
    await expect(sidebarToggle).toHaveCount(1);
    await sidebarToggle.click();
    await expect(page.getByTestId("app-shell")).toHaveClass(
      /is-sidebar-collapsed/,
    );
  });

  test("opens the mobile Phoenix drawer", async ({
    authenticatedPage: page,
  }, testInfo) => {
    test.skip(
      !["tablet-768", "mobile-390", "mobile-360"].includes(
        testInfo.project.name,
      ),
    );
    await page.goto("/categories");

    const mobileToggle = page.getByTestId("mobile-nav-toggle");
    await expect(mobileToggle).toHaveCount(1);
    await mobileToggle.click();
    await expect(page.getByTestId("mobile-nav-drawer")).toBeVisible();

    const close = page.getByTestId("mobile-nav-close");
    await expect(close).toHaveCount(1);
    await close.click();
    await expect(page.getByTestId("mobile-nav-drawer")).toHaveCount(0);
  });

  test("uses Phoenix sidebar geometry and keeps the active catalogue hierarchy aligned", async ({
    authenticatedPage: page,
  }, testInfo) => {
    test.skip(
      !["desktop-1440", "desktop-1280"].includes(testInfo.project.name),
    );
    await page.goto("/materials");

    const sidebar = page.locator("#navbarVertical");
    const catalog = sidebar.locator(
      '[aria-controls="sidebar-submenu-commerce-catalog"]',
    );
    const material = sidebar.locator('a[href="/materials"]');
    const parentText = catalog.locator(".nav-link-text");
    const childText = material.locator(".nav-link-text");
    const caret = catalog.locator(
      "svg.svg-inline--fa.fa-caret-right.dropdown-indicator-icon",
    );
    const catalogIcon = catalog.locator(".nav-link-icon > svg.cms-icon");
    await expect(material).toBeVisible();
    await expect(catalog).toHaveAttribute("aria-expanded", "true");
    const parentTextX = await visibleTextX(parentText);
    const childTextX = await visibleTextX(childText);
    const caretSize = await caret.evaluate((element) => {
      const { height, width } = element.getBoundingClientRect();
      return { height: Math.round(height), width: Math.round(width) };
    });
    const catalogIconSize = await catalogIcon.evaluate((element) => {
      const { height, width } = element.getBoundingClientRect();
      return { height: Math.round(height), width: Math.round(width) };
    });
    const metrics = await sidebar.evaluate((element) => ({
      width: Math.round(element.getBoundingClientRect().width),
      display: getComputedStyle(element).display,
      activeColor: getComputedStyle(
        element.querySelector('a[href="/materials"]')!,
      ).color,
    }));

    expect(metrics).toEqual({
      width: 254,
      display: "block",
      activeColor: "rgb(56, 116, 255)",
    });
    expect(childTextX).toBeGreaterThan(parentTextX);
    expect(caretSize.height).toBeLessThanOrEqual(16);
    expect(caretSize.width).toBeLessThanOrEqual(16);
    expect(catalogIconSize).toEqual({ height: 16, width: 16 });

    await page.getByTestId("sidebar-toggle").click();
    await expect(page.locator("html")).toHaveClass(/navbar-vertical-collapsed/);
    await expect(page.getByTestId("app-shell")).toHaveClass(
      /is-sidebar-collapsed/,
    );
  });

  test("keeps parent controls aligned with native Phoenix link rows", async ({
    authenticatedPage: page,
  }, testInfo) => {
    test.skip(
      !["desktop-1440", "desktop-1280"].includes(testInfo.project.name),
    );
    await page.goto("/materials");

    const sidebar = page.locator("nav.navbar-vertical.navbar-expand-lg");
    const catalog = sidebar.locator(
      '[aria-controls="sidebar-submenu-commerce-catalog"]',
    );
    const warehouse = sidebar.locator('a[href="/warehoused-goods"]');
    const catalogCount = await catalog.count();
    const warehouseCount = await warehouse.count();

    expect(catalogCount).toBe(1);
    expect(warehouseCount).toBe(1);
    const geometry = await catalog.evaluate((parent) => {
      const sibling = document.querySelector(
        'nav.navbar-vertical a[href="/warehoused-goods"]',
      );
      if (!sibling) throw new Error("Warehouse link is missing");

      const parentRect = parent.getBoundingClientRect();
      const linkRect = sibling.getBoundingClientRect();
      return {
        parentLeft: Math.round(parentRect.left),
        parentRight: Math.round(parentRect.right),
        linkLeft: Math.round(linkRect.left),
        linkRight: Math.round(linkRect.right),
        parentDisplay: getComputedStyle(parent).display,
        parentBackground: getComputedStyle(parent).backgroundColor,
      };
    });

    expect(geometry.parentDisplay).toBe("block");
    expect(geometry.parentLeft).toBe(geometry.linkLeft);
    expect(geometry.parentRight).toBe(geometry.linkRight);
    expect(geometry.parentBackground).toBe("rgba(0, 0, 0, 0)");
  });

  test("expands the catalogue and closes the mobile drawer after child navigation", async ({
    authenticatedPage: page,
  }, testInfo) => {
    test.skip(
      !["tablet-768", "mobile-390", "mobile-360"].includes(
        testInfo.project.name,
      ),
    );
    await page.goto("/dashboard");
    await page.getByTestId("mobile-nav-toggle").click();

    const drawer = page.getByTestId("mobile-nav-drawer");
    const catalog = drawer.locator(
      '[aria-controls="sidebar-submenu-commerce-catalog"]',
    );
    await catalog.click();
    await expect(catalog).toHaveAttribute("aria-expanded", "true");
    await drawer.locator('a[href="/categories"]').click();
    await expect(page).toHaveURL(/\/categories$/);
    await expect(page.getByTestId("mobile-nav-drawer")).toHaveCount(0);
  });

  test("applies global search to the current searchable page", async ({
    authenticatedPage: page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440");
    await page.goto("/categories");

    const listRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname.endsWith("/api/categories") &&
        url.searchParams.get("query") === "nhẫn cưới"
      );
    });
    const search = page.getByRole("search").getByRole("searchbox");
    await search.fill("  nhẫn cưới  ");
    await search.press("Enter");

    await listRequest;
    const url = new URL(page.url());
    expect(url.pathname).toBe("/categories");
    expect(url.searchParams.get("query")).toBe("nhẫn cưới");
  });
});
