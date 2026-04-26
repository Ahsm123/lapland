<script lang="ts">
  import type { CliTool, ProcessResult } from '../../shared/models';
  import LibraryList from '../lib/LibraryList.svelte';
  import CliToolEditor from '../lib/CliToolEditor.svelte';

  let tools: CliTool[] = $state([]);
  let selectedId: string | null = $state(null);
  let unsavedTool: CliTool | null = $state(null);

  let versionResults: Record<string, ProcessResult> = $state({});
  let versionLoading: Record<string, boolean> = $state({});
  let updateResults: Record<string, ProcessResult> = $state({});
  let updateLoading: Record<string, boolean> = $state({});
  let checkedThisSession: Set<string> = $state(new Set());

  let selectedTool: CliTool | undefined = $derived(
    unsavedTool && selectedId === null
      ? unsavedTool
      : tools.find((t) => t.id === selectedId),
  );

  $effect(() => {
    if (selectedId !== null) {
      unsavedTool = null;
      const id = selectedId;
      if (!checkedThisSession.has(id) && !versionLoading[id]) {
        checkedThisSession.add(id);
        runCheck(id, false);
      }
    }
  });

  async function loadTools() {
    tools = await window.api.cliTools.getAll();
  }

  function handleAdd() {
    unsavedTool = { id: '', name: '', versionCommand: '', updateCommand: '' };
    selectedId = null;
  }

  async function handleSave(tool: CliTool) {
    const wasNew = !tool.id;
    const saved = await window.api.cliTools.save(tool);
    unsavedTool = null;
    await loadTools();
    selectedId = saved.id;
    if (wasNew) {
      checkedThisSession.add(saved.id);
      runCheck(saved.id, false);
    }
  }

  async function handleDelete(id: string) {
    await window.api.cliTools.remove(id);
    if (selectedId === id) selectedId = null;
    delete versionResults[id];
    delete versionLoading[id];
    delete updateResults[id];
    delete updateLoading[id];
    checkedThisSession.delete(id);
    await loadTools();
  }

  async function runCheck(id: string, force: boolean) {
    versionLoading[id] = true;
    try {
      const result = await window.api.cliTools.checkVersion(id, force);
      if (result) versionResults[id] = result;
    } finally {
      versionLoading[id] = false;
    }
  }

  async function handleCheck() {
    if (!selectedTool?.id) return;
    await runCheck(selectedTool.id, true);
  }

  async function handleUpdate() {
    if (!selectedTool?.id) return;
    const id = selectedTool.id;
    updateLoading[id] = true;
    try {
      const result = await window.api.cliTools.update(id);
      if (result) updateResults[id] = result;
      if (result && result.exitCode === 0) {
        await runCheck(id, true);
      }
    } finally {
      updateLoading[id] = false;
    }
  }

  async function handleRecheckAll() {
    await window.api.cliTools.clearCache();
    versionResults = {};
    checkedThisSession = new Set();
    for (const tool of tools) {
      checkedThisSession.add(tool.id);
      runCheck(tool.id, false);
    }
  }

  loadTools();
</script>

<div class="h-full flex">
  <div class="w-56 flex-shrink-0">
    <LibraryList
      items={tools}
      folders={[]}
      bind:selectedId
      onAdd={handleAdd}
      onDelete={handleDelete}
      onCreateFolder={() => {}}
      onDeleteFolder={() => {}}
      onMoveItem={() => {}}
    >
      {#snippet itemLabel(item)}
        {item.name || 'Untitled'}
      {/snippet}
    </LibraryList>
  </div>
  <div class="flex-1 min-w-0 flex flex-col">
    {#if tools.length > 0}
      <div class="flex justify-end px-6 pt-4">
        <button
          class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors"
          onclick={handleRecheckAll}
        >
          Re-check all
        </button>
      </div>
    {/if}
    <div class="flex-1 min-h-0">
      {#if selectedTool}
        <CliToolEditor
          tool={selectedTool}
          versionResult={versionResults[selectedTool.id] ?? null}
          versionLoading={!!versionLoading[selectedTool.id]}
          updateResult={updateResults[selectedTool.id] ?? null}
          updateLoading={!!updateLoading[selectedTool.id]}
          onSave={handleSave}
          onCheck={handleCheck}
          onUpdate={handleUpdate}
        />
      {/if}
    </div>
  </div>
</div>
