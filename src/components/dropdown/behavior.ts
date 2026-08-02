import { markRaw } from "vue";

type DropdownRoot = () => HTMLElement | HTMLElement[] | undefined;
type DropdownDismiss = () => void;

export class DropdownBehavior {
  constructor(
    private readonly root: DropdownRoot,
    private readonly dismiss: DropdownDismiss,
  ) {}

  mount(): void {
    document.addEventListener("click", this.onDocumentClick);
    document.addEventListener("keydown", this.onKeydown);
  }

  dispose(): void {
    document.removeEventListener("click", this.onDocumentClick);
    document.removeEventListener("keydown", this.onKeydown);
  }

  private onDocumentClick = (event: MouseEvent): void => {
    const rootElements = this.root();
    if (!rootElements) return;

    const elements = Array.isArray(rootElements) ? rootElements : [rootElements];
    const isInside = elements.some(el => el && el.contains(event.target as Node));
    
    if (!isInside) {
      this.dismiss();
    }
  };

  private onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || !this.root()) return;
    event.preventDefault();
    this.dismiss();
  };
}

export function createDropdownBehavior(
  root: DropdownRoot,
  dismiss: DropdownDismiss,
): DropdownBehavior {
  return markRaw(new DropdownBehavior(root, dismiss));
}
