/**
 * 🤖 VOID TOKEN GENERATOR
 * --------------------------------------------------------------------------
 * Reads:  src/config/design-tokens.ts
 * Writes: src/styles/config/_generated-themes.scss (For SCSS/CSS)
 * Writes: src/config/void-registry.json (For Runtime Engine)
 * Writes: src/config/void-physics.json (For Svelte Transitions)
 * --------------------------------------------------------------------------
 * Usage: npm run build:tokens
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOID_TOKENS } from '../src/config/design-tokens';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATHS = {
  scss: path.resolve(__dirname, '../src/styles/config/_generated-themes.scss'),
  registryJson: path.resolve(__dirname, '../src/config/void-registry.json'),
  // NEW: Separate JSON for physics to keep types clean
  physicsJson: path.resolve(__dirname, '../src/config/void-physics.json'),
};

/**
 * Helper: Converts raw token numbers to CSS units
 */
function toCssValue(key: string, value: string | number): string {
  if (typeof value === 'string') return value;
  if (key.includes('speed')) return `${value / 1000}s`; // 300 -> 0.3s
  if (key.includes('blur') || key.includes('Width')) return `${value}px`; // 20 -> 20px
  return `${value}`;
}

function generateSCSS(tokens: typeof VOID_TOKENS) {
  const timestamp = new Date().toISOString();
  let scss = `// 🤖 AUTO-GENERATED FILE\n// GENERATED AT: ${timestamp}\n\n`;

  // 1. DENSITY
  scss += `$spacing-scale: (\n`;
  Object.entries(tokens.density.scale).forEach(([prop, val]) => {
    scss += `  '${prop}': ${val},\n`;
  });
  scss += `);\n\n`;

  // 2. PHYSICS MAPS
  scss += `$generated-physics: (\n`;
  
  // Explicitly cast config to avoid implicit 'any' error on iteration
  Object.entries(tokens.physics).forEach(([mode, rawConfig]) => {
    const config = rawConfig as Record<string, string | number>;
    
    scss += `  '${mode}': (\n`;
    Object.entries(config).forEach(([prop, val]) => {
      // Convert mapping names to SCSS variables (speedBase -> speed-base)
      const kebabProp = prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      // Convert values to CSS units
      const cssValue = toCssValue(prop, val);

      // Special handling: map specific keys to CSS var names if they differ
      // e.g. 'blur' maps to 'physics-blur' in your system
      let finalKey = kebabProp;
      if (prop === 'blur') finalKey = 'physics-blur';
      if (prop === 'borderWidth') finalKey = 'physics-border-width';

      scss += `    '${finalKey}': ${cssValue},\n`;
    });
    scss += `  ),\n`;
  });
  scss += `);\n\n`;

  // 3. THEMES
  scss += `$themes: (\n`;
  Object.entries(tokens.themes).forEach(([themeName, config]) => {
    scss += `  '${themeName}': (\n`;
    scss += `    'type': '${config.type}',\n`;
    scss += `    'physics': '${config.physics}',\n`;
    scss += `    'palette': (\n`;
    // Inject default font vars
    scss += `      'font-heading': "var(--user-font-heading, var(--font-atmos-heading))",\n`;
    scss += `      'font-body': "var(--user-font-body, var(--font-atmos-body))",\n`;
    Object.entries(config.palette).forEach(([key, value]) => {
      scss += `      '${key}': "${value}",\n`;
    });
    scss += `    ),\n`;
    scss += `  ),\n`;
  });
  scss += `);\n`;

  return scss;
}

async function main() {
  try {
    console.log('\n🔮 Void Engine: Materializing Tokens...');

    // 1. Ensure directories exist
    const scssDir = path.dirname(PATHS.scss);
    if (!fs.existsSync(scssDir)) fs.mkdirSync(scssDir, { recursive: true });

    // 2. Write SCSS
    const scssContent = generateSCSS(VOID_TOKENS);
    fs.writeFileSync(PATHS.scss, scssContent);
    console.log(
      `   └─ 🎨 Styles: src/styles/config/_generated-themes.scss`
    );

    // 3. Write Registry JSON (Themes)
    const registry: Record<string, { physics: string; mode: string }> = {};
    Object.entries(VOID_TOKENS.themes).forEach(([key, config]) => {
      registry[key] = { physics: config.physics, mode: config.type };
    });
    fs.writeFileSync(PATHS.registryJson, JSON.stringify(registry, null, 2));
    console.log(`   └─ ⚙️  Registry: src/config/void-registry.json`);

    // 4. Write Physics JSON (New!)
    fs.writeFileSync(
      PATHS.physicsJson,
      JSON.stringify(VOID_TOKENS.physics, null, 2)
    );
    console.log(`   └─ ⚡  Physics: src/config/void-physics.json`);

    console.log('✅ Token Pipeline Complete.\n');
  } catch (error) {
    console.error('❌ Token Generation Failed:', error);
    process.exit(1);
  }
}

main();