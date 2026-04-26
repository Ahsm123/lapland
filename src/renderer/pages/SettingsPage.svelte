<script lang="ts">
  import type { AppSettings } from '../../shared/models';

  type AppInfo = Awaited<ReturnType<typeof window.api.app.getInfo>>;

  let settings: AppSettings | null = $state(null);
  let info: AppInfo | null = $state(null);
  let copied = $state(false);

  async function load() {
    settings = await window.api.settings.get();
    info = await window.api.app.getInfo();
  }

  async function changeDataDirectory() {
    const dir = await window.api.settings.pickDirectory();
    if (!dir) return;
    await window.api.settings.ensureDataDirectory(dir);
    await window.api.settings.save({ dataDirectory: dir });
    await load();
  }

  async function revealDataDir() {
    if (!settings) return;
    await window.api.shell.revealPath(settings.dataDirectory);
  }

  async function revealSettingsFile() {
    if (!info) return;
    await window.api.shell.revealPath(info.settingsPath);
  }

  async function copyDiagnostics() {
    if (!info || !settings) return;
    const lines = [
      `Lapland ${info.appVersion}`,
      `Platform: ${info.platform} (${info.arch})`,
      `Electron: ${info.electronVersion}`,
      `Node: ${info.nodeVersion}`,
      `Chrome: ${info.chromeVersion}`,
      `Data directory: ${settings.dataDirectory}`,
      `Settings file: ${info.settingsPath}`,
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  load();
</script>

<div class="h-full overflow-y-auto">
  <div class="max-w-2xl mx-auto px-8 py-8 flex flex-col gap-10">
    <header>
      <h1 class="text-lg font-semibold text-white">Settings</h1>
    </header>

    <section class="flex flex-col gap-3">
      <h2 class="text-xs uppercase tracking-wider text-neutral-400">Data</h2>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-neutral-500">Data directory</span>
        <div class="flex items-center gap-2">
          <code class="flex-1 min-w-0 text-xs text-neutral-300 bg-neutral-800/60 px-2 py-1 rounded truncate">
            {settings?.dataDirectory ?? '—'}
          </code>
          <button
            class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors"
            onclick={revealDataDir}
            disabled={!settings}
          >
            Reveal
          </button>
          <button
            class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors"
            onclick={changeDataDirectory}
          >
            Change…
          </button>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-xs uppercase tracking-wider text-neutral-400">About</h2>
      {#if info && settings}
        <dl class="grid grid-cols-[140px_1fr] gap-y-1.5 text-xs">
          <dt class="text-neutral-500">Version</dt>
          <dd class="text-neutral-300">{info.appVersion}</dd>
          <dt class="text-neutral-500">Platform</dt>
          <dd class="text-neutral-300">{info.platform} ({info.arch})</dd>
          <dt class="text-neutral-500">Electron</dt>
          <dd class="text-neutral-300">{info.electronVersion}</dd>
          <dt class="text-neutral-500">Node</dt>
          <dd class="text-neutral-300">{info.nodeVersion}</dd>
          <dt class="text-neutral-500">Settings file</dt>
          <dd class="text-neutral-300 font-mono truncate">{info.settingsPath}</dd>
        </dl>
        <div class="flex gap-2 pt-1">
          <button
            class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors"
            onclick={revealSettingsFile}
          >
            Reveal settings file
          </button>
          <button
            class="px-3 py-1 bg-neutral-700 text-neutral-200 text-xs rounded-md hover:bg-neutral-600 transition-colors"
            onclick={copyDiagnostics}
          >
            {copied ? 'Copied' : 'Copy diagnostics'}
          </button>
        </div>
      {/if}
    </section>
  </div>
</div>
