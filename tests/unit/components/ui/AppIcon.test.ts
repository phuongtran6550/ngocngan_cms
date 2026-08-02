import { mount } from "@vue/test-utils";
import AppIcon from "@/components/ui/AppIcon.vue";

describe("AppIcon", () => {
  it("renders the route-declared tag glyph instead of the grid fallback", () => {
    const tag = mount(AppIcon, { props: { name: "tag" } });
    const grid = mount(AppIcon, { props: { name: "grid" } });

    expect(tag.html()).not.toBe(grid.html());
    expect(tag.get("svg").attributes("viewBox")).toBe("0 0 24 24");
  });

  it("renders a dedicated settings glyph instead of the grid fallback", () => {
    const settings = mount(AppIcon, { props: { name: "settings" } });
    const grid = mount(AppIcon, { props: { name: "grid" } });

    expect(settings.html()).not.toBe(grid.html());
    expect(settings.findAll("circle")).toHaveLength(1);
  });

  it("renders a dedicated jewelry gem glyph instead of the grid fallback", () => {
    const gem = mount(AppIcon, { props: { name: "gem" } });
    const grid = mount(AppIcon, { props: { name: "grid" } });

    expect(gem.html()).not.toBe(grid.html());
    expect(gem.findAll("path")).toHaveLength(4);
    expect(gem.findAll("path")[0].attributes("d")).toBe(
      "M6 3h12l4 6-10 13L2 9Z",
    );
  });
});
