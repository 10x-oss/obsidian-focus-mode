"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => FocusModePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var HIDE_CLASS = "focus-mode-hidden";
var SHOW_CLASS = "focus-mode-visible";
var DEFAULT_SETTINGS = {
  showToggleNotices: false
};
var FocusModePlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.enabled = false;
    this.activeLeaf = null;
    this.styleEl = null;
    this.activeContentEl = null;
    this.activeDocument = null;
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.ensureStyles();
    this.addSettingTab(new FocusModeSettingTab(this.app, this));
    this.addCommand({
      id: "toggle-focus-mode",
      name: "Toggle focus mode",
      callback: () => {
        this.toggleFocusMode();
      }
    });
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        if (!this.enabled) {
          return;
        }
        this.reapplyFocusMode();
      })
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (!this.enabled || !leaf) {
          return;
        }
        this.activeLeaf = leaf;
        this.reapplyFocusMode();
      })
    );
  }
  onunload() {
    this.clearFocusMode();
    this.styleEl?.remove();
    this.styleEl = null;
  }
  toggleFocusMode() {
    if (this.enabled) {
      this.clearFocusMode();
      this.showToggleNotice("Focus Mode: restored the normal workspace.");
      return;
    }
    const leaf = this.app.workspace.activeLeaf;
    if (!leaf?.view?.containerEl) {
      new import_obsidian.Notice("Focus Mode: there is no active pane to focus.");
      return;
    }
    const applied = this.applyFocusMode(leaf);
    if (!applied) {
      new import_obsidian.Notice("Focus Mode: could not determine the active pane container.");
      return;
    }
    this.enabled = true;
    this.activeLeaf = leaf;
    this.showToggleNotice("Focus Mode: now focusing the active pane.");
  }
  async loadSettings() {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...await this.loadData()
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  getSettings() {
    return this.settings;
  }
  async updateSettings(settings) {
    this.settings = {
      ...this.settings,
      ...settings
    };
    await this.saveSettings();
  }
  showToggleNotice(message) {
    if (!this.settings.showToggleNotices) {
      return;
    }
    new import_obsidian.Notice(message);
  }
  reapplyFocusMode() {
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
  getTargetLeaf() {
    if (this.activeLeaf?.view?.containerEl?.isConnected) {
      return this.activeLeaf;
    }
    return this.app.workspace.activeLeaf ?? null;
  }
  applyFocusMode(leaf) {
    const contentEl = this.getContentElement(leaf);
    if (!(contentEl instanceof HTMLElement)) {
      return false;
    }
    const ownerDocument = contentEl.ownerDocument;
    const body = ownerDocument.body;
    this.activeContentEl = contentEl;
    this.activeDocument = ownerDocument;
    contentEl.style.marginTop = "0px";
    let current = contentEl;
    let split = contentEl;
    while (split && !split.classList.contains("workspace-split")) {
      current.classList.add(SHOW_CLASS);
      current = split;
      split = split.parentElement;
    }
    if (current) {
      current.classList.add(SHOW_CLASS);
      current.querySelectorAll(`div.workspace-split:not(.${SHOW_CLASS})`).forEach((element) => {
        if (element instanceof HTMLElement && element !== current) {
          element.classList.add(SHOW_CLASS);
        }
      });
      current.querySelector(`div.workspace-leaf-content.${SHOW_CLASS} > .view-header`)?.classList.add(SHOW_CLASS);
      current.querySelectorAll(`div.workspace-tab-container.${SHOW_CLASS} > div.workspace-leaf:not(.${SHOW_CLASS})`).forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.add(SHOW_CLASS);
        }
      });
      current.querySelectorAll(`div.workspace-tabs.${SHOW_CLASS} > div.workspace-tab-header-container`).forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.add(SHOW_CLASS);
        }
      });
      current.querySelectorAll(`div.workspace-split.${SHOW_CLASS} > div.workspace-tabs:not(.${SHOW_CLASS})`).forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.add(SHOW_CLASS);
        }
      });
    }
    body.querySelectorAll(`div.workspace-split:not(.${SHOW_CLASS})`).forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }
      if (element !== split) {
        element.classList.add(HIDE_CLASS);
      } else {
        element.classList.add(SHOW_CLASS);
      }
    });
    body.querySelector(`div.workspace-leaf-content.${SHOW_CLASS} > .view-header`)?.classList.add(HIDE_CLASS);
    body.querySelectorAll(`div.workspace-tab-container.${SHOW_CLASS} > div.workspace-leaf:not(.${SHOW_CLASS})`).forEach((element) => {
      if (element instanceof HTMLElement) {
        element.classList.add(HIDE_CLASS);
      }
    });
    body.querySelectorAll(`div.workspace-tabs.${SHOW_CLASS} > div.workspace-tab-header-container`).forEach((element) => {
      if (element instanceof HTMLElement) {
        element.classList.add(HIDE_CLASS);
      }
    });
    body.querySelectorAll(`div.workspace-split.${SHOW_CLASS} > div.workspace-tabs:not(.${SHOW_CLASS})`).forEach((element) => {
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
  hideSelectors(root, selectors) {
    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((element) => {
        if (element instanceof HTMLElement) {
          element.classList.add(HIDE_CLASS);
        }
      });
    }
  }
  clearFocusMode() {
    this.enabled = false;
    this.activeLeaf = null;
    this.clearMarkedElements();
  }
  clearMarkedElements() {
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
  ensureStyles() {
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
  getContentElement(leaf) {
    const view = leaf.view;
    if (view.contentEl instanceof HTMLElement) {
      return view.contentEl;
    }
    const fallback = view.containerEl.querySelector(".workspace-leaf-content");
    if (fallback instanceof HTMLElement) {
      return fallback;
    }
    return view.containerEl;
  }
};
var FocusModeSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Show toggle notifications").setDesc("Show a notice when focus mode is enabled or disabled.").addToggle((toggle) => {
      toggle.setValue(this.plugin.getSettings().showToggleNotices).onChange(async (value) => {
        await this.plugin.updateSettings({ showToggleNotices: value });
      });
    });
  }
};
