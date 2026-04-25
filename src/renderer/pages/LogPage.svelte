<script lang="ts">
  import type { ExecutionLogEntry, AuditLogEntry } from '../../shared/models';

  let activeTab: 'runs' | 'audit' = $state('runs');
  let selectedDate = $state(todayString());
  let entries: ExecutionLogEntry[] = $state([]);
  let auditEntries: AuditLogEntry[] = $state([]);
  let expandedKey: string | null = $state(null);
  let loading = $state(false);

  function todayString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // Group entries: standalone runs are their own group, workflow runs are grouped by workflowRunId
  interface RunGroup {
    key: string;
    isWorkflow: boolean;
    workflowName?: string;
    workflowVersion?: number;
    entries: ExecutionLogEntry[];
    overallSuccess: boolean;
    timestamp: string;
  }

  let groups: RunGroup[] = $derived.by(() => {
    const result: RunGroup[] = [];
    const workflowMap = new Map<string, ExecutionLogEntry[]>();

    for (const entry of entries) {
      if (entry.workflowRunId) {
        const existing = workflowMap.get(entry.workflowRunId);
        if (existing) {
          existing.push(entry);
        } else {
          workflowMap.set(entry.workflowRunId, [entry]);
        }
      } else {
        result.push({
          key: entry.timestamp + entry.scriptId,
          isWorkflow: false,
          entries: [entry],
          overallSuccess: entry.exitCode === 0,
          timestamp: entry.timestamp,
        });
      }
    }

    for (const [runId, wfEntries] of workflowMap) {
      result.push({
        key: runId,
        isWorkflow: true,
        workflowName: wfEntries[0].workflowName,
        workflowVersion: wfEntries[0].workflowVersion,
        entries: wfEntries,
        overallSuccess: wfEntries.every((e) => e.exitCode === 0),
        timestamp: wfEntries[0].timestamp,
      });
    }

    result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return result;
  });

  async function loadEntries() {
    loading = true;
    expandedKey = null;
    if (activeTab === 'runs') {
      entries = await window.api.log.getByDate(selectedDate);
    } else {
      auditEntries = await window.api.audit.getByDate(selectedDate);
      auditEntries.reverse();
    }
    loading = false;
  }

  function toggleGroup(key: string) {
    expandedKey = expandedKey === key ? null : key;
  }

  // Sub-expansion for individual entries within a workflow group
  let expandedEntryIndex: number | null = $state(null);

  function toggleEntry(index: number) {
    expandedEntryIndex = expandedEntryIndex === index ? null : index;
  }

  $effect(() => {
    selectedDate;
    activeTab;
    loadEntries();
  });

  const actionLabels: Record<string, string> = {
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
  };

  const actionColors: Record<string, string> = {
    created: 'text-green-400/80',
    updated: 'text-neutral-300',
    deleted: 'text-red-400/80',
  };
</script>

