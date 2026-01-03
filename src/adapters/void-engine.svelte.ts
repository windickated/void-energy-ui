/*
 * ==========================================================================
 * 🔮 FUTURE SCALING GUIDE: RUNTIME THEME INJECTION
 * ==========================================================================
 * The Void Engine supports loading external themes (JSON) at runtime without
 * rebuilding the application. This is useful for:
 * 1. Whitelabeling (Collaborators providing their own brand colors).
 * 2. Theme Builders (Live preview of colors).
 *
 * HOW TO IMPLEMENT:
 * 1. Fetch the theme JSON from your API.
 * 2. Ensure it matches the `VoidThemeDefinition` interface (see /types).
 * 3. Register it:
 * voidEngine.registerTheme('my-custom-theme', apiResponse);
 * 4. Activate it:
 * voidEngine.setAtmosphere('my-custom-theme');
 *
 * THE ENGINE WILL AUTOMATICALLY:
 * 1. Detect that 'my-custom-theme' is not in the static CSS registry.
 * 2. Convert the palette object into inline CSS variables (style="--bg-canvas: ...").
 * 3. Apply the correct Physics Mode (Glass/Flat/Retro) via data attributes.
 * ==========================================================================
 */

import THEME_REGISTRY from '../config/void-registry.json';
import { VOID_TOKENS } from '../config/design-tokens';
import { STORAGE_KEYS, DOM_ATTRS, DEFAULTS } from '../config/constants';

interface UserConfig {
  fontHeading: string | null;
  fontBody: string | null;
  scale: number;
  density: VoidDensity;
}

// --- THE REACTIVE ENGINE ---
export class VoidEngine {
  // 1. REACTIVE STATE (The Truth)
  atmosphere = $state<string>(DEFAULTS.ATMOSPHERE);

  // Runtime Registry initialized with our static build artifacts
  registry = $state<ThemeRegistry>({ ...(THEME_REGISTRY as any) });

  userConfig = $state<UserConfig>({
    fontHeading: null,
    fontBody: null,
    scale: 1,
    density: 'standard',
  });

  // Derived state for easy UI consumption
  currentTheme = $derived(
    this.registry[this.atmosphere] || this.registry[DEFAULTS.ATMOSPHERE],
  );

  constructor() {
    // Singleton Initialization
    if (typeof window !== 'undefined') {
      this.init();
      // Debug helper
      (window as any).Void = this;
    }
  }

  // --- ACTIONS ---

  // Registers a theme payload from an API source.

  /**
   * Registers a theme with "Safety Merge" logic.
   * If the incoming theme is missing keys, we fill gaps with the Default Void theme.
   */
  registerTheme(id: string, definition: Partial<VoidThemeDefinition>) {
    console.group(`Void: Registering Atmosphere "${id}"`);

    // A. THE SAFETY NET
    // We grab the "Void" theme from our static registry to use as a base.
    const baseTheme = this.registry[DEFAULTS.ATMOSPHERE];

    if (!baseTheme) {
      console.error('CRITICAL: Default Void theme missing from registry.');
      console.groupEnd();
      return;
    }

    // B. THE PARTIAL MERGE (The Fix)
    // We strictly reconstruct the object to ensure structural integrity.
    const safeTheme: VoidThemeDefinition = {
      // 1. Metadata: Fallback to base if missing
      id: id,
      mode: definition.mode || baseTheme.mode || 'dark',
      physics: definition.physics || baseTheme.physics || 'glass',

      // 2. Palette: Deep Merge (Crucial!)
      // This ensures that if they miss 'bg-canvas', we use the Void one.
      palette: {
        ...baseTheme.palette, // Lay the foundation
        ...(definition.palette || {}), // Paint the override
      },

      // 3. Fonts: Optional, so we just pass what we have
      fonts: definition.fonts || [],
    };

    // C. VALIDATION REPORT (Optional but helpful for debugging)
    const missingKeys = Object.keys(baseTheme.palette).filter(
      (key) => !definition.palette || !(key in definition.palette),
    );

    if (missingKeys.length > 0) {
      console.warn(
        `Void: Theme "${id}" incomplete. Auto-filled ${missingKeys.length} missing keys:`,
        missingKeys,
      );
    } else {
      console.log('Void: Theme definition valid.');
    }

    // D. COMMIT TO STATE
    this.registry[id] = safeTheme;

    // E. PERSIST TO CACHE (Backpack)
    if (typeof localStorage !== 'undefined') {
      try {
        const cache = JSON.parse(
          localStorage.getItem('void_theme_cache') || '{}',
        );
        cache[id] = safeTheme; // Save the SANITIZED version, not the raw input
        localStorage.setItem('void_theme_cache', JSON.stringify(cache));
      } catch (e) {
        console.warn('Void: Cache Save Failed', e);
      }
    }

    console.groupEnd();
  }

