# LAPLAND

Description:

A desktop app for managing, executing, and sharing parameterized PowerShell scripts with workflow orchestration and audit logging.

Techstack:

* Electron + TypeScript
* Svelte (renderer UI)
* Tailwind CSS
* Vite (bundler via Electron Forge)
* Vitest (testing)
* JSON files for storage

Architecture:

```
src/
├── main/             # Electron main process (Node.js)
│   ├── services/     # Business logic (file I/O, settings, process runner)
│   ├── ipc/          # IPC handlers (bridge between renderer and services)
│   └── index.ts      # Entry point
├── preload/          # Preload script (secure IPC bridge via contextBridge)
│   └── index.ts
├── renderer/         # Svelte UI
│   ├── lib/          # Reusable components, stores
│   ├── pages/        # Page components (ScriptList, ScriptEditor, etc.)
│   ├── App.svelte    # Root component
│   └── index.ts      # Renderer entry
└── shared/           # Code shared between main and renderer
    ├── models/       # TypeScript interfaces (Script, AppSettings, etc.)
    └── parsing/      # Parameter parser
tests/                # Vitest tests
```

Key patterns:
- **Main process** owns all file I/O and system access
- **Renderer** communicates via IPC through the preload bridge (`window.api`)
- **Shared** code (models, parser) is pure TypeScript with no Electron/Node dependencies
- Services are plain modules (not classes), imported directly in IPC handlers

---

Data:

- Scripts and workflows are stored as individual JSON files in `{dataDirectory}/scripts/` and `{dataDirectory}/workflows/`.
- CLI tools are stored as individual JSON files in `{dataDirectory}/cli-tools/`.
- Execution logs are append-only JSONL, one file per day in `{dataDirectory}/logs/`.
- App settings live in `{appData}/Lapland/settings.json`, user picks `dataDirectory` on first launch.

Rules:

- Parameters are detected from {{doubleCurly}} in script strings.
- Sensitive parameters render as password fields and are masked in logs, preview, and export.
- Workflows execute steps top to bottom, stop on first failure, no parameter forwarding between steps.
- Log files are never modified after write. User sourced from `os.userInfo().username`.

---

## Key Design Decisions

- No database — all state is JSON files in a user-chosen directory
- Parameter parsing via regex `\{\{(\w+)\}\}` on the script string (double curly to avoid collisions with PowerShell syntax)
- Append-only logging — log files are never modified, one per day (JSONL format)
- Single-user — no auth system, OS username used for audit trail
- Export/import for sharing scripts and collections
- Sensitive masking — any parameter marked `sensitive: true` is masked in log, preview, and export
- IPC boundary — renderer never touches the filesystem directly, everything goes through preload → main

---

## Design

- Apple/macOS aesthetics — clean, minimal, generous whitespace, SF-style typography feel. Think Notes.app, Xcode sidebar patterns.
- Muted neutral palette — all UI stays in the grey/neutral family. No loud colours.
  - Buttons: `bg-neutral-700`, `text-neutral-200`, small (`text-xs`, `py-1`, `px-3`), rounded-md, hover lightens to `neutral-600`
  - Destructive actions: muted red (`red-900/60`, `text-red-200`), never bright red
  - Input focus: `border-neutral-500`, no blue focus rings
  - List selection: subtle `neutral-700/50` background, not blue highlight
  - Text hierarchy: labels `text-neutral-400 uppercase tracking-wider text-xs`, content `text-neutral-300`, active `text-white`
- Keep interactive elements compact — buttons should feel lightweight, not chunky.

---

## Coding Standards

- YAGNI first — only add properties, classes, and abstractions when they are needed right now. Do not build for hypothetical future requirements. Do not pre-build model fields, methods, or interfaces for upcoming issues — add them when the issue that needs them is being worked on.
- Use async/await for all I/O operations (file access, process execution)
- Services in `src/main/services/` are plain exported functions, not classes
- All file I/O happens in the main process, never in the renderer
- IPC handlers in `src/main/ipc/` are the only bridge between renderer and main
- Shared code in `src/shared/` must be pure TypeScript (no Node.js or Electron imports)
- Use Vitest for testing. TDD for non-trivial logic (parsers, process runner, execution logger, import/export conflict detection). Skip TDD for simple CRUD and straightforward UI wiring.
- Implement one module/feature at a time, not entire layers. Each issue in PLAN.md is atomic — complete it fully before moving on.
- Commit messages follow: `category(subject): Action`. Category: feat/fix/refactor/test/docs. Subject: core/app/services or specific file. Action: Add/Delete/Update. Optional body, nothing more.
