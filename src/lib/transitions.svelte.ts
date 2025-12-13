/*
 * ROLE: Svelte transition adapters for the Triad Engine.
 * RESPONSIBILITY: Translate Semantic Tokens (speed, blur, mode) into motion primitives that honor the selected Physics preset and accessibility preferences.
 */

import { cubicOut, cubicIn, quartOut } from 'svelte/easing';

/**
 * ==========================================================================
 * 🌌 VOID ENERGY UI: MOTION ENGINE (SVELTE ADAPTER)
 * ==========================================================================
 *
 * PURPOSE:
 * This library bridges the gap between Svelte's native transition engine
 * and the Void CSS Design System. Unlike standard Svelte transitions,
 * these functions are "System-Aware."
 *
 * HOW IT WORKS:
 * 1. Reads CSS Variables: It grabs `--speed-base`, `--physics-blur`, etc.,
 * directly from the DOM element.
 * 2. Theme Adaptation:
 * - In 'Void' theme: Animations use Blur + Scale (Glass Physics).
 * - In 'Retro' theme: Animations are instant or stepped (Terminal Physics).
 * 3. Accessibility: Automatically disables motion if 'prefers-reduced-motion' is true.
 *
 * USAGE GUIDE:
 * Import these functions and use them with Svelte directives (in:, out:, transition:).
 *
 * --- AVAILABLE TRANSITIONS ---
 *
 * 1. materialize (Entry)
 * - Best for: Cards, Modals, Route Transitions.
 * - Effect: Lifts up, scales in 96% -> 100%, focuses from blur.
 * - Usage: <div in:materialize={{ y: 20 }}>...</div>
 *
 * 2. dematerialize (Exit)
 * - Best for: Closing Modals, Dismissing Overlays.
 * - Effect: Floats UP like smoke, fades out, blurs heavily.
 * - Usage: <div out:dematerialize>...</div>
 *
 * 3. glitch (Entry)
 * - Best for: Hero Text, "System" Status Tags, decorative headers.
 * - Effect: Cyberpunk scanline reveal with jittery skew.
 * - Usage: <h1 in:glitch={{ delay: 200 }}>...</h1>
 *
 * 4. voidCollapse (Exit)
 * - Best for: Deleting Toasts, removing Chips/Tags.
 * - Effect: Smashes horizontally into a bright line, then vanishes.
 * - Usage: <div out:voidCollapse>...</div>
 *
 * ==========================================================================
 */

/* --- HELPER: Read the Physics Engine --- */
function getSystemConfig(node: Element) {
  const style = getComputedStyle(node);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Read semantic motion tokens directly from the node to honor live atmosphere updates.
  const speedBase =
    parseFloat(style.getPropertyValue('--speed-base')) * 1000 || 300;
  const speedFast =
    parseFloat(style.getPropertyValue('--speed-fast')) * 1000 || 200;
  const blurVal = style.getPropertyValue('--physics-blur') || '0px';
  // Preserve numeric blur for dynamic filters while retaining string form for fallbacks.
  const blurInt = parseInt(blurVal) || 0;

  return { speedBase, speedFast, blurInt, reducedMotion };
}

/* ==========================================================================
   MATERIALIZE | Entry tuned for Glass Physics.
   Rationale: Lifts content out of the void and tightens focus to signal activation.
   ========================================================================== */
export function materialize(
  node: HTMLElement,
  { delay = 0, duration = null, y = 20 } = {},
) {
  const { speedBase, blurInt, reducedMotion } = getSystemConfig(node);

  if (reducedMotion) return { duration: 0, css: () => '' };

  return {
    delay,
    duration: duration ?? speedBase, // Aligns with physics preset timing
    easing: cubicOut,
    css: (t: number, u: number) => {
      // u runs inverse to t to let blur collapse as lift completes.
      const currentBlur = blurInt * u;
      return `
                transform: translateY(${u * y}px) scale(${0.96 + 0.04 * t});
                opacity: ${t};
                filter: blur(${currentBlur}px);
            `;
    },
  };
}

/* ==========================================================================
   DEMATERIALIZE | Exit for floating surfaces.
   Rationale: Converts latent energy into blur and lift as the material disperses.
   ========================================================================== */
export function dematerialize(
  node: HTMLElement,
  { delay = 0, duration = null, y = -30 } = {},
) {
  const { speedBase, blurInt, reducedMotion } = getSystemConfig(node);

  if (reducedMotion) return { duration: 0, css: () => '' };

  return {
    delay,
    duration: duration ?? speedBase, // Mirrors entry pacing
    easing: cubicIn, // Accelerates the release
    css: (t: number, u: number) => {
      // u progresses the dispersal; blur doubles to emphasize dematerialization.
      const currentBlur = blurInt * 2 * u;
      return `
                transform: translateY(${u * y}px) scale(${1 - u * 0.05});
                opacity: ${t};
                filter: blur(${currentBlur}px);
            `;
    },
  };
}

/* ==========================================================================
   VOID GLITCH | Entry for system text and status tags.
   Rationale: Uses scanline reveal and jitter to simulate holographic acquisition.
   ========================================================================== */
export function glitch(node: HTMLElement, { delay = 0, duration = null } = {}) {
  const { speedFast, reducedMotion } = getSystemConfig(node);

  if (reducedMotion) return { duration: 0, css: () => '' };

  return {
    delay,
    duration: duration ?? speedFast, // Keeps glitch in the high-frequency band
    css: (t: number) => {
      // Alternating skew produces the transient hologram wobble.
      const skewed = (t * 100) % 2 === 0 ? 5 : -5;
      // Clip mask renders a scanline reveal from top to bottom.
      const clipped = `polygon(0 0, 100% 0, 100% ${t * 100}%, 0 ${t * 100}%)`;

      // Skew dampens near completion to finish with a stable plane.
      const activeSkew = 1 - t > 0.1 ? skewed : 0;

      return `
                clip-path: ${clipped};
                transform: skewX(${activeSkew}deg);
                opacity: ${t};
            `;
    },
  };
}

/* ==========================================================================
   VOID COLLAPSE | Exit for destructive or dismissive actions.
   Rationale: Compresses matter into a horizontal beam before shutdown.
   ========================================================================== */
export function voidCollapse(
  node: HTMLElement,
  { delay = 0, duration = null } = {},
) {
  const { speedFast, reducedMotion } = getSystemConfig(node);

  if (reducedMotion) return { duration: 0, css: () => '' };

  return {
    delay,
    duration: duration ?? speedFast, // Collapse should register as a snap
    easing: quartOut,
    css: (t: number, u: number) => {
      // t tracks opacity/scale decay; u tracks the closing flash.

      // ScaleX collapses to zero while ScaleY spikes briefly to signal release.
      const scaleY = t < 0.2 ? t * 5 : 1;

      // Brightness flash communicates energy discharge before disappearance.
      const brightness = 1 + u * 5;

      return `
                opacity: ${t};
                transform: scaleX(${t}) scaleY(${scaleY});
                filter: brightness(${brightness});
                transform-origin: center;
            `;
    },
  };
}
