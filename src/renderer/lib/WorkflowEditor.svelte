<script lang="ts">
  import type { Workflow, WorkflowStep, Script } from '../../shared/models';

  let {
    workflow,
    scripts,
    onSave,
    onRun,
  }: {
    workflow: Workflow;
    scripts: Script[];
    onSave: (workflow: Workflow) => void;
    onRun: () => void;
  } = $props();

  interface KeyedStep extends WorkflowStep {
    key: number;
  }

  let nextKey = $state(workflow.steps.length);
  let name = $state(workflow.name);
  let steps: KeyedStep[] = $state(workflow.steps.map((s, i) => ({ ...s, key: i })));
  let validationError = $state('');
  let lastWorkflowId = $state(workflow.id);

  let searchQuery = $state('');
  let showSearch = $state(false);

  let filteredScripts: Script[] = $derived(
    searchQuery.trim()
      ? scripts.filter((s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : scripts,
  );

  let scriptLookup: Map<string, Script> = $derived(
    new Map(scripts.map((s) => [s.id, s])),
  );

  $effect(() => {
    if (workflow.id !== lastWorkflowId) {
      name = workflow.name;
      nextKey = workflow.steps.length;
      steps = workflow.steps.map((s, i) => ({ ...s, key: i }));
      validationError = '';
      lastWorkflowId = workflow.id;
      searchQuery = '';
      showSearch = false;
    }
  });

  function addStep(script: Script) {
    steps = [...steps, { scriptId: script.id, scriptName: script.name, key: nextKey++ }];
    searchQuery = '';
    showSearch = false;
  }

  function removeStep(index: number) {
    steps = steps.filter((_, i) => i !== index);
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    steps = updated;
  }

  function replaceStep(index: number, script: Script) {
    steps = steps.map((s, i) =>
      i === index ? { scriptId: script.id, scriptName: script.name, key: s.key } : s,
    );
  }

  function isBroken(step: WorkflowStep): boolean {
    return !scriptLookup.has(step.scriptId);
  }

  function save() {
    if (!name.trim()) {
      validationError = 'Name is required';
      return;
    }
    if (steps.length === 0) {
      validationError = 'At least one step is required';
      return;
    }
    const brokenSteps = steps.filter(isBroken);
    if (brokenSteps.length > 0) {
      validationError = 'Fix broken steps before saving';
      return;
    }
    validationError = '';
    const plainSteps = steps.map((s) => ({ scriptId: s.scriptId, scriptName: s.scriptName }));
    onSave({ ...workflow, name: name.trim(), steps: plainSteps });
  }

  // Track which step is in "replace" mode
  let replacingIndex: number | null = $state(null);
  let replaceQuery = $state('');

  let replaceFilteredScripts: Script[] = $derived(
    replaceQuery.trim()
      ? scripts.filter((s) =>
          s.name.toLowerCase().includes(replaceQuery.toLowerCase()),
        )
      : scripts,
  );

  function startReplace(index: number) {
    replacingIndex = index;
    replaceQuery = '';
  }

  function confirmReplace(index: number, script: Script) {
    replaceStep(index, script);
    replacingIndex = null;
    replaceQuery = '';
  }

  function cancelReplace() {
    replacingIndex = null;
    replaceQuery = '';
  }
</script>

<div class="h-full flex flex-col p-6 gap-5">
  <div class="flex items-baseline gap-3">
    <div class="flex flex-col gap-1.5 flex-1">
      <label for="workflow-name" class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</label>
      <input
        id="workflow-name"
        type="text"
        bind:value={name}
        placeholder="Workflow name"
        class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
      />
    </div>
    {#if workflow.id}
      <span class="text-[10px] text-neutral-600 pt-6">v{workflow.version}</span>
    {/if}
  </div>

  <div class="flex flex-col gap-3 flex-1 min-h-0">
    <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Steps</span>

    <div class="flex-1 overflow-y-auto flex flex-col gap-1.5">
      {#each steps as step, i (step.key)}
        <div class="flex items-center gap-2 bg-neutral-800/30 border rounded-md px-3 py-2
          {isBroken(step) ? 'border-red-900/40' : 'border-neutral-700/50'}">
          <span class="text-[10px] text-neutral-600 w-4 text-right flex-shrink-0">{i + 1}</span>

          {#if replacingIndex === i}
            <div class="flex-1 flex flex-col gap-1.5">
              <input
                type="text"
                bind:value={replaceQuery}
                placeholder="Search scripts…"
                class="bg-neutral-800/50 border border-neutral-700 rounded px-2 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              />
              {#if replaceFilteredScripts.length > 0}
                <ul class="max-h-32 overflow-y-auto">
                  {#each replaceFilteredScripts as s}
                    <li>
                      <button
                        class="w-full text-left px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700/50 rounded transition-colors"
                        onclick={() => confirmReplace(i, s)}
                      >
                        {s.name}
                      </button>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="text-xs text-neutral-500 px-2">No scripts found</p>
              {/if}
              <button
                class="text-[10px] text-neutral-500 hover:text-neutral-300 self-start transition-colors"
                onclick={cancelReplace}
              >
                Cancel
              </button>
            </div>
          {:else}
            <span class="flex-1 text-sm truncate {isBroken(step) ? 'text-red-400/70' : 'text-neutral-300'}">
              {step.scriptName}
            </span>

            {#if isBroken(step)}
              <button
                class="text-[10px] px-2 py-0.5 rounded border border-red-900/40 text-red-300/70 hover:bg-red-900/20 transition-colors"
                onclick={() => startReplace(i)}
              >
                Replace
              </button>
            {/if}

            <div class="flex gap-0.5 flex-shrink-0">
              <button
                class="text-neutral-600 hover:text-neutral-300 text-xs transition-colors disabled:opacity-20 disabled:pointer-events-none"
                onclick={() => moveStep(i, -1)}
                disabled={i === 0}
                title="Move up"
              >↑</button>
              <button
                class="text-neutral-600 hover:text-neutral-300 text-xs transition-colors disabled:opacity-20 disabled:pointer-events-none"
                onclick={() => moveStep(i, 1)}
                disabled={i === steps.length - 1}
                title="Move down"
              >↓</button>
              <button
                class="text-neutral-600 hover:text-red-400/70 text-xs transition-colors ml-1"
                onclick={() => removeStep(i)}
                title="Remove step"
              >×</button>
            </div>
          {/if}
        </div>
      {/each}

      {#if steps.length === 0}
        <p class="text-xs text-neutral-600 py-4 text-center">Add a script to get started</p>
      {/if}
    </div>

    <!-- Add step search -->
    <div class="relative">
      {#if showSearch}
        <div class="flex flex-col gap-1.5 bg-neutral-800/50 border border-neutral-700 rounded-md p-2">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search scripts…"
            class="bg-transparent border-none text-xs text-white placeholder-neutral-500 focus:outline-none px-1"
          />
          {#if filteredScripts.length > 0}
            <ul class="max-h-40 overflow-y-auto">
              {#each filteredScripts as s}
                <li>
                  <button
                    class="w-full text-left px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700/50 rounded transition-colors"
                    onclick={() => addStep(s)}
                  >
                    {s.name}
                  </button>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="text-xs text-neutral-500 px-2 py-1">No scripts found</p>
          {/if}
          <button
            class="text-[10px] text-neutral-500 hover:text-neutral-300 self-start px-1 transition-colors"
            onclick={() => { showSearch = false; searchQuery = ''; }}
          >
            Cancel
          </button>
        </div>
      {:else}
        <button
          class="w-full py-1.5 border border-dashed border-neutral-700/50 rounded-md text-xs text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
          onclick={() => showSearch = true}
        >
          + Add Step
        </button>
      {/if}
    </div>
  </div>

  {#if validationError}
    <p class="text-sm text-red-400">{validationError}</p>
  {/if}

  <div class="flex justify-end gap-2">
    <button
      class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors"
      onclick={save}
    >
      Save
    </button>
    {#if workflow.id}
      <button
        class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors"
        onclick={onRun}
      >
        Run
      </button>
    {/if}
  </div>
</div>
