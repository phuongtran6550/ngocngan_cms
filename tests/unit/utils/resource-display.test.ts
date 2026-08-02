import { resourceStatusClass, resourceStatusLabel } from "@/utils/resource-display";

describe("order status display", () => {
  it.each([
    ["draft", "Chờ bổ sung", "badge-phoenix-warning"],
    ["completed", "Hoàn tất", "badge-phoenix-success"],
    ["returned", "Đã đổi trả", "badge-phoenix-info"],
    ["cancelled", "Đã hủy", "badge-phoenix-danger"],
  ])("maps %s to its Phoenix label and class", (status, label, className) => {
    expect(resourceStatusLabel(status)).toBe(label);
    expect(resourceStatusClass(status)).toBe(className);
  });
});
