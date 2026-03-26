# Focus Mode

Focus Mode is a tiny Obsidian plugin that brings an Excalidraw-style distraction-free view to any active pane.

It is designed for the exact workflow where you want to focus on a markdown note, canvas, PDF, or other pane without needing to enter Excalidraw first.

## Features

- Global `Toggle focus mode` command
- Works from any active pane, not only Excalidraw
- Hides sidebars, ribbons, tab headers, status bar, and other panes
- Cleans up automatically if the plugin is disabled or reloaded

## Local development

```bash
cd /Users/10x/dev/projects/oss/obsidian-focus-mode
npm install
npm run build
```

For watch mode:

```bash
npm run dev
```

## Install in a local vault

Build the plugin, then copy these files into:

```text
<your-vault>/.obsidian/plugins/focus-mode/
  main.js
  manifest.json
  versions.json
```

Then enable `Focus Mode` in `Settings -> Community plugins`.

## Usage

Run the command:

- `Focus Mode: Toggle focus mode`

Assign a hotkey in Obsidian if you want instant fullscreen-style focus from anywhere.

## Notes

- Focus mode is visual only. It does not move or change your notes.
- Toggling the command again restores the normal workspace layout.
