/* ==========================================================================
   VOID ENERGY UI ENGINE (Robust Injection)
   DOM-First Architecture / Deterministic Hydration
   ========================================================================== */

import THEME_REGISTRY from '../config/void-registry.json';
import { VOID_TOKENS } from '../config/design-tokens';

type ErrorHandler = (error: Error) => void;

interface EngineOptions {
  onError?: ErrorHandler;
}

// Mutable Registry
type Registry = Record<string, ThemeConfig>;

const DENSITY_FACTORS = VOID_TOKENS.density.factors;

// 1. SAFEGUARD: The Fallback Palette (Source of Truth)
// We use the default 'void' theme as our safety net.
const FALLBACK_PALETTE = VOID_TOKENS.themes.void.palette;

function applyDensity(root: HTMLElement, density: VoidDensity) {
  const factor = DENSITY_FACTORS[density] ?? 1;
  root.style.setProperty('--density', factor.toString());

  // Cleanup legacy individual overrides if present
  const SPACE_KEYS = Object.keys(VOID_TOKENS.density.scale);
  SPACE_KEYS.forEach((token) => {
    root.style.removeProperty(`--space-${token}`);
  });
}

const KEYS = {
  ATMOSPHERE: 'void_atmosphere',
  USER_CONFIG: 'void_user_config',
};

export class VoidEngine {
  public atmosphere: string;
  private observers: Function[];
  private onError?: ErrorHandler;

  public userConfig: {
    fontHeading?: string | null;
    fontBody?: string | null;
    scale: number;
    density: VoidDensity;
  };

  private registry: Registry;

  constructor(options?: EngineOptions) {
    this.atmosphere = 'void';
    this.observers = [];
    this.onError = options?.onError;

    // Load the static build-time registry
    this.registry = { ...(THEME_REGISTRY as Registry) };

    this.userConfig = {
      fontHeading: null,
      fontBody: null,
      scale: 1,
      density: 'standard',
    };

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  // --- RUNTIME INJECTION (The Collaborator Feature) ---

  /**
   * Injects a new theme into the engine at runtime.
   * Uses Defensive Merging to fill in missing keys.
   */
  public injectTheme(name: string, definition: RuntimeThemeDefinition): void {
    try {
      // 1. VALIDATION GUARD (Physics Only)
      // We only check things that would crash the logic engine (like invalid physics modes).
      this.validateThemeStructure(name, definition);

      if (this.registry[name]) {
        console.warn(`Void Engine: Overwriting existing theme "${name}"`);
      }

      // 2. DEFENSIVE MERGE [Fixes Theme Payload Validation]
      // Logic: Start with the Safe Palette -> Overwrite with User Palette.
      // This ensures --bg-canvas is NEVER undefined.
      const compositePalette = {
        ...FALLBACK_PALETTE,
        ...definition.palette,
      };

      // 3. HANDLE EXTERNAL FONTS
      if (definition.fonts && definition.fonts.length > 0) {
        this.loadExternalFonts(definition.fonts);
      }

      // 4. UPDATE LOGIC REGISTRY
      this.registry[name] = {
        physics: definition.physics,
        mode: definition.mode,
      };

      // 5. GENERATE CSS VARIABLES (Using the Composite Palette)
      const cssVars = Object.entries(compositePalette)
        .map(([key, value]) => `--${key}: ${value};`)
        .join('\n');

      const cssRule = `
        [data-atmosphere='${name}'] {
          color-scheme: ${definition.mode};
          ${cssVars}
        }
      `;

      // 6. INJECT TO DOM
      if (typeof document !== 'undefined') {
        let styleTag = document.getElementById('void-dynamic-themes');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'void-dynamic-themes';
          document.head.appendChild(styleTag);
        }
        styleTag.textContent += cssRule;
      }

      // 7. NOTIFY LISTENERS
      this.notify();
    } catch (error) {
      if (this.onError && error instanceof Error) {
        this.onError(error);
      } else {
        console.error(error);
      }
    }
  }

  // --- INTERNAL UTILS ---

