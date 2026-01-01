/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type VoidPhysics = 'glass' | 'flat' | 'retro';
type VoidMode = 'light' | 'dark';
type VoidDensity = 'high' | 'standard' | 'low';

interface PhysicsPrimitive {
  blur: number; // px
  borderWidth: number; // px
  speedBase: number; // ms
  speedFast: number; // ms
  // Strings for easings (passed through as-is)
  easeStabilize: string;
  easeSnap: string;
  easeFlow: string;
}

// The shape of a theme in the registry (logic only)
interface ThemeConfig {
  physics: VoidPhysics;
  mode: VoidMode;
}

// The shape of a FULL theme definition (for injection)
interface RuntimeThemeDefinition extends ThemeConfig {
  palette: Record<string, string>;
  // NEW: Allow external themes to load custom fonts
  fonts?: Array<{
    name: string;
    url: string; // e.g. Google Fonts URL
  }>;
}

type ToastType = 'info' | 'success' | 'error' | 'warning' | 'loading';

interface ToastItem {
  id: number;
  /** * The text content.
   * ⚠️ WARNING: Renders as RAW HTML. Do not pass user input.
   */
  message: string;
  type: ToastType;
}
