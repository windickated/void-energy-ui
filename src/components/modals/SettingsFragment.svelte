<script lang="ts">
  import { modal } from '../../lib/modal-manager.svelte';

  let {
    initialMusicVolume = 50,
    initialVoiceVolume = 80,
    enableHaptics = true,
  } = $props();

  // LOCAL STATE: This lives only in this modal!
  // The global manager doesn't need to know about "musicVolume".
  let music = $state(initialMusicVolume);
  let voice = $state(initialVoiceVolume);
  let haptics = $state(enableHaptics);

  function handleSave() {
    // We return the complex object back to the caller
    modal.close({
      saved: true,
      music,
      voice,
      haptics,
    });
  }
</script>

<div class="flex flex-col gap-lg">
  <div class="text-center">
    <h2 id="modal-title">Audio & Immersion</h2>
    <p class="text-dim">Tune the void to your frequency.</p>
  </div>

  <div class="surface-sunk p-md rounded-md flex flex-col gap-md">
    <label class="flex flex-col gap-xs">
      <div class="flex justify-between">
        <span class="text-small uppercase tracking-wider">Music Volume</span>
        <span>{music}%</span>
      </div>
      <input type="range" min="0" max="100" bind:value={music} />
    </label>

    <label class="flex flex-col gap-xs">
      <div class="flex justify-between">
        <span class="text-small uppercase tracking-wider">Voice Synthesis</span>
        <span>{voice}%</span>
      </div>
      <input type="range" min="0" max="100" bind:value={voice} />
    </label>

    <hr class="border-white/10" />

    <label class="flex flex-row justify-between items-center cursor-pointer">
      <span>Haptic Feedback</span>
      <input
        type="checkbox"
        bind:checked={haptics}
        class="w-5 h-5 accent-primary"
      />
    </label>
  </div>
</div>

<div class="flex flex-row justify-end gap-md pt-sm">
  <button class="btn-void text-mute" onclick={() => modal.close(null)}>
    Cancel
  </button>
  <button class="btn-cta" onclick={handleSave}> Save Configuration </button>
</div>
