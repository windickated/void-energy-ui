<script lang="ts">
  import { modal } from '../../lib/modal-manager.svelte';

  let { title = 'System Alert', body } = $props();
</script>

<div class="text-center flex flex-col gap-md">
  <h2 id="modal-title">{title}</h2>
  <p>{@html body}</p>
</div>

<div class="flex flex-row justify-center pt-sm">
  <button class="btn-system" onclick={() => modal.close(true)}>
    Acknowledge
  </button>
</div>
