import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
  UseFloatingData,
} from '@floating-ui/react';
import { useEffect } from 'react';

// FIXME OL: duplicated from useFloatingUIPreset.ts in "React SDK"
export const useFloatingUIPreset = (
  props: Pick<UseFloatingData, 'placement' | 'strategy'>,
) => {
  const {
    refs,
    x,
    y,
    update,
    elements: { domReference, floating },
  } = useFloating({
    placement: props.placement,
    strategy: props.strategy,
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
    return () => {
      cleanup();
    };
  }, [domReference, floating, update]);

  return { refs, x, y, domReference, floating, strategy: props.strategy };
};
