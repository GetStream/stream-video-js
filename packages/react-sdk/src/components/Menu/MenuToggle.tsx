import {
  ComponentType,
  PropsWithChildren,
  useEffect,
  useState,
  ForwardedRef,
} from 'react';
import { usePopper } from 'react-popper';
import { Placement } from '@popperjs/core';

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
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [popover, setPopover] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(anchor, popover, {
    placement,
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  });

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!popover && anchor?.contains(event.target as Node)) {
        setMenuShown(true);
      } else if (popover && !popover?.contains(event.target as Node)) {
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
  }, [popover, anchor]);

  return (
    <>
      {menuShown && (
        <div
          className="str-video__menu-container"
          ref={setPopover}
          style={styles.popper}
          {...attributes.popper}
        >
          {children}
        </div>
      )}
      <ToggleButton menuShown={menuShown} ref={setAnchor} />
    </>
  );
};
