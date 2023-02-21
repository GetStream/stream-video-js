import * as React from 'react';
import {
  ComponentType,
  ForwardedRef,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import { usePopper } from 'react-popper';

export type ToggleMenuButtonProps = {
  menuShown: boolean;
  ref: ForwardedRef<HTMLButtonElement>;
};

export type MenuToggleProps = {
  ToggleButton: ComponentType<ToggleMenuButtonProps>;
  Menu: ComponentType;
};

export const MenuToggle = ({
  ToggleButton,
  Menu,
}: PropsWithChildren<MenuToggleProps>) => {
  const [menuShown, setMenuShown] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [popover, setPopover] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(anchor, popover, {
    placement: 'top-start',
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
          <Menu />
        </div>
      )}
      <ToggleButton menuShown={menuShown} ref={setAnchor} />
    </>
  );
};
