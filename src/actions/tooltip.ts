/*
 * ROLE: Tooltip action for Svelte.
 * RESPONSIBILITY: Normalizes tooltip configuration and binds Tippy.js to the Void Energy skin so overlays inherit active Physics and dialog stacking.
 */

import tippy, { type Props, type Instance } from 'tippy.js';

interface TooltipParams {
  content: string;
  placement?: Props['placement'];
}

export function tooltip(node: HTMLElement, params: string | TooltipParams) {
  // Normalize input to a consistent shape so updates remain stable.
  let config: TooltipParams =
    typeof params === 'string' ? { content: params } : params;

  const tip: Instance = tippy(node, {
    content: config.content,
    theme: 'void', // Uses the Void tooltip skin in components/_tooltips.scss
    animation: 'materialize', // Aligns with Glass Physics entry timing
    placement: config.placement || 'top',
    arrow: false, // Preserves the seamless glass edge
    offset: [0, 8], // Keeps glow separated from the trigger
    maxWidth: 250,
    interactive: false, // Avoids extra event listeners on dense UIs
    // Anchor to the nearest dialog to respect native stacking contexts.
    appendTo: () => node.closest('dialog') || document.body,
  });

  return {
    update(newParams: string | TooltipParams) {
      const newConfig =
        typeof newParams === 'string' ? { content: newParams } : newParams;

      tip.setProps({
        content: newConfig.content,
        placement: newConfig.placement || 'top',
      });
    },
    destroy() {
      tip.destroy();
    },
  };
}
