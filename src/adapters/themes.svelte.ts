/*
 * ROLE: Svelte adapter for the Triad Engine.
 * RESPONSIBILITY: Synchronizes the Atmosphere state between the VoidEngine and Svelte runes while keeping direct engine access available for orchestration.
 */

import { VoidEngine } from './void-engine';

// Shared engine instance keeps DOM attributes and framework state aligned.
const engine = new VoidEngine();

export const theme = {
  // Reactive getter binds Svelte runes to the engine without duplicating state.
  get atmosphere() {
    let state = $state(engine.atmosphere);

    // Bridge engine notifications into Svelte reactivity.
    $effect.root(() => {
      return engine.subscribe((val) => {
        state = val;
      });
    });

    return state;
  },

  // Setter delegates to the engine so Triad attributes remain consistent.
  set atmosphere(value: string) {
    engine.setAtmosphere(value);
  },

  // Expose low-level engine for advanced scenarios (getConfig, manual wiring).
  raw: engine,
};
