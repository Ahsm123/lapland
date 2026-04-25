<script lang="ts">
  import type { Script, Workflow } from '../../shared/models';
  import LibraryList from '../lib/LibraryList.svelte';
  import ScriptEditor from '../lib/ScriptEditor.svelte';
  import ScriptRunView from '../lib/ScriptRunView.svelte';
  import ConfirmDialog from '../lib/ConfirmDialog.svelte';

  let scripts: Script[] = $state([]);
  let folders: string[] = $state([]);
  let selectedId: string | null = $state(null);
  let showConfirm = $state(false);
  let skipConfirm = $state(false);
  let pendingDeleteId: string | null = $state(null);
  let unsavedScript: Script | null = $state(null);
  let mode: 'edit' | 'run' = $state('edit');
  let confirmMessage = $state('Are you sure you want to delete this script?');

  let selectedScript: Script | undefined = $derived(
    unsavedScript && selectedId === null
      ? unsavedScript
      : scripts.find((s) => s.id === selectedId),
  );

  // Clear unsaved script and reset mode when user selects an existing script
  $effect(() => {
    if (selectedId !== null) {
      unsavedScript = null;
      mode = 'edit';
    }
  });

  async function loadScripts() {
    scripts = await window.api.scripts.getAll();
  }

  async function loadFolders() {
    folders = await window.api.folders.getAll('scripts');
  }

  function handleAdd() {
    unsavedScript = { id: '', name: '', content: '' };
    selectedId = null;
    mode = 'edit';
  }

  async function handleSave(script: Script) {
    const saved = await window.api.scripts.save(script);
    unsavedScript = null;
    await loadScripts();
    selectedId = saved.id;
  }

  function handleRun() {
    mode = 'run';
  }

  function handleBackToEdit() {
    mode = 'edit';
  }

  async function handleDelete(id: string) {
    pendingDeleteId = id;
    const refs = await window.api.scripts.referencingWorkflows(id);
    if (refs.length > 0) {
      const names = refs.map((w: Workflow) => w.name).join(', ');
      confirmMessage = `This script is used by: ${names}. Deleting it will break those workflows. Continue?`;
    } else {
      confirmMessage = 'Are you sure you want to delete this script?';
    }
    if (skipConfirm) {
      confirmDelete(false);
    } else {
      showConfirm = true;
    }
  }

  async function confirmDelete(dontShowAgain: boolean) {
    if (dontShowAgain) skipConfirm = true;
    showConfirm = false;

    if (pendingDeleteId) {
      await window.api.scripts.delete(pendingDeleteId);
      if (selectedId === pendingDeleteId) {
        selectedId = null;
        mode = 'edit';
      }
      pendingDeleteId = null;
      await loadScripts();
    }
  }

  function cancelDelete() {
    showConfirm = false;
    pendingDeleteId = null;
  }

  async function handleCreateFolder(name: string) {
    folders = await window.api.folders.create('scripts', name);
  }

  async function handleDeleteFolder(name: string) {
    // Move items out of the folder first
    const inFolder = scripts.filter((s) => s.folder === name);
    for (const s of inFolder) {
      await window.api.scripts.setFolder(s.id, '');
    }
    folders = await window.api.folders.remove('scripts', name);
    await loadScripts();
  }

  async function handleMoveItem(id: string, folder: string) {
    await window.api.scripts.setFolder(id, folder);
    await loadScripts();
  }

  loadScripts();
  loadFolders();
</script>

<div class="h-full flex">
  <div class="w-56 flex-shrink-0">
    <LibraryList
      items={scripts}
      {folders}
      bind:selectedId
      onAdd={handleAdd}
      onDelete={handleDelete}
      onCreateFolder={handleCreateFolder}
      onDeleteFolder={handleDeleteFolder}
      onMoveItem={handleMoveItem}
    >
      {#snippet itemLabel(item)}
        {item.name || 'Untitled'}
      {/snippet}
    </LibraryList>
  </div>
  <div class="flex-1 min-w-0">
    {#if selectedScript && mode === 'run'}
      <ScriptRunView script={selectedScript} onBack={handleBackToEdit} />
    {:else if selectedScript}
      <ScriptEditor script={selectedScript} onSave={handleSave} onRun={handleRun} />
    {/if}
  </div>
</div>

{#if showConfirm}
  <ConfirmDialog
    message={confirmMessage}
    onConfirm={confirmDelete}
    onCancel={cancelDelete}
  />
{/if}
