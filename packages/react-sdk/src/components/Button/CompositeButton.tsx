import clsx from 'clsx';
import { MenuToggle, ToggleMenuButtonProps } from '../Menu';
import { ComponentType, forwardRef, JSX, PropsWithChildren } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import { Placement } from '@floating-ui/react';

import { IconButton } from './IconButton';
import { isComponentType } from '../../utilities';

export type IconButtonWithMenuProps = PropsWithChildren<{
  active?: boolean;
  Menu?: ComponentType | JSX.Element;
  caption?: string;
  menuPlacement?: Placement;
  ToggleMenuButton?: any;
}>;

export const CompositeButton = forwardRef<
  HTMLDivElement,
  IconButtonWithMenuProps
>(
  (
    {
      caption,
      children,
      active,
      Menu,
      menuPlacement,
      ToggleMenuButton = DefaultToggleMenuButton,
    },
    ref,
  ) => {
    return (
      <div className="str-video__composite-button" ref={ref}>
        <div
          className={clsx('str-video__composite-button__button-group', {
            'str-video__composite-button__button-group--active': active,
          })}
        >
          {children}
          {Menu && (
            <MenuToggle
              placement={menuPlacement}
              ToggleButton={ToggleMenuButton}
            >
              {isComponentType(Menu) ? <Menu /> : Menu}
            </MenuToggle>
          )}
        </div>
        {caption && (
          <div className="str-video__composite-button__caption">{caption}</div>
        )}
      </div>
    );
  },
);

const DefaultToggleMenuButton = forwardRef<
  HTMLButtonElement,
  ToggleMenuButtonProps
>(({ menuShown }, ref) => {
  const { t } = useI18n();

  return (
    <IconButton
      className={clsx('str-video__menu-toggle-button', {
        'str-video__menu-toggle-button--active': menuShown,
      })}
      icon={menuShown ? 'caret-down' : 'caret-up'}
      title={t('Toggle device menu')}
      ref={ref}
    />
  );
});
