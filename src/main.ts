import { App, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from "obsidian";

const HIDE_CLASS = "focus-mode-hidden";
const SHOW_CLASS = "focus-mode-visible";

interface FocusModeSettings {
  showToggleNotices: boolean;
}

const DEFAULT_SETTINGS: FocusModeSettings = {
  showToggleNotices: false,
};

export default class FocusModePlugin extends Plugin {
  private enabled = false;
  private activeLeaf: WorkspaceLeaf | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private activeContentEl: HTMLElement | null = null;
  private activeDocument: Document | null = null;
  private settings: FocusModeSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.ensureStyles();
    this.addSettingTab(new FocusModeSettingTab(this.app, this));

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
      this.showToggleNotice("Focus Mode: restored the normal workspace.");
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
    this.showToggleNotice("Focus Mode: now focusing the active pane.");
  }

  async loadSettings(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData()),
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  getSettings(): FocusModeSettings {
    return this.settings;
  }

  async updateSettings(settings: Partial<FocusModeSettings>): Promise<void> {
    this.settings = {
      ...this.settings,
      ...settings,
    };
    await this.saveSettings();
  }

  private showToggleNotice(message: string): void {
    if (!this.settings.showToggleNotices) {
      return;
    }

    new Notice(message);
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
    const contentEl = this.getContentElement(leaf);

    if (!(contentEl instanceof HTMLElement)) {
      return false;
    }

    const ownerDocument = contentEl.ownerDocument;
    const body = ownerDocument.body;

    this.activeContentEl = contentEl;
    this.activeDocument = ownerDocument;
    contentEl.style.marginTop = "0px";

    let current: HTMLElement | null = contentEl;
    let split: HTMLElement | null = contentEl;

    while (split && !split.classList.contains("workspace-split")) {
      current.classList.add(SHOW_CLASS);
      current = split;
      split = split.parentElement;
    }

    if (current) {
      current.classList.add(SHOW_CLASS);
      current
        .querySelectorAll(`div.workspace-split:not(.${SHOW_CLASS})`)
        .forEach((element) => {
          if (element instanceof HTMLElement && element !== current) {
            element.classList.add(SHOW_CLASS);
          }
        });
      current
        .querySelector(`div.workspace-leaf-content.${SHOW_CLASS} > .view-header`)
        ?.classList.add(SHOW_CLASS);
      current
        .querySelectorAll(`div.workspace-tab-container.${SHOW_CLASS} > div.workspace-leaf:not(.${SHOW_CLASS})`)
        .forEach((element) => {
          if (element instanceof HTMLElement) {
            element.classList.add(SHOW_CLASS);
          }
        });
      current
        .querySelectorAll(`div.workspace-tabs.${SHOW_CLASS} > div.workspace-tab-header-container`)
        .forEach((element) => {
          if (element instanceof HTMLElement) {
            element.classList.add(SHOW_CLASS);
          }
        });
      current
        .querySelectorAll(`div.workspace-split.${SHOW_CLASS} > div.workspace-tabs:not(.${SHOW_CLASS})`)
        .forEach((element) => {
          if (element instanceof HTMLElement) {
            element.classList.add(SHOW_CLASS);
          }
        });
    }

    body
      .querySelectorAll(`div.workspace-split:not(.${SHOW_CLASS})`)
      .forEach((element) => {
        if (!(element instanceof HTMLElement)) {
          return;
        }

        if (element !== split) {
          element.classList.add(HIDE_CLASS);
        } else {
          element.classList.add(SHOW_CLASS);
        }
      });

    body
      .querySelector(`div.workspace-leaf-content.${SHOW_CLASS} > .view-header`)
      ?.classList.add(HIDE_CLASS);
    body
      .querySelectorAll(`div.workspace-tab-container.${SHOW_CLASS} > div.workspace-leaf:not(.${SHOW_CLASS})`)
      .forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.add(HIDE_CLASS);
        }
      });
    body
      .querySelectorAll(`div.workspace-tabs.${SHOW_CLASS} > div.workspace-tab-header-container`)
      .forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.add(HIDE_CLASS);
        }
      });
    body
      .querySelectorAll(`div.workspace-split.${SHOW_CLASS} > div.workspace-tabs:not(.${SHOW_CLASS})`)
      .forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.add(HIDE_CLASS);
        }
      });

    this.hideSelectors(body, ["div.workspace-ribbon", "div.mobile-navbar", "div.status-bar", "div.titlebar"]);

    const mobileRoot = body.querySelector(".is-mobile .workspace > .mod-root");

    if (mobileRoot instanceof HTMLElement) {
      mobileRoot.style.paddingTop = "0px";
    }

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
    const ownerDocument = this.activeDocument ?? document;
    const body = ownerDocument.body;

    body.querySelectorAll(`.${HIDE_CLASS}`).forEach((element) => {
      element.classList.remove(HIDE_CLASS);
    });
    body.querySelectorAll(`.${SHOW_CLASS}`).forEach((element) => {
      element.classList.remove(SHOW_CLASS);
    });

    const mobileRoot = body.querySelector(".is-mobile .workspace > .mod-root");

    if (mobileRoot instanceof HTMLElement) {
      mobileRoot.style.paddingTop = "";
    }

    if (this.activeContentEl) {
      this.activeContentEl.style.marginTop = "";
    }

    this.activeContentEl = null;
    this.activeDocument = null;
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

  private getContentElement(leaf: WorkspaceLeaf): HTMLElement | null {
    const view = leaf.view as WorkspaceLeaf["view"] & {
      contentEl?: HTMLElement;
    };

    if (view.contentEl instanceof HTMLElement) {
      return view.contentEl;
    }

    const fallback = view.containerEl.querySelector(".workspace-leaf-content");

    if (fallback instanceof HTMLElement) {
      return fallback;
    }

    return view.containerEl;
  }
}

class FocusModeSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: FocusModePlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Show toggle notifications")
      .setDesc("Show a notice when focus mode is enabled or disabled.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.getSettings().showToggleNotices).onChange(async (value) => {
          await this.plugin.updateSettings({ showToggleNotices: value });
        });
      });
  }
}
