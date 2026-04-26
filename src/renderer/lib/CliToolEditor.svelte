<script lang="ts">
  import type { CliTool, ProcessResult } from '../../shared/models';

  let {
    tool,
    versionResult,
    versionLoading = false,
    updateResult = null,
    updateLoading = false,
    onSave,
    onCheck,
    onUpdate,
  }: {
    tool: CliTool;
    versionResult: ProcessResult | null;
    versionLoading?: boolean;
    updateResult?: ProcessResult | null;
    updateLoading?: boolean;
    onSave: (tool: CliTool) => void;
    onCheck: () => void;
    onUpdate: () => void;
  } = $props();

  let name = $state(tool.name);
  let versionCommand = $state(tool.versionCommand);
  let updateCommand = $state(tool.updateCommand);
  let validationError = $state('');
  let lastToolId = $state(tool.id);
  let updateOutputOpen = $state(false);

  $effect(() => {
    if (tool.id !== lastToolId) {
      name = tool.name;
      versionCommand = tool.versionCommand;
      updateCommand = tool.updateCommand;
      validationError = '';
      updateOutputOpen = false;
      lastToolId = tool.id;
    }
  });

  function save() {
    if (!name.trim()) {
      validationError = 'Name is required';
      return;
    }
    if (!versionCommand.trim()) {
      validationError = 'Version command is required';
      return;
    }
    if (!updateCommand.trim()) {
      validationError = 'Update command is required';
      return;
    }
    validationError = '';
    onSave({
      ...tool,
      name: name.trim(),
      versionCommand: versionCommand.trim(),
      updateCommand: updateCommand.trim(),
    });
  }

  let versionFailed = $derived(
    versionResult !== null && versionResult.exitCode !== 0,
  );

  let versionDisplay = $derived.by(() => {
    if (!versionResult) return '';
    if (versionFailed) {
      const firstLine = (versionResult.stderr || versionResult.stdout)
        .split('\n')
        .find((l) => l.trim()) ?? 'Command failed';
      return firstLine.trim();
    }
    return versionResult.stdout.trim();
  });
</script>

<div class="h-full flex flex-col p-6 gap-5 overflow-y-auto">
  <div class="flex flex-col gap-1.5">
    <label for="tool-name" class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</label>
    <input
      id="tool-name"
      type="text"
      bind:value={name}
      placeholder="e.g. node"
      class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
    />
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="tool-version-cmd" class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Version Command</label>
    <input
      id="tool-version-cmd"
      type="text"
      bind:value={versionCommand}
      placeholder="e.g. node --version"
      class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-neutral-500 transition-colors"
    />
  </div>

  <div class="flex flex-col gap-1.5">
    <label for="tool-update-cmd" class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Update Command</label>
    <input
      id="tool-update-cmd"
      type="text"
      bind:value={updateCommand}
      placeholder="e.g. brew upgrade node"
      class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-neutral-500 transition-colors"
    />
  </div>

  {#if tool.id}
    <div class="flex flex-col gap-1.5">
      <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Version</span>
      <div class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm font-mono min-h-[2.25rem] flex items-center gap-2">
        {#if versionDisplay}
          <span class="{versionFailed ? 'text-red-300/80' : 'text-neutral-200'} truncate">
            {versionDisplay}
          </span>
        {:else if !versionLoading}
          <span class="text-neutral-500">—</span>
        {/if}
        {#if versionLoading}
          <span class="text-neutral-500 text-xs ml-auto">Checking…</span>
        {/if}
      </div>
      {#if versionFailed && versionResult?.stderr && versionResult.stderr.trim() !== versionDisplay}
        <pre class="bg-neutral-800/30 border border-red-900/30 rounded-md px-3 py-2 text-xs text-red-300/70 font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">{versionResult.stderr}</pre>
      {/if}
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
    {#if tool.id}
      <button
        class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors disabled:opacity-50"
        onclick={onCheck}
        disabled={versionLoading}
      >
        Check
      </button>
      <button
        class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors disabled:opacity-50"
        onclick={onUpdate}
        disabled={updateLoading}
      >
        {updateLoading ? 'Updating…' : 'Update'}
      </button>
    {/if}
  </div>

  {#if updateResult}
    <div class="flex flex-col gap-1.5">
      <button
        class="flex items-center gap-2 text-xs font-medium text-neutral-400 uppercase tracking-wider hover:text-neutral-200 transition-colors w-fit"
        onclick={() => (updateOutputOpen = !updateOutputOpen)}
      >
        <span>{updateOutputOpen ? '▾' : '▸'}</span>
        Update output
        <span class="{updateResult.exitCode === 0 ? 'text-green-400/80' : 'text-red-400/80'} normal-case">
          {updateResult.exitCode === 0 ? 'OK' : `Exit ${updateResult.exitCode}`}
        </span>
        <span class="text-neutral-600 normal-case">{updateResult.durationMs}ms</span>
      </button>
      {#if updateOutputOpen}
        {#if updateResult.stdout}
          <pre class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">{updateResult.stdout}</pre>
        {/if}
        {#if updateResult.stderr}
          <pre class="bg-neutral-800/50 border border-red-900/30 rounded-md px-3 py-2 text-xs text-red-300/70 font-mono whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">{updateResult.stderr}</pre>
        {/if}
      {/if}
    </div>
  {/if}
</div>
