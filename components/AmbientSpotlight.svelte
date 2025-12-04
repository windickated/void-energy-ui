<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  // --- Configuration ---
  const SPOTLIGHT_RADIUS = 1000;
  const MOUSE_LERP = 0.05; // Speed of light movement
  const COLOR_LERP = 0.15; // Speed of color transition (Lower = Smoother/Slower)

  // --- Helpers: Color Math ---

  // 1. Convert Hex to RGB Object
  function hexToRgb(hex: string) {
    // Remove whitespace and handle potential 'rgb' strings if browser computes them that way
    // For this system, we assume strict HEX from your design system
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }; // Fallback black
  }

  // 2. Convert RGB Object back to CSS String
  function rgbToString(c: { r: number; g: number; b: number }) {
    // We use Math.round to ensure valid integer RGB values
    return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
  }

  // 3. The Math: Move 'current' towards 'target'
  function lerpColor(current: any, target: any, factor: number) {
    return {
      r: current.r + (target.r - current.r) * factor,
      g: current.g + (target.g - current.g) * factor,
      b: current.b + (target.b - current.b) * factor,
    };
  }

  // --- State ---
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let frameId: number;
  let observer: MutationObserver;

  let width = 0;
  let height = 0;
  let pointer = { x: 0, y: 0 };
  let light = { x: 0, y: 0 };

  // --- Palette State (The Magic Part) ---

  // What we want to reach (The CSS Variable value)
  let targetPalette = {
    canvas: { r: 1, g: 0, b: 32 },
    spotlight: { r: 10, g: 12, b: 43 },
  };

  // What we are actually drawing (The animated value)
  let currentPalette = {
    canvas: { r: 1, g: 0, b: 32 },
    spotlight: { r: 10, g: 12, b: 43 },
  };

  // --- 1. Dynamic Theme Fetching ---
  function updatePalette() {
    if (typeof window === "undefined") return;

    const styles = getComputedStyle(document.documentElement);

    // Get Raw Hex Strings
    const rawCanvas = styles.getPropertyValue("--bg-canvas").trim();
    // Use fallback if spotlight is missing
    const rawSpotlight =
      styles.getPropertyValue("--bg-spotlight").trim() ||
      styles.getPropertyValue("--neon-cyan").trim();

    // Parse and set TARGET only. Current will chase it in the render loop.
    if (rawCanvas) targetPalette.canvas = hexToRgb(rawCanvas);
    if (rawSpotlight) targetPalette.spotlight = hexToRgb(rawSpotlight);
  }

  // --- 2. Canvas Logic ---
  function resize() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    if (light.x === 0 && light.y === 0) {
      light.x = width / 2;
      light.y = height / 2;
      pointer.x = width / 2;
      pointer.y = height / 2;
    }
  }

  function handleMove(event: MouseEvent | TouchEvent) {
    let clientX, clientY;
    if ("touches" in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ("clientX" in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    if (typeof clientX === "number" && typeof clientY === "number") {
      pointer.x = clientX;
      pointer.y = clientY;
    }
  }

  function render() {
    if (!ctx) return;

    // STEP A: Animate Colors (Lerp current towards target)
    currentPalette.canvas = lerpColor(
      currentPalette.canvas,
      targetPalette.canvas,
      COLOR_LERP
    );
    currentPalette.spotlight = lerpColor(
      currentPalette.spotlight,
      targetPalette.spotlight,
      COLOR_LERP
    );

    // STEP B: Physics (Light Position)
    light.x += (pointer.x - light.x) * MOUSE_LERP;
    light.y += (pointer.y - light.y) * MOUSE_LERP;

    // STEP C: Draw
    // 1. Clear with Current Interpolated Color
    ctx.fillStyle = rgbToString(currentPalette.canvas);
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Spotlight
    if (Number.isFinite(light.x) && Number.isFinite(light.y)) {
      const gradient = ctx.createRadialGradient(
        light.x,
        light.y,
        0,
        light.x,
        light.y,
        SPOTLIGHT_RADIUS
      );

      gradient.addColorStop(0, rgbToString(currentPalette.spotlight));
      gradient.addColorStop(1, rgbToString(currentPalette.canvas)); // Fade to floor

      ctx.fillStyle = gradient;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillRect(0, 0, width, height);
    }

    frameId = requestAnimationFrame(render);
  }

  onMount(() => {
    ctx = canvas.getContext("2d", { alpha: false })!;

    // Initial sync so we don't fade in from black on load
    updatePalette();
    currentPalette.canvas = { ...targetPalette.canvas };
    currentPalette.spotlight = { ...targetPalette.spotlight };

    resize();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);

    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-atmosphere"
        ) {
          updatePalette();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-atmosphere"],
    });

    frameId = requestAnimationFrame(render);
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      cancelAnimationFrame(frameId);
      if (observer) observer.disconnect();
    }
  });

  // Simplified State Logic for Demo
  let atmosphere = $state("void");
  function setAtmosphere(atmosphereName: string) {
    document.documentElement.setAttribute("data-atmosphere", atmosphereName);
  }
  $effect(() => {
    setAtmosphere(atmosphere);
  });
</script>

<section class="flex-center-col">
  <div class="container flex-center-col card-glass gap-24">
    <h2>Experience the power of the Void Energy</h2>
    <p>
      Explore the depths of darkness and light, enjoying the immersive
      atmosphere.
    </p>

    <span class="flex-row flex-wrap gap-16">
      <button class="btn-system">System Button</button>
      <button>Standard Button</button>
      <button class="btn-orb">Premium Content</button>
    </span>

    <span class="flex-row flex-wrap gap-16">
      <button class="btn-signal">Signal Button</button>
      <button class="btn-alert">Alert Button</button>
    </span>

    <button class="btn-cta">Primary Action</button>
  </div>
</section>

<select bind:value={atmosphere}>
  <option>void</option>
  <option>crimson</option>
  <option>overgrowth</option>
  <option>velvet</option>
  <option>terminal</option>
  <option>paper</option>
</select>

<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -100;
    pointer-events: none;
    /* We removed background-color transition here because Canvas handles it now */
  }

  /* Just for visibility of the selector in demo */
  select {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    padding: 10px;
  }

  section {
    width: 100vw;
    height: 100vh;
  }
</style>
