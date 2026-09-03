import clsx from 'clsx';
import { MenuToggle, ToggleMenuButtonProps } from '../Menu';
import {
  ComponentProps,
  ComponentType,
  forwardRef,
  PropsWithChildren,
  ReactElement,
} from 'react';
import { Placement } from '@floating-ui/react';

import { Button, ButtonAppearance, ButtonSize, ButtonVariant } from './Button';
import { IconButton } from './IconButton';
import { isComponentType } from '../../utilities';

export type CompositeButtonProps<E extends HTMLElement = HTMLButtonElement> =
  PropsWithChildren<{
    active?: boolean;
    Menu?: ComponentType | ReactElement | null;
    caption?: string;
    className?: string;
    menuPlacement?: Placement;
    menuOffset?: number;
    ToggleMenuButton?: ComponentType<ToggleMenuButtonProps<E>>;
    variant?: ButtonVariant;
    appearance?: ButtonAppearance;
    size?: Exclude<ButtonSize, 'xs'>;
    onMenuToggle?: (menuShown: boolean) => void;
  }> &
    ComponentProps<'button'>;

export const CompositeButton = forwardRef<HTMLDivElement, CompositeButtonProps>(
  function CompositeButtonRender(
    {
      appearance,
      caption,
      children,
      className,
      disabled,
      Menu,
      menuOffset,
      menuPlacement,
      onMenuToggle,
      active,
      size = 'md',
      title,
      ToggleMenuButton = CompositeCaret,
      variant = 'secondary',
      ...buttonProps
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        title={title}
        className={clsx(
          'str-video__composite-button',
          `str-video__composite-button--${variant}`,
          `str-video__composite-button--size-${size}`,
          Menu && 'str-video__composite-button--menu',
          className,
        )}
      >
        <div className="str-video__composite-button__group">
          <Button
            variant={variant}
            appearance={appearance}
            size={size}
            disabled={disabled}
            active={active}
            className="str-video__composite-button__action"
            {...buttonProps}
          >
            {children}
          </Button>
          {Menu &&
            (disabled ? (
              <CompositeCaret menuShown={false} disabled />
            ) : (
              <MenuToggle
                offset={menuOffset}
                placement={menuPlacement}
                ToggleButton={ToggleMenuButton}
                onToggle={onMenuToggle}
              >
                {isComponentType(Menu) ? <Menu /> : Menu}
              </MenuToggle>
            ))}
        </div>
        {caption && (
          <span className="str-video__composite-button__caption">
            {caption}
          </span>
        )}
      </div>
    );
  },
);

const CompositeCaret = forwardRef<
  HTMLButtonElement,
  { menuShown: boolean; disabled?: boolean }
>(function CompositeCaretRender({ menuShown, disabled }, ref) {
  return (
    <IconButton
      className="str-video__composite-button__caret"
      size="xs"
      appearance="ghost"
      disabled={disabled}
      aria-expanded={menuShown}
      icon={menuShown ? 'caret-down' : 'caret-up'}
      ref={ref}
    />
  );
});
