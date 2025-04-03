import {
  ComponentType,
  createContext,
  PropsWithChildren,
  RefAttributes,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FloatingOverlay,
  FloatingPortal,
  Placement,
  Strategy,
  UseFloatingReturn,
} from '@floating-ui/react';

import { useFloatingUIPreset } from '../../hooks';

export type ToggleMenuButtonProps<E extends HTMLElement = HTMLButtonElement> = {
  menuShown: boolean;
} & RefAttributes<E>;

export enum MenuVisualType {
  PORTAL = 'portal',
  MENU = 'menu',
}

export type MenuToggleProps<E extends HTMLElement> = PropsWithChildren<{
  ToggleButton: ComponentType<ToggleMenuButtonProps<E>>;
  placement?: Placement;
  strategy?: Strategy;
  offset?: number;
  visualType?: MenuVisualType;
  onToggle?: (menuShown: boolean) => void;
}>;

export type MenuContextValue = {
  close?: () => void;
};

/**
 * Used to provide utility APIs to the components rendered inside the portal.
 */
const MenuContext = createContext<MenuContextValue>({});

/**
 * Access to the closes MenuContext.
 */
export const useMenuContext = (): MenuContextValue => {
  return useContext(MenuContext);
};

const MenuPortal = ({
  children,
  refs,
}: PropsWithChildren<{
  refs: UseFloatingReturn['refs'];
}>) => {
  const portalId = useMemo(
    () => `str-video-portal-${Math.random().toString(36).substring(2, 9)}`,
    [],
  );

  return (
    <>
      <div id={portalId} className="str-video__portal" />
      <FloatingOverlay>
        <FloatingPortal id={portalId}>
          <div className="str-video__portal-content" ref={refs.setFloating}>
            {children}
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
  offset,
  visualType = MenuVisualType.MENU,
  children,
  onToggle,
}: MenuToggleProps<E>) => {
  const [menuShown, setMenuShown] = useState(false);
  const toggleHandler = useRef(onToggle);
  toggleHandler.current = onToggle;

  const { floating, domReference, refs, x, y } = useFloatingUIPreset({
    placement,
    strategy,
    offset,
  });

  useEffect(() => {
    const parentDocument = domReference?.ownerDocument;

    const handleClick = (event: MouseEvent) => {
      if (!floating && domReference?.contains(event.target as Node)) {
        setMenuShown(true);
        toggleHandler.current?.(true);
      } else if (floating && !floating?.contains(event.target as Node)) {
        setMenuShown(false);
        toggleHandler.current?.(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key && // key can be undefined in some browsers
        event.key.toLowerCase() === 'escape' &&
        !event.altKey &&
        !event.ctrlKey
      ) {
        setMenuShown(false);
        toggleHandler.current?.(false);
      }
    };
    parentDocument?.addEventListener('click', handleClick, { capture: true });
    parentDocument?.addEventListener('keydown', handleKeyDown);
    return () => {
      parentDocument?.removeEventListener('click', handleClick, {
        capture: true,
      });
      parentDocument?.removeEventListener('keydown', handleKeyDown);
    };
  }, [floating, domReference]);

  return (
    <>
      {menuShown && (
        <MenuContext.Provider value={{ close: () => setMenuShown(false) }}>
          {visualType === MenuVisualType.PORTAL ? (
            <MenuPortal refs={refs} children={children} />
          ) : visualType === MenuVisualType.MENU ? (
            <div
              className="str-video__menu-container"
              ref={refs.setFloating}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
                overflowY: 'auto',
              }}
              role="menu"
              children={children}
            />
          ) : null}
        </MenuContext.Provider>
      )}
      <ToggleButton menuShown={menuShown} ref={refs.setReference} />
    </>
  );
};
