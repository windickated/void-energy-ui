/* ==========================================================================
   VOID ENERGY UI ENGINE (Vanilla TypeScript)
   The framework-agnostic logic controller.
   ========================================================================== 

   PURPOSE:
   This class serves as the Single Source of Truth for the UI's state.
   It decouples the "Active Theme" from any specific framework (Svelte, React, etc.),
   allowing the design system to run on the metal of the browser.

   THE TRIAD ARCHITECTURE:
   In this system, users select an "Atmosphere" (e.g., 'terminal'), but the
   Engine automatically derives the Physics and Mode from that choice.
   
   Selection: "terminal"
      │
      └─> 1. Atmosphere: "terminal" (Sets Colors/Fonts via SCSS)
      └─> 2. Physics:    "retro"    (Sets Motion/Borders via Variables)
      └─> 3. Mode:       "dark"     (Sets Contrast/Inversion)

   USAGE:
   1. Initialize: The engine auto-starts in the browser and reads localStorage.
   2. Subscribe: Frameworks (Svelte stores, React hooks) subscribe to changes.
   3. Switch: Call `Void.setAtmosphere('name')` to trigger a global update.

   ========================================================================== */

export type VoidPhysics = 'glass' | 'flat' | 'retro';
export type VoidMode = 'light' | 'dark';

type ErrorHandler = (error: Error) => void;

interface EngineOptions {
  onError?: ErrorHandler;
}

interface ThemeConfig {
  physics: VoidPhysics;
  mode: VoidMode;
}

// Triad lookup mapping atmospheres to Physics and Mode semantics.
const THEME_CONFIG: Record<string, ThemeConfig> = {
  // Glass Physics defaults
  void: { physics: 'glass', mode: 'dark' },
  onyx: { physics: 'glass', mode: 'dark' },
  overgrowth: { physics: 'glass', mode: 'dark' },
  ember: { physics: 'glass', mode: 'dark' },
  glacier: { physics: 'glass', mode: 'dark' },
  nebula: { physics: 'glass', mode: 'dark' },
  crimson: { physics: 'glass', mode: 'dark' },
  velvet: { physics: 'glass', mode: 'dark' },
  solar: { physics: 'glass', mode: 'dark' },

  // Alternate physics/mode pairings
  terminal: { physics: 'retro', mode: 'dark' },
  paper: { physics: 'flat', mode: 'light' },
  laboratory: { physics: 'flat', mode: 'light' },
};

const KEYS = { ATMOSPHERE: 'void_atmosphere' };

type Listener = (atmosphere: string) => void;

export class VoidEngine {
  public atmosphere: string;
  private observers: Listener[];
  private onError?: ErrorHandler;

  constructor(options?: EngineOptions) {
    this.atmosphere = 'void';
    this.observers = [];
    this.onError = options?.onError;

    // Auto-init only in browser environments
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init(): void {
    const stored = localStorage.getItem(KEYS.ATMOSPHERE);
    if (stored && THEME_CONFIG[stored]) {
      this.setAtmosphere(stored);
    } else {
      // Set attributes even when falling back to the default atmosphere.
      this.setAtmosphere('void');
    }
  }

  // Validation helper used by adapters before attempting a switch.
  public hasTheme(name: string): boolean {
    return !!THEME_CONFIG[name];
  }

  /**
   * Routes an atmosphere selection through the Triad Engine to derive Physics and Mode,
   * update DOM attributes, and propagate notifications.
   */
  public setAtmosphere(name: string): void {
    // Guard against unknown atmospheres before mutating state.
    if (!THEME_CONFIG[name]) {
      const errorMsg = `Void Engine: Atmosphere "${name}" is not registered in THEME_CONFIG.`;

      // Surface to host application if it provided telemetry hooks.
      if (this.onError) {
        this.onError(new Error(errorMsg));
        return; // Stop execution, do not fallback silently
      }

      // Default behavior: Descriptive error + controlled fallback.
      console.error(
        `${errorMsg} Falling back to 'void'. Available themes: ${Object.keys(THEME_CONFIG).join(', ')}`,
      );
      name = 'void';
    }

    // State update
    this.atmosphere = name;
    const config = THEME_CONFIG[name];

    // DOM Updates (The Triad)
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-atmosphere', name);
      root.setAttribute('data-physics', config.physics);
      root.setAttribute('data-mode', config.mode);
    }

    // Persistence for subsequent reloads.
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEYS.ATMOSPHERE, name);
    }

    // Notify adapters
    this.notify();
  }

  /**
   * Subscribe to changes. Returns an unsubscribe function.
   * Used by adapters to synchronize UI shells on mount.
   */
  public subscribe(callback: Listener): () => void {
    this.observers.push(callback);
    // Fire immediately so components sync on mount
    callback(this.atmosphere);

    return () => {
      this.observers = this.observers.filter((cb) => cb !== callback);
    };
  }

  private notify(): void {
    this.observers.forEach((cb) => cb(this.atmosphere));
  }

  /**
   * Helper to get the full config of the current (or specific) theme
   */
  public getConfig(name?: string): ThemeConfig {
    const target = name || this.atmosphere;
    return THEME_CONFIG[target] || THEME_CONFIG['void'];
  }
}

// Global declaration for window.Void usage
declare global {
  interface Window {
    Void: VoidEngine;
  }
}

// Create global instance for plain HTML usage
if (typeof window !== 'undefined') {
  window.Void = new VoidEngine();
}
