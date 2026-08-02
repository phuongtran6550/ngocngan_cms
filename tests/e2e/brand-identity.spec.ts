import { expect, test } from "./fixtures";

test("uses the Ngoc Chau burgundy for primary actions", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");

  await page.goto("/login");

  const submit = page.getByRole("button", { name: "Đăng nhập" });
  await expect(submit).toHaveCount(1);
  await expect(submit).toHaveCSS("background-color", "rgb(103, 19, 29)");
});
