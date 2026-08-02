import { describe, expect, it } from "vitest";
import { navigationGroups, visibleNavigation } from "@/config/navigation";

describe("navigation configuration", () => {
  it("derives the CMS navigation from literal route metadata", () => {
    expect(navigationGroups).toEqual([
      expect.objectContaining({
        key: "overview",
        entries: [
          expect.objectContaining({ key: "dashboard", path: "/dashboard" }),
        ],
      }),
      expect.objectContaining({
        key: "commerce",
        entries: expect.arrayContaining([
          expect.objectContaining({ key: "orders", path: "/orders" }),
          expect.objectContaining({
            key: "products",
            path: "/products",
            icon: "gem",
          }),
          expect.objectContaining({
            key: "catalog",
            children: expect.arrayContaining([
              expect.objectContaining({ key: "categories", path: "/categories" }),
              expect.objectContaining({ key: "materials", path: "/materials" }),
              expect.objectContaining({ key: "patterns", path: "/patterns" }),
            ]),
          }),
        ]),
      }),
      expect.objectContaining({
        key: "system",
        entries: expect.arrayContaining([
          expect.objectContaining({ key: "roles", path: "/roles" }),
          expect.objectContaining({ key: "users", path: "/users" }),
          expect.objectContaining({ key: "settings", label: "Cài đặt", path: "/settings" }),
        ]),
      }),
    ]);

    expect(navigationGroups.flatMap((group) => group.entries)
      .some((entry) => entry.path === "/zalo")).toBe(false);
  });

  it("filters the declared navigation by the current user permissions", () => {
    expect(visibleNavigation(["dashboard.view"])).toEqual([
      expect.objectContaining({ key: "dashboard", path: "/dashboard" }),
    ]);
  });

  it("declares Danh mục as one Phoenix parent navigation item with three resource pages", () => {
    const commerce = navigationGroups.find((group) => group.key === "commerce");
    const catalog = commerce?.entries.find((entry) => entry.key === "catalog");

    expect(catalog).toMatchObject({
      label: "Danh mục",
      icon: "tag",
      children: [
        { key: "categories", label: "Danh mục", path: "/categories" },
        { key: "materials", label: "Chất liệu", path: "/materials" },
        { key: "patterns", label: "Mẫu", path: "/patterns" },
      ],
    });
  });
});
