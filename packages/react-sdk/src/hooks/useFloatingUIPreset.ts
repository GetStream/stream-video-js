import { useEffect } from 'react';
import type { UseFloatingOptions } from '@floating-ui/react';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';

export const useFloatingUIPreset = ({
  middleware = [],
  placement,
  strategy,
  offset: offsetInPx = 10,
}: Pick<UseFloatingOptions, 'placement' | 'strategy' | 'middleware'> & {
  offset?: number;
}) => {
  const {
    refs,
    x,
    y,
    update,
    elements: { domReference, floating },
    context,
  } = useFloating({
    placement,
    strategy,
    middleware: [
      offset(offsetInPx),
      shift(),
      flip(),
      size({
        padding: 10,
        apply: ({ availableHeight, elements }) => {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
          });
        },
      }),
      ...middleware,
    ],
  });

  // handle window resizing
  useEffect(() => {
    if (!domReference || !floating) return;

    const cleanup = autoUpdate(domReference, floating, update);

    return () => cleanup();
  }, [domReference, floating, update]);

  return { refs, x, y, domReference, floating, strategy, context };
};