  private validateThemeStructure(name: string, def: RuntimeThemeDefinition) {
    // 1. Check Physics Validity
    // We MUST enforce this because SCSS mixins rely on 'glass'/'flat'/'retro' keys existing.
    if (!['glass', 'flat', 'retro'].includes(def.physics)) {
      throw new Error(`Theme "${name}" has invalid physics: ${def.physics}`);
    }

    // 2. Check Palette Existence
    if (!def.palette || typeof def.palette !== 'object') {
      throw new Error(`Theme "${name}" is missing a palette object.`);
    }

    // NOTE: We no longer check for individual keys here.
    // The defensive merge in injectTheme() handles missing keys automatically.
  }

  private loadExternalFonts(fonts: { name: string; url: string }[]) {
    if (typeof document === 'undefined') return;

    fonts.forEach((font) => {
      // Avoid duplicate loading
      if (!document.querySelector(`link[href="${font.url}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = font.url;
        document.head.appendChild(link);
      }
    });
  }

  // --- STORAGE HELPERS ---

  private safeGet(key: string): string | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeSet(key: string, value: string): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, value);
    } catch {}
  }

  // --- CORE LIFECYCLE ---

  private init(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    const domAtmosphere = root.getAttribute('data-atmosphere');
    const storedAtmosphere = this.safeGet(KEYS.ATMOSPHERE);

    // Resolve Atmosphere using the instance registry
    if (domAtmosphere && this.hasTheme(domAtmosphere)) {
      this.atmosphere = domAtmosphere;
    } else if (storedAtmosphere && this.hasTheme(storedAtmosphere)) {
      this.atmosphere = storedAtmosphere;
      this.syncAttributes();
    } else {
      this.atmosphere = 'void';
      this.syncAttributes();
    }

    const storedConfig = this.safeGet(KEYS.USER_CONFIG);
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        this.userConfig = { ...this.userConfig, ...parsed };
      } catch {}
    }

    this.render();
  }

  // --- PUBLIC API ---

  public hasTheme(name: string): boolean {
    return !!this.registry[name];
  }

  public getAvailableThemes(): string[] {
    return Object.keys(this.registry);
  }

  public setAtmosphere(name: string): void {
    if (!this.registry[name]) {
      const errorMsg = `Void Engine: Atmosphere "${name}" is not registered.`;
      if (this.onError) this.onError(new Error(errorMsg));
      console.error(`${errorMsg} Falling back to 'void'.`);
      name = 'void';
    }

    this.atmosphere = name;
    this.syncAttributes();
    this.safeSet(KEYS.ATMOSPHERE, name);
    this.notify();
  }

  public setPreferences(prefs: Partial<typeof this.userConfig>): void {
    this.userConfig = { ...this.userConfig, ...prefs };
    this.render();
    this.persist();
    this.notify();
  }

  public subscribe(callback: Function): () => void {
    this.observers.push(callback);
    callback(this);
    return () => {
      this.observers = this.observers.filter((cb) => cb !== callback);
    };
  }

  public getConfig(name?: string): ThemeConfig {
    const target = name || this.atmosphere;
    return this.registry[target] || this.registry['void'];
  }

  // --- INTERNAL ENGINE ---

  private notify(): void {
    this.observers.forEach((cb) => cb(this));
  }

  private syncAttributes(): void {
    if (typeof document === 'undefined') return;
    const config = this.registry[this.atmosphere];
    const root = document.documentElement;
    root.setAttribute('data-atmosphere', this.atmosphere);
    root.setAttribute('data-physics', config.physics);
    root.setAttribute('data-mode', config.mode);
  }

  public render(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const safeScale = Math.min(Math.max(this.userConfig.scale, 0.75), 2);
    root.style.setProperty('--text-scale', safeScale.toString());

    if (this.userConfig.fontHeading) {
      root.style.setProperty(
        '--user-font-heading',
        this.userConfig.fontHeading,
      );
    } else {
      root.style.removeProperty('--user-font-heading');
    }

    if (this.userConfig.fontBody) {
      root.style.setProperty('--user-font-body', this.userConfig.fontBody);
    } else {
      root.style.removeProperty('--user-font-body');
    }

    applyDensity(root, this.userConfig.density);
  }

  private persist(): void {
    this.safeSet(KEYS.ATMOSPHERE, this.atmosphere);
    this.safeSet(KEYS.USER_CONFIG, JSON.stringify(this.userConfig));
  }
}