  setAtmosphere(name: string) {
    if (!this.registry[name]) {
      console.warn(`Void: Unknown atmosphere "${name}".`);
      return;
    }
    this.atmosphere = name;
    this.syncDOM();
    this.persist();
  }

  setPreferences(prefs: Partial<UserConfig>) {
    this.userConfig = { ...this.userConfig, ...prefs };
    this.syncDOM();
    this.persist();
  }

  // --- INTERNAL MECHANICS ---

  private init() {
    const root = document.documentElement;
    // 1. TRUST THE DOM (The Hydration Script has already run)
    const domAtmosphere = root.getAttribute(DOM_ATTRS.ATMOSPHERE);

    // Only verify it exists in our registry to prevent crashes
    if (domAtmosphere && this.registry[domAtmosphere]) {
      this.atmosphere = domAtmosphere;
    } else {
      this.atmosphere = DEFAULTS.ATMOSPHERE;
    }

    // 2. Load User Prefs
    const storedConfig = localStorage.getItem(STORAGE_KEYS.USER_CONFIG);
    if (storedConfig) {
      try {
        this.userConfig = { ...this.userConfig, ...JSON.parse(storedConfig) };
      } catch (e) {
        console.error('Void: Corrupt config', e);
      }
    }

    // Ensure we are synced
    this.syncDOM();
  }

  private syncDOM() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const theme = this.currentTheme;

    // 1. Attributes (The Triad)
    root.setAttribute(DOM_ATTRS.ATMOSPHERE, this.atmosphere);
    root.setAttribute(DOM_ATTRS.PHYSICS, theme.physics);
    root.setAttribute(DOM_ATTRS.MODE, theme.mode);

    // 2. Runtime Injection Logic
    // We check if this theme exists in the STATIC registry (the JSON file).
    // If it DOES NOT, it means it's a runtime theme, so we must manually paint the variables.
    const isStatic = Object.keys(THEME_REGISTRY).includes(this.atmosphere);

    if (!isStatic && theme.palette) {
      this.injectPalette(theme.palette);
    } else {
      // If we switch back to a static theme, we must CLEANUP the inline styles
      // so the CSS class variables take precedence again.
      // We can just clear the style property for the keys we know about.
      this.clearPalette(theme.palette || {});
    }

    // 3. User Overrides (Scale/Density/Fonts)
    this.applyUserOverrides(root);
  }

  private injectPalette(palette: VoidPalette) {
    const root = document.documentElement;
    Object.entries(palette).forEach(([key, value]) => {
      if (value) root.style.setProperty(`--${key}`, value);
    });
  }

  private clearPalette(palette: Partial<VoidPalette>) {
    const root = document.documentElement;
    Object.keys(palette).forEach((key) => {
      root.style.removeProperty(`--${key}`);
    });
  }

  private applyUserOverrides(root: HTMLElement) {
    const { scale, density, fontHeading, fontBody } = this.userConfig;

    // Scale
    root.style.setProperty(
      '--text-scale',
      Math.min(Math.max(scale, 0.75), 2).toString(),
    );

    // Density
    const densityMap = VOID_TOKENS.density.factors as Record<string, number>;
    root.style.setProperty('--density', (densityMap[density] || 1).toString());

    // Fonts
    if (fontHeading) root.style.setProperty('--user-font-heading', fontHeading);
    else root.style.removeProperty('--user-font-heading');

    if (fontBody) root.style.setProperty('--user-font-body', fontBody);
    else root.style.removeProperty('--user-font-body');
  }

  private persist() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ATMOSPHERE, this.atmosphere);
    localStorage.setItem(
      STORAGE_KEYS.USER_CONFIG,
      JSON.stringify(this.userConfig),
    );
  }

  // Helper for UI Lists
  get availableThemes() {
    return Object.keys(this.registry);
  }
}

// --- SINGLETON EXPORT ---
export const voidEngine = new VoidEngine();
