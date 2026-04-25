<script lang="ts">
  import type { Snippet } from 'svelte';

  type Item = { id: string; name: string; folder?: string };

  let {
    items,
    folders,
    selectedId = $bindable(),
    onAdd,
    onDelete,
    onCreateFolder,
    onDeleteFolder,
    onMoveItem,
    itemLabel,
  }: {
    items: Item[];
    folders: string[];
    selectedId: string | null;
    onAdd: () => void;
    onDelete: (id: string) => void;
    onCreateFolder: (name: string) => void;
    onDeleteFolder: (name: string) => void;
    onMoveItem: (id: string, folder: string) => void;
    itemLabel: Snippet<[Item]>;
  } = $props();

  let collapsedFolders: Set<string> = $state(new Set());
  let dragOverTarget: string | null = $state(null);
  let creatingFolder = $state(false);
  let newFolderName = $state('');
  let newFolderInput: HTMLInputElement | undefined = $state(undefined);

  let rootItems = $derived(items.filter((i) => !i.folder));

  function getItemsInFolder(folder: string) {
    return items.filter((i) => i.folder === folder);
  }

  function toggleFolder(folder: string) {
    const next = new Set(collapsedFolders);
    if (next.has(folder)) next.delete(folder);
    else next.add(folder);
    collapsedFolders = next;
  }

  // Drag and drop
  function handleDragStart(e: DragEvent, id: string) {
    e.dataTransfer!.setData('text/plain', id);
    e.dataTransfer!.effectAllowed = 'move';
  }

  function handleDragOver(e: DragEvent, target: string) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    dragOverTarget = target;
  }

  function handleDragLeave() {
    dragOverTarget = null;
  }

  function handleDrop(e: DragEvent, folder: string) {
    e.preventDefault();
    dragOverTarget = null;
    const id = e.dataTransfer!.getData('text/plain');
    if (id) onMoveItem(id, folder);
  }

  // Folder creation
  function startCreateFolder() {
    creatingFolder = true;
    newFolderName = '';
    // Focus the input after it renders
    setTimeout(() => newFolderInput?.focus(), 0);
  }

  function commitFolder() {
    const name = newFolderName.trim();
    if (name) onCreateFolder(name);
    creatingFolder = false;
    newFolderName = '';
  }

  function cancelFolder() {
    creatingFolder = false;
    newFolderName = '';
  }

  function handleFolderKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') commitFolder();
    else if (e.key === 'Escape') cancelFolder();
  }
</script>

<div class="h-full flex flex-col border-r border-neutral-700/50">
  <!-- Header -->
  <div class="px-4 py-3 border-b border-neutral-700/50">
    <h2 class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Library</h2>
  </div>

  <!-- Items -->
  <div class="flex-1 overflow-y-auto">
    <!-- Root drop zone -->
    <div
      role="list"
      ondragover={(e) => handleDragOver(e, '')}
      ondragleave={handleDragLeave}
      ondrop={(e) => handleDrop(e, '')}
      class="min-h-[8px] transition-colors {dragOverTarget === '' ? 'bg-neutral-700/30' : ''}"
    >
      {#if rootItems.length === 0 && folders.length === 0 && !creatingFolder}
        <div class="px-4 py-8 text-center text-sm text-neutral-500">
          No items yet
        </div>
      {/if}
      {#each rootItems as item (item.id)}
        <button
          class="w-full text-left px-4 py-2 text-sm transition-colors cursor-grab active:cursor-grabbing flex items-baseline gap-2
            {item.id === selectedId
              ? 'bg-neutral-700/50 text-white'
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}"
          draggable="true"
          ondragstart={(e) => handleDragStart(e, item.id)}
          onclick={() => selectedId = item.id}
        >
          {@render itemLabel(item)}
        </button>
      {/each}
    </div>

    <!-- Folders -->
    {#each folders as folder (folder)}
      {@const children = getItemsInFolder(folder)}
      <div class="mt-0.5">
        <!-- Folder header -->
        <button
          class="w-full text-left px-3 py-1.5 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors
            {dragOverTarget === folder
              ? 'bg-neutral-700/40 text-neutral-200'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'}"
          ondragover={(e) => handleDragOver(e, folder)}
          ondragleave={handleDragLeave}
          ondrop={(e) => handleDrop(e, folder)}
          onclick={() => toggleFolder(folder)}
          oncontextmenu={(e) => {
            e.preventDefault();
            onDeleteFolder(folder);
          }}
        >
          <span class="text-[10px] transition-transform {collapsedFolders.has(folder) ? '' : 'rotate-90'}"
            >&#9654;</span
          >
          {folder}
          <span class="ml-auto text-neutral-600 text-[10px] normal-case">{children.length}</span>
        </button>

        <!-- Folder contents -->
        {#if !collapsedFolders.has(folder)}
          <div
            class="transition-colors {dragOverTarget === folder ? 'bg-neutral-700/20' : ''}"
            ondragover={(e) => handleDragOver(e, folder)}
            ondragleave={handleDragLeave}
            ondrop={(e) => handleDrop(e, folder)}
          >
            {#each children as item (item.id)}
              <button
                class="w-full text-left pl-7 pr-4 py-2 text-sm transition-colors cursor-grab active:cursor-grabbing flex items-baseline gap-2
                  {item.id === selectedId
                    ? 'bg-neutral-700/50 text-white'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}"
                draggable="true"
                ondragstart={(e) => handleDragStart(e, item.id)}
                onclick={() => selectedId = item.id}
              >
                {@render itemLabel(item)}
              </button>
            {/each}
            {#if children.length === 0}
              <div
                class="pl-7 pr-4 py-2 text-xs text-neutral-600 italic"
                ondragover={(e) => handleDragOver(e, folder)}
                ondragleave={handleDragLeave}
                ondrop={(e) => handleDrop(e, folder)}
              >
                Drop items here
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}

    <!-- Inline folder creation -->
    {#if creatingFolder}
      <div class="px-3 py-1.5 flex items-center gap-1.5">
        <span class="text-[10px] text-neutral-500">&#9654;</span>
        <input
          bind:this={newFolderInput}
          bind:value={newFolderName}
          onkeydown={handleFolderKeydown}
          onblur={commitFolder}
          class="flex-1 bg-transparent border border-neutral-600 rounded px-1.5 py-0.5 text-xs text-neutral-200 outline-none focus:border-neutral-500"
          placeholder="Folder name"
        />
      </div>
    {/if}
  </div>

  <!-- Bottom toolbar -->
  <div class="flex border-t border-neutral-700/50 relative">
    <button
      class="flex-1 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
      onclick={onAdd}
      title="New Item"
    >+</button>
    <button
      class="flex-1 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border-l border-neutral-700/50"
      onclick={startCreateFolder}
      title="New Folder"
    >&#128193;</button>
    <button
      class="flex-1 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border-l border-neutral-700/50
        {selectedId ? '' : 'opacity-30 pointer-events-none'}"
      onclick={() => { if (selectedId) onDelete(selectedId); }}
      title="Delete"
    >&#8722;</button>
  </div>
</div>
