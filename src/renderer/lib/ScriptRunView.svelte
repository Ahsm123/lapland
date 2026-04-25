<script lang="ts">
  import type { Script, ProcessResult } from '../../shared/models';
  import { extractParameters, resolveScript } from '../../shared/parsing/parameter-parser';

  let {
    script,
    onBack,
  }: {
    script: Script;
    onBack: () => void;
  } = $props();

  let params = extractParameters(script.content);
  let paramValues: Record<string, string> = $state(
    Object.fromEntries(params.map((p) => [p, ''])),
  );
  let running = $state(false);
  let result: ProcessResult | null = $state(null);

  async function execute() {
    running = true;
    result = null;

    const resolved = resolveScript(script.content, paramValues);
    const res = await window.api.scripts.run(resolved);
    result = res;
    running = false;

    await window.api.log.write({
      scriptId: script.id,
      scriptName: script.name,
      resolvedScript: resolved,
      parameters: { ...paramValues },
      exitCode: res.exitCode,
      stdout: res.stdout,
      stderr: res.stderr,
      durationMs: res.durationMs,
    });
  }
</script>

<div class="h-full flex flex-col p-6 gap-5 overflow-y-auto">
  <div class="flex items-center gap-3">
    <button
      class="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
      onclick={onBack}
    >
      ← Back
    </button>
    <h2 class="text-sm font-medium text-neutral-200">{script.name}</h2>
  </div>

  {#if params.length > 0}
    <div class="flex flex-col gap-3">
      <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Parameters</span>
      {#each params as param}
        <div class="flex flex-col gap-1">
          <label for="param-{param}" class="text-xs text-neutral-400 font-mono">{param}</label>
          <input
            id="param-{param}"
            type="text"
            bind:value={paramValues[param]}
            placeholder={param}
            class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>
      {/each}
    </div>
  {/if}

  <div>
    <button
      class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      onclick={execute}
      disabled={running}
    >
      {running ? 'Running…' : 'Execute'}
    </button>
  </div>

  {#if result}
    <div class="flex flex-col gap-3">
      <div class="flex gap-4 text-xs">
        <span class="{result.exitCode === 0 ? 'text-green-400/80' : 'text-red-400/80'}">
          Exit: {result.exitCode}
        </span>
        <span class="text-neutral-500">
          {result.durationMs}ms
        </span>
      </div>

      {#if result.stdout}
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Output</span>
          <pre class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">{result.stdout}</pre>
        </div>
      {/if}

      {#if result.stderr}
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Errors</span>
          <pre class="bg-neutral-800/50 border border-red-900/30 rounded-md px-3 py-2 text-xs text-red-300/70 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">{result.stderr}</pre>
        </div>
      {/if}
    </div>
  {/if}
</div>
