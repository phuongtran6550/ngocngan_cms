import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../src",
);

const vueOwnedDropdowns = [
  "components/Table/RowActionMenu.vue",
  "components/Table/FieldSelector.vue",
  "views/Account/components/ProfileMenu.vue",
];

describe("Phoenix interaction contract", () => {
  it.each(vueOwnedDropdowns)(
    "centralizes dismissal behavior for %s",
    (file) => {
      const source = readFileSync(resolve(sourceRoot, file), "utf8");

      expect(source).toContain('"@/components/dropdown/behavior"');
      expect(source).toContain("createDropdownBehavior(");
      expect(source).not.toContain('document.addEventListener("click"');
      expect(source).not.toContain('document.addEventListener("keydown"');
    },
  );

  it("renders the Template2-native Phoenix sidebar disclosure contract", () => {
    const sidebarSource = readFileSync(
      resolve(sourceRoot, "components/app/Sidebar.vue"),
      "utf8",
    );
    const itemSource = readFileSync(
      resolve(sourceRoot, "components/app/SidebarNavItem.vue"),
      "utf8",
    );

    expect(itemSource).toContain('class="nav-link dropdown-indicator"');
    expect(itemSource).toContain(':class="[`label-${level}`');
    expect(itemSource).toContain('class="dropdown-indicator-icon-wrapper"');
    expect(itemSource).toContain(
      'class="svg-inline--fa fa-caret-right dropdown-indicator-icon"',
    );
    expect(itemSource).toContain('data-prefix="fas"');
    expect(itemSource).toContain('data-icon="caret-right"');
    expect(itemSource).toContain('data-fa-i2svg=""');
    expect(itemSource).toContain('viewBox="0 0 256 512"');
    expect(itemSource).toContain('class="parent-wrapper"');
    expect(itemSource).toContain('class="nav collapse parent"');
    expect(itemSource).toContain('class="collapsed-nav-item-title d-none"');
    expect(itemSource).toContain('class="nav-link-text"');
    expect(itemSource).toContain('role="button"');
    expect(itemSource).toContain('data-bs-toggle="collapse"');
    expect(itemSource).toContain('aria-expanded="false"');
    expect(sidebarSource).toContain(
      'import Collapse from "bootstrap/js/dist/collapse"',
    );
    expect(`${sidebarSource}\n${itemSource}`).not.toContain(
      "toggleEntry(entry)",
    );
    expect(`${sidebarSource}\n${itemSource}`).not.toContain(
      "isExpanded(entry)",
    );
    expect(`${sidebarSource}\n${itemSource}`).not.toContain(':class="{ show:');
    expect(`${sidebarSource}\n${itemSource}`).not.toContain('name="chevron"');
    expect(`${sidebarSource}\n${itemSource}`).not.toContain(
      'class="nav collapse-inner"',
    );
  });
});
