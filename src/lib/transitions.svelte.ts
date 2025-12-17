/*
 * ==========================================================================
 * 🌌 VOID PHYSICS: MOTION PRIMITIVES SYSTEM
 * ==========================================================================
 * ROLE: Bridges Svelte's transition engine with the Triad Physics.
 * * PHYSICS RULES:
 * 1. GLASS: Viscous. Uses Blur, Scale, and Cubic Easing.
 * 2. FLAT:  Aerodynamic. Uses Translate, Opacity, and Quart/Quint Easing.
 * 3. RETRO: Robotic. Uses Steps, Glitch, and Instant Snaps.
 *
 * --------------------------------------------------------------------------
 * THE LIFECYCLE OF AN ENTITY
 * --------------------------------------------------------------------------
 * In Svelte, an element has three distinct motion states. We map these to
 * our Physics vocabulary:
 *
 * 1. CREATION (in: directive) -> "Materialize"
 * - Trigger: Element is added to the DOM.
 * - Physics: Starts transparent/blurred/offset and stabilizes into reality.
 * - Usage: <div in:materialize={{ y: -20 }}>
 *
 * 2. DESTRUCTION (out: directive) -> "Singularity" / "Dematerialize" / "Implode"
 * - Trigger: Element is removed from the DOM.
 * - Physics: The element stays in the DOM while it dissolves/explodes.
 * - Usage: <div out:singularity>
 *
 * 3. SHIFTING (animate: directive) -> "Live"
 * - Trigger: The list order changes (e.g., an item is deleted).
 * - Physics: Neighbors slide smoothly to fill the gap.
 * - Critical Requirement: The {#each} block MUST be keyed by data, not index.
 * - Usage: <div animate:live>
 *
 * --------------------------------------------------------------------------
 * ⚠️ DEVELOPER WARNING: THE LIST COORDINATION PROTOCOL
 * --------------------------------------------------------------------------
 * When removing an item from a list, two things happen simultaneously:
 * A. The Victim runs 'out:singularity' (It fades out in place).
 * B. The Neighbors run 'animate:live' (They slide over the Victim).
 *
 * IF YOU FORGET THE KEY:
 * Svelte will reuse the DOM nodes. The "Victim" will be the *last* element
 * in the list visually, causing the data to "jump" before the animation plays.
 *
 * CORRECT: {#each items as item (item.id)} ... {/each}
 * WRONG:   {#each items as item, i (i)} ... {/each}
 * ==========================================================================
 */

import { flip } from 'svelte/animate';
import { cubicOut, cubicIn } from 'svelte/easing';

/* --- HELPER: Read the Physics Engine --- */
function getSystemConfig(node: Element) {
  const style = getComputedStyle(node);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. READ SEMANTIC TOKENS
  const speedVal = style.getPropertyValue('--speed-base').trim();
  const speedBase = speedVal ? parseFloat(speedVal) * 1000 : 300; // [cite: 176]

  const speedFastVal = style.getPropertyValue('--speed-fast').trim();
  const speedFast = speedFastVal ? parseFloat(speedFastVal) * 1000 : 200; // [cite: 177]

  // 2. READ PHYSICS STATE
  const blurVal = style.getPropertyValue('--physics-blur') || '0px';
  const blurInt = parseInt(blurVal) || 0; // [cite: 178]

  // 3. DETERMINE REALITY
  const physicsMode = document.documentElement.getAttribute('data-physics'); // [cite: 179]
  const isRetro = physicsMode === 'retro';
  const isFlat = physicsMode === 'flat'; // Distinct check for Flat

  return { speedBase, speedFast, blurInt, isRetro, isFlat, reducedMotion };
}

/**
 * ==========================================================================
 * 0. VOID LIST (Sorting)
 * Usage: <div animate:live>
 * ==========================================================================
 */
export function live(
  node: HTMLElement,
  { from, to }: { from: DOMRect; to: DOMRect },
  params: any = {},
) {
  const { isRetro } = getSystemConfig(node);

  // RETRO: Robotic Quantization
  const steppedEasing = (t: number) => Math.floor(t * 4) / 4; // [cite: 184]

  return flip(
    node,
    { from, to },
    {
      duration: params.duration ?? 300,
      easing: isRetro ? steppedEasing : cubicOut, // Default to Smooth Cubic for both Glass & Flat
      ...params,
    },
  );
}

/**
 * ==========================================================================
 * 1. MATERIALIZE (Entry)
 * Usage: <div in:materialize={{ y: 20 }}>
 * ==========================================================================
 */
export function materialize(
  node: HTMLElement,
  { delay = 0, duration = null, y = 15 } = {},
) {
  const { speedBase, blurInt, isRetro, isFlat, reducedMotion } =
    getSystemConfig(node);

  // A. RETRO / REDUCED (Instant)
  if (reducedMotion || isRetro) {
    return {
      delay,
      duration: isRetro ? 0 : 300,
      css: (t: number) => `opacity: ${t};`, // [cite: 190]
    };
  }

  // B. SMOOTH PHYSICS (Glass & Flat)
  // We use the same 'fluid' scale logic for both to ensure smoothness.
  // The difference is strictly in the FILTER (Blur vs No Blur).
  return {
    delay,
    duration: duration ?? speedBase, // [cite: 192]
    easing: cubicOut, // The "Smooth" Standard
    css: (t: number, u: number) => {
      // Logic: Glass gets blur. Flat gets 0px blur.
      // We calculate blur dynamically. If isFlat, blurInt is usually 0 anyway from CSS,
      // but we force it here to be safe.
      const activeBlur = isFlat ? 0 : Math.max(0, blurInt * (u * 2 - 1)); // [cite: 193]

      return `
        transform: translateY(${u * y}px) scale(${0.96 + 0.04 * t}); 
        opacity: ${t};
        filter: blur(${activeBlur}px);
      `;
    },
  };
}

