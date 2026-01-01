// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    svelte(),
    react(),
    // This integration automatically loads Tailwind AND Autoprefixer.
    // It also ensures Sass compiles BEFORE Tailwind runs.
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  // You don't need the manual CSS/PostCSS block anymore.
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  },
});
