<script lang="ts">
  let { activePage = $bindable() }: { activePage: string } = $props();

  const navItems = [
    { id: 'scripts', label: 'Scripts', enabled: true },
    { id: 'workflows', label: 'Workflows', enabled: true },
    { id: 'cli-tools', label: 'CLI Tools', enabled: true },
    { id: 'log', label: 'Log', enabled: true },
    { id: 'settings', label: 'Settings', enabled: true },
  ];
</script>

<nav class="h-full border-r border-neutral-700/50 py-4 flex flex-col">
  <div class="px-4 pb-4">
    <h1 class="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Lapland</h1>
  </div>
  <ul class="flex flex-col gap-0.5 px-2">
    {#each navItems as item}
      <li>
        <button
          class="w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors
            {item.enabled
              ? item.id === activePage
                ? 'bg-neutral-700/60 text-white'
                : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              : 'text-neutral-600 cursor-default'}"
          onclick={() => { if (item.enabled) activePage = item.id; }}
          disabled={!item.enabled}
        >
          {item.label}
        </button>
      </li>
    {/each}
  </ul>
</nav>
