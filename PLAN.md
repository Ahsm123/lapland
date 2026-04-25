### Issue 1: Project Setup ✅

Electron + TypeScript + Svelte + Tailwind + Vite scaffold:
- Main process with IPC handlers
- Preload script with typed API bridge
- Svelte renderer with Tailwind CSS
- Vitest for testing
- Shared models and parameter parser ported from C#

Acceptance criteria:
- App builds and launches
- Tests pass (9 parser tests)
- DI replaced with plain module imports + IPC

Dependencies: None

---

### Issue 2: Navigation Shell + Theme

Implement `App.svelte` with sidebar navigation:
- Sidebar with sections: Scripts, Workflows (disabled), CLI Tools (disabled), Log, Settings
- Dark/light theme toggle via Tailwind
- Minimal styling
- Placeholder pages for all sections

Acceptance criteria:
- Navigation between all pages works
- Theme switches correctly
- Disabled sections shown but not clickable
- Layout is responsive

Dependencies: 1

---

### Issue 3: Settings Service + First-Run Setup ✅

Settings model: `AppSettings` — dataDirectory

Settings service:
- Reads/writes `{appData}/Lapland/settings.json`
- Creates `{appData}/Lapland/` if it doesn't exist
- `ensureDataDirectoryExists()` creates subdirs: `scripts/`, `workflows/`, `logs/`, `config/`

First-run flow:
- On startup: check if `settings.json` exists
- If not: show folder picker dialog
- Save choice and create directory structure

Acceptance criteria:
- First launch shows folder picker
- Subsequent launches go straight to main window
- Directory structure created correctly

Dependencies: 1

---

### Issue 4: Script Repository ✅

Script model: `Script` — id, name, content

Script repository service:
- `getAll()` — reads all `.json` files in `{dataDir}/scripts/`
- `getById(id)` — reads `{dataDir}/scripts/{id}.json`
- `save(script)` — writes to `{dataDir}/scripts/{id}.json`
- `remove(id)` — deletes the file
- Auto-generates `id` via `crypto.randomUUID()` on creation

IPC handlers registered for all CRUD operations.

Acceptance criteria:
- CRUD operations work against filesystem
- IPC bridge exposes all operations to renderer

Dependencies: 3

---

### Issue 5: Parameter Parser ✅

`extractParameters(script): string[]` — finds all `{{paramName}}` via regex
`resolveScript(script, params): string` — replaces placeholders with values

Tests cover:
- No parameters
- Duplicated parameters
- PowerShell `{}` ignored
- Missing parameters leave placeholder

Acceptance criteria:
- All 9 tests pass

Dependencies: 1

---

### Issue 6: Process Runner

Process result model: `ProcessResult` — exitCode, stdout, stderr, durationMs

Process runner service:
- Starts `powershell -NoProfile -NonInteractive -Command "{script}"` via `child_process`
- Captures stdout and stderr
- Measures duration
- Supports cancellation via AbortController

Acceptance criteria:
- Can execute simple PowerShell and return output
- Cancel works
- Handles failed scripts (exit code != 0)
- stderr captured separately

Dependencies: 1

---

### Issue 7: Execution Logger

Log entry model: `ExecutionLogEntry` — timestamp, user, scriptId, scriptName, resolvedScript, parameters, exitCode, stdout, stderr, durationMs

Execution logger service:
- `logExecution(entry)` — appends JSON line to `{dataDir}/logs/YYYY-MM-DD.jsonl`
- Sensitive parameter values masked with `***` before writing
- `getEntriesByDate(date)` — reads and parses all lines from that day's file
- Append-only — existing lines never modified

TDD for masking logic.

Acceptance criteria:
- Log entry written as JSONL
- Sensitive values masked in file
- Reading log returns correct entries

Dependencies: 3

---

### Issue 8: Script List UI

Script list page + component:
- Shows all scripts in a list
- Each item: name, parameter count
- "New Script" button navigates to editor
- "Edit" and "Delete" buttons per script
- Delete shows confirmation dialog

Acceptance criteria:
- Scripts loaded from repository and displayed
- Delete removes script and updates list
- Empty state shows "No scripts yet" message

Dependencies: 2, 4

---

### Issue 9: Script Editor UI

Script editor page + component:
- Fields: Name, Content (multiline textarea)
- Live parameter detection via ParameterParser below the content field
- Save button: validates (name and content required), saves via IPC
- Works for both create and edit

Acceptance criteria:
- Parameters update live when user types `{{something}}`
- Validation prevents save without name/content
- Saved scripts appear in list

Dependencies: 5, 8

---

### Issue 10: Script Executor UI

Script executor page:
- Shows auto-generated input fields for all parameters
  - Normal: text input
  - Sensitive: password input
