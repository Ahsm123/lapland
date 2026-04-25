<script lang="ts">
  import type { Script } from '../../shared/models';
  import { extractParameters } from '../../shared/parsing/parameter-parser';

  let {
    script,
    onSave,
    onRun,
  }: {
    script: Script;
    onSave: (script: Script) => void;
    onRun: () => void;
  } = $props();

  let name = $state(script.name);
  let content = $state(script.content);
  let parameters: string[] = $state(extractParameters(script.content));
  let validationError = $state('');
  let lastScriptId = $state(script.id);

  $effect(() => {
    if (script.id !== lastScriptId) {
      name = script.name;
      content = script.content;
      parameters = extractParameters(script.content);
      validationError = '';
      lastScriptId = script.id;
    }
  });

  function save() {
    if (!name.trim()) {
      validationError = 'Name is required';
      return;
    }
    if (!content.trim()) {
      validationError = 'Script content is required';
      return;
    }
    validationError = '';
    parameters = extractParameters(content);
    onSave({ ...script, name: name.trim(), content: content });
  }
</script>

<div class="h-full flex flex-col p-6 gap-5">
  <div class="flex flex-col gap-1.5">
    <label for="script-name" class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</label>
    <input
      id="script-name"
      type="text"
      bind:value={name}
      placeholder="Script name"
      class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
    />
  </div>

  <div class="flex flex-col gap-1.5 flex-1 min-h-0">
    <label for="script-content" class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Script</label>
    <textarea
      id="script-content"
      bind:value={content}
      placeholder="Enter your PowerShell script..."
      class="flex-1 bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 font-mono resize-none focus:outline-none focus:border-neutral-500 transition-colors"
    ></textarea>
  </div>

  {#if parameters.length > 0}
    <div class="flex flex-col gap-1.5">
      <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Parameters</span>
      <div class="flex flex-wrap gap-1.5">
        {#each parameters as param}
          <span class="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 font-mono">
            {param}
          </span>
        {/each}
      </div>
    </div>
  {/if}

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
    {#if script.id}
      <button
        class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors"
        onclick={onRun}
      >
        Run
      </button>
    {/if}
  </div>
</div>
