<script lang="ts">
  import type { Script } from '../../shared/models';

  let {
    scripts,
    selectedId = $bindable(),
    onAdd,
    onDelete,
  }: {
    scripts: Script[];
    selectedId: string | null;
    onAdd: () => void;
    onDelete: (id: string) => void;
  } = $props();
</script>

<div class="h-full flex flex-col border-r border-neutral-700/50">
  <div class="flex-1 overflow-y-auto">
    {#if scripts.length === 0}
      <div class="px-4 py-8 text-center text-sm text-neutral-500">
        No scripts yet
      </div>
    {:else}
      <ul class="py-1">
        {#each scripts as script}
          <li>
            <button
              class="w-full text-left px-4 py-2 text-sm transition-colors
                {script.id === selectedId
                  ? 'bg-neutral-700/50 text-white'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}"
              onclick={() => selectedId = script.id}
            >
              {script.name || 'Untitled'}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  <div class="flex border-t border-neutral-700/50">
    <button
      class="flex-1 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
      onclick={onAdd}
      title="New Script"
    >+</button>
    <button
      class="flex-1 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border-l border-neutral-700/50
        {selectedId ? '' : 'opacity-30 pointer-events-none'}"
      onclick={() => { if (selectedId) onDelete(selectedId); }}
      title="Delete Script"
    >−</button>
  </div>
</div>
