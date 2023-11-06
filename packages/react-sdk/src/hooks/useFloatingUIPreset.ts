import { useEffect } from 'react';
import type { UseFloatingData } from '@floating-ui/react';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';

export const useFloatingUIPreset = ({
  placement,
  strategy,
}: Pick<UseFloatingData, 'placement' | 'strategy'>) => {
  const {
    refs,
    x,
    y,
    update,
    elements: { domReference, floating },
  } = useFloating({
    placement,
    strategy,
    middleware: [
      offset(10),
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
    ],
  });

  // handle window resizing
  useEffect(() => {
    if (!domReference || !floating) return;

    const cleanup = autoUpdate(domReference, floating, update);

    return () => cleanup();
  }, [domReference, floating, update]);

  return { refs, x, y, domReference, floating, strategy };
};
