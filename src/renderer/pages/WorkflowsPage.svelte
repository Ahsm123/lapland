<script lang="ts">
  import type { Workflow, Script } from '../../shared/models';
  import LibraryList from '../lib/LibraryList.svelte';
  import WorkflowEditor from '../lib/WorkflowEditor.svelte';
  import WorkflowRunView from '../lib/WorkflowRunView.svelte';
  import ConfirmDialog from '../lib/ConfirmDialog.svelte';

  let workflows: Workflow[] = $state([]);
  let scripts: Script[] = $state([]);
  let folders: string[] = $state([]);
  let selectedId: string | null = $state(null);
  let showConfirm = $state(false);
  let skipConfirm = $state(false);
  let pendingDeleteId: string | null = $state(null);
  let unsavedWorkflow: Workflow | null = $state(null);
  let mode: 'edit' | 'run' = $state('edit');

  let selectedWorkflow: Workflow | undefined = $derived(
    unsavedWorkflow && selectedId === null
      ? unsavedWorkflow
      : workflows.find((w) => w.id === selectedId),
  );

  $effect(() => {
    if (selectedId !== null) {
      unsavedWorkflow = null;
      mode = 'edit';
    }
  });

  async function loadWorkflows() {
    workflows = await window.api.workflows.getAll();
  }

  async function loadScripts() {
    scripts = await window.api.scripts.getAll();
  }

  async function loadFolders() {
    folders = await window.api.folders.getAll('workflows');
  }

  function handleAdd() {
    unsavedWorkflow = { id: '', name: '', version: 0, steps: [] };
    selectedId = null;
    mode = 'edit';
  }

  async function handleSave(workflow: Workflow) {
    try {
      const saved = await window.api.workflows.save(workflow);
      unsavedWorkflow = null;
      await loadWorkflows();
      selectedId = saved.id;
    } catch (e: any) {
      alert(e.message);
    }
  }

  function handleRun() {
    mode = 'run';
  }

  function handleBackToEdit() {
    mode = 'edit';
  }

  function handleDelete(id: string) {
    pendingDeleteId = id;
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
      await window.api.workflows.delete(pendingDeleteId);
      if (selectedId === pendingDeleteId) {
        selectedId = null;
        mode = 'edit';
      }
      pendingDeleteId = null;
      await loadWorkflows();
    }
  }

  function cancelDelete() {
    showConfirm = false;
    pendingDeleteId = null;
  }

  async function handleCreateFolder(name: string) {
    folders = await window.api.folders.create('workflows', name);
  }

  async function handleDeleteFolder(name: string) {
    const inFolder = workflows.filter((w) => w.folder === name);
    for (const w of inFolder) {
      await window.api.workflows.setFolder(w.id, '');
    }
    folders = await window.api.folders.remove('workflows', name);
    await loadWorkflows();
  }

  async function handleMoveItem(id: string, folder: string) {
    await window.api.workflows.setFolder(id, folder);
    await loadWorkflows();
  }

  loadWorkflows();
  loadScripts();
  loadFolders();
</script>

<div class="h-full flex">
  <div class="w-56 flex-shrink-0">
    <LibraryList
      items={workflows}
      {folders}
      bind:selectedId
      onAdd={handleAdd}
      onDelete={handleDelete}
      onCreateFolder={handleCreateFolder}
      onDeleteFolder={handleDeleteFolder}
      onMoveItem={handleMoveItem}
    >
      {#snippet itemLabel(item)}
        {@const workflow = workflows.find((w) => w.id === item.id)}
        <span class="truncate">{item.name || 'Untitled'}</span>
        {#if workflow}
          <span class="text-[10px] text-neutral-600 flex-shrink-0 ml-auto">v{workflow.version}</span>
        {/if}
      {/snippet}
    </LibraryList>
  </div>
  <div class="flex-1 min-w-0">
    {#if selectedWorkflow && mode === 'run'}
      <WorkflowRunView workflow={selectedWorkflow} {scripts} onBack={handleBackToEdit} />
    {:else if selectedWorkflow}
      <WorkflowEditor workflow={selectedWorkflow} {scripts} onSave={handleSave} onRun={handleRun} />
    {/if}
  </div>
</div>

{#if showConfirm}
  <ConfirmDialog
    message="Are you sure you want to delete this workflow?"
    onConfirm={confirmDelete}
    onCancel={cancelDelete}
  />
{/if}
