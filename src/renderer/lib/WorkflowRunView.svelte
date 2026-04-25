<script lang="ts">
  import type { Workflow, Script, ProcessResult } from '../../shared/models';
  import { extractParameters, resolveScript } from '../../shared/parsing/parameter-parser';
  import { randomUUID } from '../../shared/utils';

  let {
    workflow,
    scripts,
    onBack,
  }: {
    workflow: Workflow;
    scripts: Script[];
    onBack: () => void;
  } = $props();

  type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

  interface StepState {
    scriptName: string;
    scriptId: string;
    params: string[];
    paramValues: Record<string, string>;
    status: StepStatus;
    result: ProcessResult | null;
    expanded: boolean;
  }

  let scriptLookup: Map<string, Script> = $derived(
    new Map(scripts.map((s) => [s.id, s])),
  );

  let stepStates: StepState[] = $state(
    workflow.steps.map((step) => {
      const script = scriptLookup.get(step.scriptId);
      const params = script ? extractParameters(script.content) : [];
      return {
        scriptName: step.scriptName,
        scriptId: step.scriptId,
        params,
        paramValues: Object.fromEntries(params.map((p) => [p, ''])),
        status: 'pending' as StepStatus,
        result: null,
        expanded: false,
      };
    }),
  );

  let running = $state(false);
  let finishedRunning = $state(false);

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (running) {
      e.preventDefault();
    }
  }

  $effect(() => {
    if (running) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  async function execute() {
    running = true;
    finishedRunning = false;
    const runId = randomUUID();

    // Reset all statuses
    stepStates = stepStates.map((s) => ({ ...s, status: 'pending', result: null, expanded: false }));

    for (let i = 0; i < stepStates.length; i++) {
      const step = stepStates[i];
      const script = scriptLookup.get(step.scriptId);
      if (!script) {
        stepStates[i] = { ...step, status: 'failed' };
        // Mark remaining as skipped
        for (let j = i + 1; j < stepStates.length; j++) {
          stepStates[j] = { ...stepStates[j], status: 'skipped' };
        }
        break;
      }

      stepStates[i] = { ...step, status: 'running' };

      const resolved = resolveScript(script.content, step.paramValues);
      const res = await window.api.scripts.run(resolved);

      stepStates[i] = { ...stepStates[i], status: res.exitCode === 0 ? 'success' : 'failed', result: res };

      await window.api.log.write({
        scriptId: script.id,
        scriptName: script.name,
        resolvedScript: resolved,
        parameters: { ...step.paramValues },
        exitCode: res.exitCode,
        stdout: res.stdout,
        stderr: res.stderr,
        durationMs: res.durationMs,
        workflowRunId: runId,
        workflowName: workflow.name,
        workflowVersion: workflow.version,
      });

      if (res.exitCode !== 0) {
        // Mark remaining as skipped
        for (let j = i + 1; j < stepStates.length; j++) {
          stepStates[j] = { ...stepStates[j], status: 'skipped' };
        }
        break;
      }
    }

    running = false;
    finishedRunning = true;
  }

  function toggleExpanded(index: number) {
    stepStates[index] = { ...stepStates[index], expanded: !stepStates[index].expanded };
  }

  const statusColors: Record<StepStatus, string> = {
    pending: 'text-neutral-600',
    running: 'text-neutral-300',
    success: 'text-green-400/80',
    failed: 'text-red-400/80',
    skipped: 'text-neutral-600',
  };

  const statusLabels: Record<StepStatus, string> = {
    pending: '—',
    running: '…',
    success: '✓',
    failed: '✗',
    skipped: '○',
  };
</script>

<div class="h-full flex flex-col p-6 gap-5 overflow-y-auto">
  <div class="flex items-center gap-3">
    <button
      class="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
      onclick={onBack}
    >
      ← Back
    </button>
    <h2 class="text-sm font-medium text-neutral-200">{workflow.name}</h2>
    <span class="text-[10px] text-neutral-600">v{workflow.version}</span>
  </div>

  <div class="flex flex-col gap-4">
    {#each stepStates as step, i}
      <div class="border border-neutral-700/50 rounded-md overflow-hidden">
        <!-- Step header -->
        <div class="flex items-center gap-3 px-4 py-2.5 bg-neutral-800/30">
          <span class="text-[10px] text-neutral-600 w-4 text-right">{i + 1}</span>
          <span class="text-sm text-neutral-300 flex-1">{step.scriptName}</span>
          <span class="text-xs {statusColors[step.status]}">
            {statusLabels[step.status]}
            {#if step.status === 'running'}
              <span class="animate-pulse">running</span>
            {/if}
          </span>
          {#if step.result}
            <button
              class="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
              onclick={() => toggleExpanded(i)}
            >
              {step.expanded ? 'collapse' : 'expand'}
            </button>
          {/if}
        </div>

        <!-- Parameters (always shown before run, hidden after) -->
        {#if !finishedRunning && step.params.length > 0}
          <div class="px-4 py-3 border-t border-neutral-700/30 flex flex-col gap-2">
            {#each step.params as param}
              <div class="flex flex-col gap-1">
                <label for="step-{i}-{param}" class="text-[10px] text-neutral-500 font-mono">{param}</label>
                <input
                  id="step-{i}-{param}"
                  type="text"
                  bind:value={step.paramValues[param]}
                  placeholder={param}
                  disabled={running}
                  class="bg-neutral-800/50 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-neutral-500 transition-colors disabled:opacity-50"
                />
              </div>
            {/each}
          </div>
        {/if}

        <!-- Result details (expandable) -->
        {#if step.result && step.expanded}
          <div class="px-4 py-3 border-t border-neutral-700/30 flex flex-col gap-2">
            <div class="flex gap-4 text-[10px]">
              <span class="{step.result.exitCode === 0 ? 'text-green-400/80' : 'text-red-400/80'}">
                Exit: {step.result.exitCode}
              </span>
              <span class="text-neutral-500">{step.result.durationMs}ms</span>
            </div>
            {#if step.result.stdout}
              <pre class="bg-neutral-900/50 rounded px-2.5 py-1.5 text-[10px] text-neutral-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{step.result.stdout}</pre>
            {/if}
            {#if step.result.stderr}
              <pre class="bg-neutral-900/50 border border-red-900/20 rounded px-2.5 py-1.5 text-[10px] text-red-300/60 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{step.result.stderr}</pre>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  {#if !finishedRunning}
    <div>
      <button
        class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        onclick={execute}
        disabled={running}
      >
        {running ? 'Running…' : 'Run Workflow'}
      </button>
    </div>
  {/if}
</div>
