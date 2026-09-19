/// <reference types="vite/client" />

declare module "bootstrap/js/dist/collapse" {
  interface CollapseOptions {
    parent?: string | Element | null;
    toggle?: boolean;
  }

  export default class Collapse {
    static getOrCreateInstance(
      element: string | Element,
      config?: Partial<CollapseOptions>,
    ): Collapse;
    show(): void;
    hide(): void;
  }
}
