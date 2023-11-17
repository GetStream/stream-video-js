import {
  ComponentType,
  PropsWithChildren,
  useEffect,
  useState,
  ForwardedRef,
  Children,
  cloneElement,
  isValidElement,
  FC,
} from 'react';
import {
  Placement,
  Strategy,
  FloatingPortal,
  FloatingOverlay,
  UseFloatingReturn,
} from '@floating-ui/react';

import { useFloatingUIPreset } from '../../hooks';

export type ToggleMenuButtonProps<E extends HTMLElement = HTMLButtonElement> = {
  menuShown: boolean;
  ref: ForwardedRef<E>;
};

export type MenuToggleProps<E extends HTMLElement> = PropsWithChildren<{
  ToggleButton: ComponentType<ToggleMenuButtonProps<E>>;
  placement?: Placement;
  strategy?: Strategy;
  visualType: 'portal' | 'menu';
}>;

export const MenuPortal: FC<
  {
    setMenuShown: (shown: boolean) => void;
    refs: UseFloatingReturn['refs'];
  } & PropsWithChildren
> = ({ children, setMenuShown, refs }) => {
  const childrenWithProps = Children.map(children, (child: any) => {
    if (
      isValidElement(child) &&
      typeof child === 'number' &&
      typeof child === 'string'
    ) {
      return cloneElement(child, { close: () => setMenuShown(false) });
    }
    return child;
  });

  return (
    <>
      <div id="portal" className="str-video__portal"></div>
      <FloatingOverlay>
        <FloatingPortal id="portal">
          <div className="str-video__portal-content" ref={refs.setFloating}>
            {childrenWithProps}
          </div>
        </FloatingPortal>
      </FloatingOverlay>
    </>
  );
};

export const MenuToggle = <E extends HTMLElement>({
  ToggleButton,
  placement = 'top-start',
  strategy = 'absolute',
  visualType = 'menu',
  children,
}: MenuToggleProps<E>) => {
  const [menuShown, setMenuShown] = useState(false);

  const { floating, domReference, refs, x, y } = useFloatingUIPreset({
    placement,
    strategy,
  });

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
      {menuShown && visualType === 'portal' && (
        <MenuPortal refs={refs} setMenuShown={setMenuShown} />
      )}
      {menuShown && visualType === 'menu' && (
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