- Preview field showing resolved script (sensitive masked with `***`)
- "Run" button: executes via process runner, logs via execution logger
- Result display: exit code, stdout, stderr, duration
- "Cancel" button while running

Acceptance criteria:
- Input fields generated dynamically from script parameters
- Preview updates live
- Execution works and result displayed
- Log entry created with correct user and masked values
- Cancel stops running process

Dependencies: 6, 7, 9

---

### Issue 11: Execution Log UI

Log viewer page:
- Shows log entries for selected date (default: today)
- Date picker to switch days
- List: timestamp, script name, exit code (color-coded), user
- Click entry: shows details (parameters, resolved script, stdout, stderr, duration)

Acceptance criteria:
- Shows today's entries on open
- Date picker switches to other day's log
- Detail view shows all fields
- Empty day shows "No executions this day"

Dependencies: 2, 7

---

### Issue 12: Workflow Repository + Audit Logger ✅

Workflow model: `Workflow` — id, name, version, steps (WorkflowStep[])
WorkflowStep: scriptId, scriptName

Audit log model: `AuditLogEntry` — timestamp, user, action, entityType, entityId, entityName, version?

Workflow repository service:
- Same pattern as script repository for `{dataDir}/workflows/`
- Version increments on each save
- Name uniqueness enforced
- Minimum 1 step validation
- `findByScriptId()` for checking workflow references on script deletion

Audit logger service:
- Writes to `{dataDir}/logs/audit-YYYY-MM-DD.jsonl`
- Wired into script and workflow CRUD (create/update/delete)

Script deletion shows referencing workflows and requires confirmation.

Dependencies: 4

---

### Issue 13: Workflow Editor UI ✅

Workflow editor page (same layout as ScriptsPage):
- Fields: Name, version display (muted suffix)
- Step list: search-as-you-type script adder, reorder (up/down), remove
- Broken step indicator (red border) with Replace button
- Save button, Run button
- Workflows enabled in sidebar

Dependencies: 8, 12

---

### Issue 14: Workflow Executor UI + Log Updates ✅

Workflow executor page:
- Shows all steps with parameter inputs grouped per step (separate per step, not shared)
- Visual status per step: pending → running → success/failed/skipped
- "Run Workflow" button: executes steps sequentially, stops on first failure
- Expandable stdout/stderr per step after completion
- `beforeunload` warning when workflow is mid-run
- Each step logged with workflowRunId, workflowName, workflowVersion

Log page updates:
- Runs/Audit tab toggle
- Workflow runs grouped by workflowRunId as collapsible rows with sub-entries
- Audit tab showing create/update/delete events for scripts and workflows

Dependencies: 10, 13

---

### Issue 15: Script Tags & Filtering

Extend script list:
- Tags displayed as badges on each script
- Filter panel: select tags to filter
- Search includes tags

Acceptance criteria:
- Tags displayed visually
- Tag filtering works
- Combines with text search

Dependencies: 8

---

### Issue 16: Execution Log Filtering

Extend log viewer:
- Date range picker (from/to)
- Search by script name
- Filter by exit code (success/failure)

Acceptance criteria:
- Can search across multiple days
- Filters combine (date + script name + status)

Dependencies: 11

---

### Issue 17: CLI Tool Service + UI

CLI tool model: `CliTool` — name, versionCommand, updateCommand

Service:
- Reads/writes `{dataDir}/config/cli-tools.json`
- `checkVersion(tool)` — runs versionCommand via process runner
- `update(tool)` — runs updateCommand via process runner

UI:
- List of tools with name, version output, "Update" button
- "Add" dialog, "Remove" button, "Check again" button
- Enable CLI Tools section in sidebar

Acceptance criteria:
- Version commands run on page load
- Update button runs update command
- Add/remove works
- Failed commands show stderr

Dependencies: 6

---

### Issue 18: Export/Import Service

Export/import service:
- `exportScript(scriptId, filePath)` — exports as JSON
- `exportCollection(scriptIds, filePath)` — exports multiple as JSON array
- `importScripts(filePath)` — returns scripts with conflict info
- `applyImport(actions)` — executes import with user choices (skip/overwrite/rename)
- Conflicts detected on ID

Acceptance criteria:
- Export creates valid JSON
- Import detects ID conflicts
- User can choose action per conflict

Dependencies: 4

---

### Issue 19: Export/Import UI

Add to script list:
- "Export" button: select scripts → file dialog → save
- "Export all" button
- "Import" button: file dialog → show conflicts → choose action → import
- Workflow export: exports workflow + referenced scripts

Acceptance criteria:
- Export/import flow works end-to-end
- Conflict handling with UI
- Workflow import includes missing scripts

Dependencies: 12, 18
