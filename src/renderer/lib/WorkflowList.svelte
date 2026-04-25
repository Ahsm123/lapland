<script lang="ts">
  import type { Workflow } from '../../shared/models';

  let {
    workflows,
    selectedId = $bindable(),
    onAdd,
    onDelete,
  }: {
    workflows: Workflow[];
    selectedId: string | null;
    onAdd: () => void;
    onDelete: (id: string) => void;
  } = $props();
</script>

<div class="h-full flex flex-col border-r border-neutral-700/50">
  <div class="flex-1 overflow-y-auto">
    {#if workflows.length === 0}
      <div class="px-4 py-8 text-center text-sm text-neutral-500">
        No workflows yet
      </div>
    {:else}
      <ul class="py-1">
        {#each workflows as workflow}
          <li>
            <button
              class="w-full text-left px-4 py-2 text-sm transition-colors flex items-baseline gap-2
                {workflow.id === selectedId
                  ? 'bg-neutral-700/50 text-white'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}"
              onclick={() => selectedId = workflow.id}
            >
              <span class="truncate">{workflow.name || 'Untitled'}</span>
              <span class="text-[10px] text-neutral-600 flex-shrink-0">v{workflow.version}</span>
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
      title="New Workflow"
    >+</button>
    <button
      class="flex-1 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border-l border-neutral-700/50
        {selectedId ? '' : 'opacity-30 pointer-events-none'}"
      onclick={() => { if (selectedId) onDelete(selectedId); }}
      title="Delete Workflow"
    >−</button>
  </div>
</div>
