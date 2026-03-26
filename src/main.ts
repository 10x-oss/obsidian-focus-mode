import { Notice, Plugin, WorkspaceLeaf } from "obsidian";

const HIDE_CLASS = "focus-mode-hidden";
const SHOW_CLASS = "focus-mode-visible";
const ROOT_CLASS = "focus-mode-active";

export default class FocusModePlugin extends Plugin {
  private enabled = false;
  private activeLeaf: WorkspaceLeaf | null = null;
  private styleEl: HTMLStyleElement | null = null;

  async onload(): Promise<void> {
    this.ensureStyles();

    this.addCommand({
      id: "toggle-focus-mode",
      name: "Toggle focus mode",
      callback: () => {
        this.toggleFocusMode();
      },
    });

    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        if (!this.enabled) {
          return;
        }

        this.reapplyFocusMode();
      }),
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (!this.enabled || !leaf) {
          return;
        }

        this.activeLeaf = leaf;
        this.reapplyFocusMode();
      }),
    );
  }

  onunload(): void {
    this.clearFocusMode();
    this.styleEl?.remove();
    this.styleEl = null;
  }

  private toggleFocusMode(): void {
    if (this.enabled) {
      this.clearFocusMode();
      new Notice("Focus Mode: restored the normal workspace.");
      return;
    }

    const leaf = this.app.workspace.activeLeaf;

    if (!leaf?.view?.containerEl) {
      new Notice("Focus Mode: there is no active pane to focus.");
      return;
    }

    const applied = this.applyFocusMode(leaf);

    if (!applied) {
      new Notice("Focus Mode: could not determine the active pane container.");
      return;
    }

    this.enabled = true;
    this.activeLeaf = leaf;
    new Notice("Focus Mode: now focusing the active pane.");
  }

  private reapplyFocusMode(): void {
    const leaf = this.getTargetLeaf();

    if (!leaf?.view?.containerEl) {
      this.clearFocusMode();
      return;
    }

    this.clearMarkedElements();
    const applied = this.applyFocusMode(leaf);

    if (!applied) {
      this.clearFocusMode();
    }
  }

  private getTargetLeaf(): WorkspaceLeaf | null {
    if (this.activeLeaf?.view?.containerEl?.isConnected) {
      return this.activeLeaf;
    }

    return this.app.workspace.activeLeaf ?? null;
  }

  private applyFocusMode(leaf: WorkspaceLeaf): boolean {
    const { containerEl } = leaf.view;
    const body = containerEl.ownerDocument.body;
    const leafEl = containerEl.closest(".workspace-leaf");

    if (!(leafEl instanceof HTMLElement)) {
      return false;
    }

    const root = body.querySelector(".workspace");

    if (!(root instanceof HTMLElement)) {
      return false;
    }

    body.classList.add(ROOT_CLASS);
    leafEl.classList.add(SHOW_CLASS);

    let current: HTMLElement | null = leafEl;

    while (current) {
      current.classList.add(SHOW_CLASS);
      current = current.parentElement?.closest(".workspace-split, .workspace-tabs, .mod-root") ?? null;
    }

    this.hideSelectors(body, [
      ".workspace-ribbon",
      ".mobile-navbar",
      ".status-bar",
      ".titlebar",
      ".view-header",
      ".workspace-tab-header-container",
      ".workspace-sidedock-vault-profile",
      ".sidebar-toggle-button",
    ]);

    body.querySelectorAll(".workspace-leaf, .workspace-tabs, .workspace-split, .mod-root").forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }

      if (!element.classList.contains(SHOW_CLASS)) {
        element.classList.add(HIDE_CLASS);
      }
    });

    return true;
  }

  private hideSelectors(root: ParentNode, selectors: string[]): void {
    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.add(HIDE_CLASS);
        }
      });
    }
  }

  private clearFocusMode(): void {
    this.enabled = false;
    this.activeLeaf = null;
    this.clearMarkedElements();
  }

  private clearMarkedElements(): void {
    const body = document.body;

    body.classList.remove(ROOT_CLASS);
    body.querySelectorAll(`.${HIDE_CLASS}`).forEach((element) => {
      element.classList.remove(HIDE_CLASS);
    });
    body.querySelectorAll(`.${SHOW_CLASS}`).forEach((element) => {
      element.classList.remove(SHOW_CLASS);
    });
  }

  private ensureStyles(): void {
    if (this.styleEl?.isConnected) {
      return;
    }

    const styleEl = document.createElement("style");
    styleEl.id = "focus-mode-plugin-styles";
    styleEl.textContent = `
      .${HIDE_CLASS} {
        display: none !important;
      }
    `;

    document.head.appendChild(styleEl);
    this.styleEl = styleEl;
  }
}
