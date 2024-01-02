import clsx from 'clsx';
import { MenuToggle, ToggleMenuButtonProps } from '../Menu';
import { ComponentType, forwardRef, JSX, PropsWithChildren } from 'react';
import { Placement } from '@floating-ui/react';

import { IconButton } from './IconButton';
import { isComponentType } from '../../utilities';

export type IconButtonWithMenuProps<E extends HTMLElement = HTMLButtonElement> =
  PropsWithChildren<{
    active?: boolean;
    Menu?: ComponentType | JSX.Element;
    caption?: string;
    className?: string;
    menuPlacement?: Placement;
    ToggleMenuButton?: ComponentType<ToggleMenuButtonProps<E>>;
    title?: string;
    variant?: 'primary' | 'secondary';
  }>;

export const CompositeButton = forwardRef<
  HTMLDivElement,
  IconButtonWithMenuProps
>(function CompositeButton(
  {
    caption,
    children,
    className,
    active,
    Menu,
    menuPlacement,
    title,
    ToggleMenuButton = DefaultToggleMenuButton,
    variant,
  },
  ref,
) {
  return (
    <div
      className={clsx('str-video__composite-button', className, {
        'str-video__composite-button--caption': caption,
      })}
      title={title}
      ref={ref}
    >
      <div
        className={clsx('str-video__composite-button__button-group', {
          'str-video__composite-button__button-group--active': active,
          'str-video__composite-button__button-group--active-primary':
            variant === 'primary' && active,
          'str-video__composite-button__button-group--active-secondary':
            variant === 'secondary' && active,
        })}
      >
        {children}
        {Menu && (
          <MenuToggle placement={menuPlacement} ToggleButton={ToggleMenuButton}>
            {isComponentType(Menu) ? <Menu /> : Menu}
          </MenuToggle>
        )}
      </div>
      {caption && (
        <div className="str-video__composite-button__caption">{caption}</div>
      )}
    </div>
  );
});

const DefaultToggleMenuButton = forwardRef<
  HTMLButtonElement,
  ToggleMenuButtonProps
>(function DefaultToggleMenuButton({ menuShown }, ref) {
  return (
    <IconButton
      className={clsx('str-video__menu-toggle-button', {
        'str-video__menu-toggle-button--active': menuShown,
      })}
      icon={menuShown ? 'caret-down' : 'caret-up'}
      ref={ref}
    />
  );
});
