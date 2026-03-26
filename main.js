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
var ROOT_CLASS = "focus-mode-active";
var FocusModePlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.enabled = false;
    this.activeLeaf = null;
  }
  async onload() {
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
  }
  toggleFocusMode() {
    if (this.enabled) {
      this.clearFocusMode();
      new import_obsidian.Notice("Focus Mode: restored the normal workspace.");
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
    new import_obsidian.Notice("Focus Mode: now focusing the active pane.");
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
    let current = leafEl;
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
      ".sidebar-toggle-button"
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
    const body = document.body;
    body.classList.remove(ROOT_CLASS);
    body.querySelectorAll(`.${HIDE_CLASS}`).forEach((element) => {
      element.classList.remove(HIDE_CLASS);
    });
    body.querySelectorAll(`.${SHOW_CLASS}`).forEach((element) => {
      element.classList.remove(SHOW_CLASS);
    });
  }
};
