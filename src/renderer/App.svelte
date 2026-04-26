<script lang="ts">
  import Sidebar from './lib/Sidebar.svelte';
  import ScriptsPage from './pages/ScriptsPage.svelte';
  import WorkflowsPage from './pages/WorkflowsPage.svelte';
  import CliToolsPage from './pages/CliToolsPage.svelte';
  import LogPage from './pages/LogPage.svelte';
  import SettingsPage from './pages/SettingsPage.svelte';

  let ready = $state(false);
  let needsSetup = $state(false);
  let activePage = $state('scripts');

  async function init() {
    try {
      const settings = await window.api.settings.get();
      if (!settings) {
        needsSetup = true;
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
      needsSetup = true;
    }
    ready = true;
  }

  async function pickDirectory() {
    console.log('pickDirectory called');
    try {
      const dir = await window.api.settings.pickDirectory();
      console.log('picked dir:', dir);
      if (!dir) return;

      await window.api.settings.ensureDataDirectory(dir);
      await window.api.settings.save({ dataDirectory: dir });
      needsSetup = false;
    } catch (e) {
      console.error('pickDirectory error:', e);
    }
  }

  init();
</script>

{#if !ready}
  <main class="flex items-center justify-center h-screen">
    <p class="text-sm text-neutral-500">Loading…</p>
  </main>
{:else if needsSetup}
  <main class="flex flex-col items-center justify-center h-screen gap-6">
    <h1 class="text-xl font-semibold text-white">Welcome to Lapland</h1>
    <p class="text-sm text-neutral-400">Choose a folder to store your scripts and data.</p>
    <button
      class="px-4 py-1.5 bg-neutral-700 text-neutral-200 text-sm rounded-md hover:bg-neutral-600 transition-colors"
      onclick={pickDirectory}
    >
      Choose Folder
    </button>
  </main>
{:else}
  <div class="flex h-screen">
    <div class="w-[160px] flex-shrink-0">
      <Sidebar bind:activePage />
    </div>
    <main class="flex-1 min-w-0">
      {#if activePage === 'scripts'}
        <ScriptsPage />
      {:else if activePage === 'workflows'}
        <WorkflowsPage />
      {:else if activePage === 'cli-tools'}
        <CliToolsPage />
      {:else if activePage === 'log'}
        <LogPage />
      {:else if activePage === 'settings'}
        <SettingsPage />
      {/if}
    </main>
  </div>
{/if}
