<script lang="ts">
  let {
    message,
    onConfirm,
    onCancel,
  }: {
    message: string;
    onConfirm: (dontShowAgain: boolean) => void;
    onCancel: () => void;
  } = $props();

  let dontShowAgain = $state(false);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={onCancel}>
  <div
    class="bg-neutral-800 border border-neutral-700 rounded-lg p-5 max-w-sm w-full mx-4 shadow-xl"
    onclick={(e) => e.stopPropagation()}
  >
    <p class="text-sm text-neutral-200 mb-4">{message}</p>
    <label class="flex items-center gap-2 mb-4 cursor-pointer">
      <input type="checkbox" bind:checked={dontShowAgain} class="rounded" />
      <span class="text-xs text-neutral-400">Don't show again</span>
    </label>
    <div class="flex justify-end gap-2">
      <button
        class="px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
        onclick={onCancel}
      >
        Cancel
      </button>
      <button
        class="px-3 py-1 bg-red-900/60 text-red-200 text-xs rounded-md hover:bg-red-800/60 transition-colors"
        onclick={() => onConfirm(dontShowAgain)}
      >
        Delete
      </button>
    </div>
  </div>
</div>
