import { ComponentPropsWithoutRef, forwardRef } from 'react';
import clsx from 'clsx';

import { Icon } from '../Icon';

export type BadgeVariant =
  'default' | 'primary' | 'error' | 'neutral' | 'inverse';

export type BadgeSize = 'xs' | 'sm' | 'md';

export type BadgeProps = ComponentPropsWithoutRef<'span'> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
};

/**
 * A compact badge for counts, notifications and error markers.
 *
 * Without `icon` it is a pill that grows with its content; with `icon` it is a
 * circle of the size given by `size`.
 *
 * The badge carries no positioning of its own — whatever it annotates places
 * it. For the call controls that is `CompositeButton`, which anchors it to the
 * top-right of the button.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  function BadgeRender(
    { variant = 'default', size = 'sm', icon, className, children, ...rest },
    ref,
  ) {
    return (
      <span
        ref={ref}
        className={clsx(
          'str-video__badge',
          `str-video__badge--${variant}`,
          `str-video__badge--size-${size}`,
          icon && 'str-video__badge--icon',
          className,
        )}
        {...rest}
      >
        {icon ? <Icon icon={icon} /> : children}
      </span>
    );
  },
);