<div class="h-full flex flex-col p-6 gap-5 overflow-hidden">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button
        class="text-sm font-medium transition-colors {activeTab === 'runs' ? 'text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'}"
        onclick={() => activeTab = 'runs'}
      >
        Runs
      </button>
      <button
        class="text-sm font-medium transition-colors {activeTab === 'audit' ? 'text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'}"
        onclick={() => activeTab = 'audit'}
      >
        Audit
      </button>
    </div>
    <input
      type="date"
      bind:value={selectedDate}
      max={todayString()}
      class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-1 text-xs text-neutral-300 focus:outline-none focus:border-neutral-500 transition-colors"
    />
  </div>

  {#if loading}
    <p class="text-sm text-neutral-500">Loading…</p>
  {:else if activeTab === 'runs'}
    {#if groups.length === 0}
      <p class="text-sm text-neutral-500">No executions this day</p>
    {:else}
      <div class="flex flex-col gap-1 overflow-y-auto">
        {#each groups as group}
          <button
            class="w-full text-left px-3 py-2 rounded-md transition-colors
              {expandedKey === group.key ? 'bg-neutral-700/60' : 'hover:bg-neutral-800'}"
            onclick={() => { toggleGroup(group.key); expandedEntryIndex = null; }}
          >
            <div class="flex items-center gap-4 text-xs">
              <span class="text-neutral-500 font-mono w-[70px] flex-shrink-0">{formatTime(group.timestamp)}</span>
              {#if group.isWorkflow}
                <span class="text-neutral-200 truncate flex-1">
                  {group.workflowName}
                  <span class="text-neutral-600 ml-1">v{group.workflowVersion}</span>
                  <span class="text-neutral-600 ml-1">· {group.entries.length} steps</span>
                </span>
              {:else}
                <span class="text-neutral-200 truncate flex-1">{group.entries[0].scriptName}</span>
              {/if}
              <span class="{group.overallSuccess ? 'text-green-400/80' : 'text-red-400/80'} flex-shrink-0">
                {group.overallSuccess ? 'OK' : 'Failed'}
              </span>
              <span class="text-neutral-500 flex-shrink-0">{group.entries[0].user}</span>
            </div>
          </button>

          {#if expandedKey === group.key}
            {#if group.isWorkflow}
              <!-- Workflow: show each step as a sub-row -->
              <div class="ml-3 border-l border-neutral-700/50 flex flex-col gap-0.5 py-1">
                {#each group.entries as entry, ei}
                  <button
                    class="w-full text-left px-3 py-1.5 rounded-md transition-colors
                      {expandedEntryIndex === ei ? 'bg-neutral-800/60' : 'hover:bg-neutral-800/40'}"
                    onclick={() => toggleEntry(ei)}
                  >
                    <div class="flex items-center gap-4 text-xs">
                      <span class="text-neutral-600 w-4 text-right">{ei + 1}</span>
                      <span class="text-neutral-300 truncate flex-1">{entry.scriptName}</span>
                      <span class="{entry.exitCode === 0 ? 'text-green-400/80' : 'text-red-400/80'} flex-shrink-0">
                        {entry.exitCode === 0 ? 'OK' : `Exit ${entry.exitCode}`}
                      </span>
                      <span class="text-neutral-600 flex-shrink-0">{entry.durationMs}ms</span>
                    </div>
                  </button>

                  {#if expandedEntryIndex === ei}
                    {@render entryDetail(entry)}
                  {/if}
                {/each}
              </div>
            {:else}
              <!-- Standalone: show detail directly -->
              {@render entryDetail(group.entries[0])}
            {/if}
          {/if}
        {/each}
      </div>
    {/if}
  {:else}
    <!-- Audit tab -->
    {#if auditEntries.length === 0}
      <p class="text-sm text-neutral-500">No changes this day</p>
    {:else}
      <div class="flex flex-col gap-1 overflow-y-auto">
        {#each auditEntries as entry}
          <div class="px-3 py-2 rounded-md">
            <div class="flex items-center gap-4 text-xs">
              <span class="text-neutral-500 font-mono w-[70px] flex-shrink-0">{formatTime(entry.timestamp)}</span>
              <span class="{actionColors[entry.action]} flex-shrink-0 w-14">{actionLabels[entry.action]}</span>
              <span class="text-neutral-500 flex-shrink-0">{entry.entityType}</span>
              <span class="text-neutral-200 truncate flex-1">{entry.entityName}</span>
              {#if entry.version}
                <span class="text-neutral-600 flex-shrink-0">v{entry.version}</span>
              {/if}
              <span class="text-neutral-500 flex-shrink-0">{entry.user}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

{#snippet entryDetail(entry: ExecutionLogEntry)}
  <div class="px-3 pb-3 pt-1 ml-3 border-l border-neutral-700/50 flex flex-col gap-3">
    <div class="flex gap-4 text-xs text-neutral-500">
      <span>{entry.durationMs}ms</span>
      <span>Exit: {entry.exitCode}</span>
    </div>

    {#if Object.keys(entry.parameters).length > 0}
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Parameters</span>
        <div class="flex flex-col gap-0.5">
          {#each Object.entries(entry.parameters) as [key, value]}
            <span class="text-xs font-mono text-neutral-400">
              {key}: <span class="text-neutral-300">{value}</span>
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <div class="flex flex-col gap-1">
      <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Resolved Script</span>
      <pre class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">{entry.resolvedScript}</pre>
    </div>

    {#if entry.stdout}
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Output</span>
        <pre class="bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-xs text-neutral-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">{entry.stdout}</pre>
      </div>
    {/if}

    {#if entry.stderr}
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Errors</span>
        <pre class="bg-neutral-800/50 border border-red-900/30 rounded-md px-3 py-2 text-xs text-red-300/70 font-mono whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">{entry.stderr}</pre>
      </div>
    {/if}
  </div>
{/snippet}
