import {
  ComponentType,
  PropsWithChildren,
  useEffect,
  useState,
  ForwardedRef,
} from 'react';
import {
  offset,
  autoUpdate,
  size,
  useFloating,
  Placement,
} from '@floating-ui/react';

export type ToggleMenuButtonProps = {
  menuShown: boolean;
  ref: ForwardedRef<HTMLButtonElement>;
};

export type MenuToggleProps = PropsWithChildren<{
  ToggleButton: ComponentType<ToggleMenuButtonProps>;
  placement?: Placement;
}>;

export const MenuToggle = ({
  ToggleButton,
  placement = 'top-start',
  children,
}: MenuToggleProps) => {
  const [menuShown, setMenuShown] = useState(false);

  const {
    refs,
    strategy,
    x,
    y,
    update,
    elements: { domReference, floating },
  } = useFloating({
    placement,
    middleware: [
      offset(10),
      size({
        padding: 10,
        apply({ availableHeight, elements }) {
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

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!floating && domReference?.contains(event.target as Node)) {
        setMenuShown(true);
      } else if (floating && !floating?.contains(event.target as Node)) {
        setMenuShown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === 'escape' &&
        !event.altKey &&
        !event.ctrlKey
      ) {
        setMenuShown(false);
      }
    };
    document?.addEventListener('click', handleClick, { capture: true });
    document?.addEventListener('keydown', handleKeyDown);
    return () => {
      document?.removeEventListener('click', handleClick, { capture: true });
      document?.removeEventListener('keydown', handleKeyDown);
    };
  }, [floating, domReference]);

  return (
    <>
      {menuShown && (
        <div
          className="str-video__menu-container"
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      )}
      <ToggleButton menuShown={menuShown} ref={refs.setReference} />
    </>
  );
};
