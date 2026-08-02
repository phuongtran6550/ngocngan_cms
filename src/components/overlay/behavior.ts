import { markRaw } from "vue";

type OverlayDismiss = () => void;

const activeOverlays: OverlayBehavior[] = [];
let lockedOverlayCount = 0;
let bodyAlreadyLocked = false;

function lockPageScroll(): void {
  if (lockedOverlayCount === 0) {
    bodyAlreadyLocked = document.body.classList.contains("modal-open");
    document.body.classList.add("modal-open");
  }
  lockedOverlayCount += 1;
}

function unlockPageScroll(): void {
  lockedOverlayCount = Math.max(lockedOverlayCount - 1, 0);
  if (lockedOverlayCount === 0 && !bodyAlreadyLocked) {
    document.body.classList.remove("modal-open");
  }
}

export class OverlayBehavior {
  private active = false;

  constructor(private readonly dismiss: OverlayDismiss) {}

  sync(open: boolean): void {
    if (open === this.active) return;

    this.active = open;
    if (open) {
      activeOverlays.push(this);
      lockPageScroll();
      document.addEventListener("keydown", this.onKeydown);
      return;
    }

    this.release();
  }

  dispose(): void {
    if (this.active) this.release();
  }

  private release(): void {
    this.active = false;
    const index = activeOverlays.indexOf(this);
    if (index >= 0) activeOverlays.splice(index, 1);
    unlockPageScroll();
    document.removeEventListener("keydown", this.onKeydown);
  }

  private onKeydown = (event: KeyboardEvent): void => {
    const topOverlay = activeOverlays[activeOverlays.length - 1];
    if (event.key !== "Escape" || topOverlay !== this) return;
    event.preventDefault();
    this.dismiss();
  };
}

export function createOverlayBehavior(
  dismiss: OverlayDismiss,
): OverlayBehavior {
  return markRaw(new OverlayBehavior(dismiss));
}