/**
 * ==========================================================================
 * 2. SINGULARITY (Exit)
 * Usage: <div out:singularity>
 * ==========================================================================
 */
export function singularity(
  node: HTMLElement,
  { delay = 0, duration = null } = {},
) {
  const { speedFast, blurInt, isRetro, isFlat, reducedMotion } =
    getSystemConfig(node);

  if (reducedMotion || isRetro) {
    return { duration: 0, css: () => 'opacity: 0;' }; // [cite: 198]
  }

  // B. FLAT PHYSICS (Clean Wipe)
  // Flat exits shouldn't "Implode" (flash white), they should just recede.
  if (isFlat) {
    return {
      delay,
      duration: duration ?? speedFast,
      easing: cubicIn,
      css: (t: number, u: number) => `
        transform: scale(${0.98 + 0.02 * t}); // Subtle shrink for smoothness
        opacity: ${t};
      `,
    };
  }

  // C. GLASS PHYSICS (Implosion)
  // Keeps the "Flash" and heavy blur.
  return {
    delay,
    duration: duration ?? speedFast,
    easing: cubicIn,
    css: (t: number, u: number) => {
      const scale = 0.9 + 0.1 * t; // [cite: 200]
      const brightness = 1 + u * 2; // Flash effect [cite: 201]
      const blur = blurInt * u;

      return `
        transform: scale(${scale});
        opacity: ${t};
        filter: blur(${blur}px) brightness(${brightness});
      `;
    },
  };
}

/**
 * ==========================================================================
 * 3. GLITCH (Unchanged)
 * ==========================================================================
 */
export function glitch(node: HTMLElement, { delay = 0, duration = null } = {}) {
  const { speedFast, isRetro, reducedMotion } = getSystemConfig(node);
  if (reducedMotion) return { duration: 0, css: () => '' };

  return {
    delay,
    duration: duration ?? speedFast,
    css: (t: number) => {
      if (isRetro) {
        const clipVal = t * 100;
        return `
           clip-path: polygon(0 0, 100% 0, 100% ${clipVal}%, 0 ${clipVal}%);
           opacity: ${Math.random() > 0.5 ? 1 : 0.5};
         `; // [cite: 209]
      }
      const activeSkew = 1 - t > 0.2 ? (t * 20) % 5 : 0;
      const clipHeight = t * 100;
      return `
        clip-path: polygon(0 0, 100% 0, 100% ${clipHeight}%, 0 ${clipHeight}%);
        transform: skewX(${activeSkew}deg);
        opacity: ${t};
      `; // [cite: 212]
    },
  };
}

/**
 * ==========================================================================
 * 4. DEMATERIALIZE (Toasts / Floating Exits)
 * ==========================================================================
 */
export function dematerialize(
  node: HTMLElement,
  { delay = 0, duration = null, y = -20 } = {},
) {
  const { speedBase, blurInt, isRetro, isFlat, reducedMotion } =
    getSystemConfig(node);

  if (reducedMotion) return { duration: 0, css: () => 'opacity: 0;' };

  // A. RETRO: Data Dissolve (Unchanged)
  if (isRetro) {
    return {
      delay,
      duration: duration ?? 300,
      css: (t: number) => {
        const steppedOpacity = Math.floor(t * 4) / 4;
        const steppedScale = 0.9 + Math.floor(t * 2) * 0.05;
        return `
          opacity: ${steppedOpacity};
          transform: scale(${steppedScale});
          filter: grayscale(100%) contrast(200%);
        `;
      },
    };
  }

  // B. SMOOTH (Glass & Flat)
  return {
    delay,
    duration: duration ?? speedBase,
    easing: cubicIn, // Accelerate out
    css: (t: number, u: number) => {
      const currentBlur = isFlat ? 0 : blurInt * u;

      // FIX 1: Linear Opacity
      // We removed Math.pow(t, 0.5). Now it fades perfectly in sync with the movement.
      const opacity = t;

      // FIX 2: CSS Safety
      // We add 'transition: none' to ensure global CSS styles (like on .btn)
      // don't fight the Svelte animation frame updates.
      return `
        transition: none;
        transform: translateY(${u * y}px) scale(${1 - u * 0.05});
        opacity: ${opacity};
        filter: blur(${currentBlur}px);
      `;
    },
  };
}

// Implode remains largely the same, focusing on layout collapsing
export function implode(
  node: HTMLElement,
  { delay = 0, duration = null } = {},
) {
  const style = getComputedStyle(node);
  const width = parseFloat(style.width);
  const margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
  const padding =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const { speedFast, isRetro, reducedMotion } = getSystemConfig(node);

  if (reducedMotion) return { duration: 0, css: () => 'opacity: 0; width: 0;' };

  return {
    delay,
    duration: duration ?? speedFast,
    easing: cubicOut,
    css: (t: number, u: number) => {
      const filter = isRetro ? `grayscale(${u * 100}%)` : `blur(${u * 5}px)`;
      return `
        overflow: hidden;
        opacity: ${t};
        width: ${t * width}px;
        padding-left: ${t * padding * 0.5}px;
        padding-right: ${t * padding * 0.5}px;
        margin-left: ${t * margin * 0.5}px;
        margin-right: ${t * margin * 0.5}px;
        filter: ${filter};
        white-space: nowrap; 
      `;
    },
  };
}
