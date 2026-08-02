import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cmsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sourceRoot = resolve(cmsRoot, "src");
const referenceRoot = process.env.YTPLUS_CMS_REFERENCE_ROOT;

function source(path: string): string {
  return readFileSync(resolve(sourceRoot, path), "utf8");
}

describe("YTPlus-inspired CMS DNA", () => {
  it("uses literal client and administrator route arrays", () => {
    const clientRoutes = source("router/client.ts");
    const administratorRoutes = source("router/administrator.ts");

    expect(clientRoutes).toContain("@/views/Orders/index.vue");
    expect(clientRoutes).toContain("@/views/WarehousedGoods/index.vue");
    expect(administratorRoutes).toContain("@/views/Administrator/Roles/index.vue");
    expect(administratorRoutes).toContain("@/views/Administrator/User/index.vue");
    expect(clientRoutes).not.toContain("@/views/Administrator/");
  });

  it("keeps App.vue as the protected application composition root", () => {
    const appSource = source("App.vue");

    expect(appSource).toContain("@/components/app/Header.vue");
    expect(appSource).toContain("@/components/app/Sidebar.vue");
    expect(appSource).toContain("@/components/app/Footer.vue");
    expect(appSource).toContain("<AppSidebar");
  });

  it("uses ListLayout directly for standard catalog routes", () => {
    expect(existsSync(resolve(sourceRoot, "components/ListLayout/index.vue"))).toBe(true);
    expect(existsSync(resolve(sourceRoot, "components/ListLayout/ManagedListLayout.vue"))).toBe(true);
    expect(existsSync(resolve(sourceRoot, "components/resource/ResourcePage.vue"))).toBe(false);
    expect(existsSync(resolve(sourceRoot, "components/resource/useResourceController.ts"))).toBe(true);

    for (const path of ["views/Categories/index.vue", "views/Materials/index.vue", "views/Patterns/index.vue"]) {
      expect(source(path)).toContain("@/components/ListLayout/index.vue");
      expect(source(path)).toContain("<ListLayout :resource=");
    }

    expect(existsSync(resolve(sourceRoot, "views/Categories/store.ts"))).toBe(false);
    expect(existsSync(resolve(sourceRoot, "views/Categories/service.ts"))).toBe(false);
    expect(existsSync(resolve(sourceRoot, "views/Categories/components/CatalogListPage.vue"))).toBe(false);
  });

  it("documents the real declaration architecture instead of a non-existent module registry", () => {
    const readme = readFileSync(resolve(cmsRoot, "README.md"), "utf8");

    expect(readme).toContain("src/components/ListLayout");
    expect(readme).toContain("ResourceDeclaration");
    expect(readme).not.toContain("src/app/");
    expect(readme).not.toContain("src/modules/");
    expect(readme).not.toContain("module-definitions.ts");
  });

  it.runIf(Boolean(referenceRoot))(
    "compares stable reference invariants only when its root is explicit",
    () => {
      expect(referenceRoot).toBeDefined();
      expect(existsSync(referenceRoot!)).toBe(true);
      expect(resolve(referenceRoot!)).not.toBe(cmsRoot);
      expect(existsSync(resolve(referenceRoot!, "src/request/index.ts"))).toBe(true);
      expect(existsSync(resolve(referenceRoot!, "src/components/ListLayout/index.vue"))).toBe(true);
      expect(existsSync(resolve(referenceRoot!, "src/router/administrator.ts"))).toBe(true);

      const referenceRequest = readFileSync(resolve(referenceRoot!, "src/request/index.ts"), "utf8");
      const referenceList = readFileSync(resolve(referenceRoot!, "src/components/ListLayout/index.vue"), "utf8");
      const referenceAdministratorRoutes = readFileSync(resolve(referenceRoot!, "src/router/administrator.ts"), "utf8");

      expect(referenceRequest).toContain("axios.interceptors.request.use");
      expect(source("request/index.ts")).toContain("request.interceptors.request.use");
      expect(referenceList).toContain("Datatable");
      expect(source("components/ListLayout/index.vue")).toContain("ManagedListLayout");
      expect(referenceAdministratorRoutes).toContain("path: \"/administrator\"");
      expect(source("router/administrator.ts")).toContain("const administratorRoutes");
    },
  );
});
