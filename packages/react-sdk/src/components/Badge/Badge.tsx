import { ComponentPropsWithoutRef, forwardRef } from 'react';
import clsx from 'clsx';

import { Icon } from '../Icon';

export type BadgeVariant =
  'default' | 'primary' | 'error' | 'neutral' | 'inverse';

export type BadgeSize = 'xs' | 'sm' | 'md';

export type BadgeProps = ComponentPropsWithoutRef<'span'> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
};

/**
 * A compact circular badge for counts, notifications and error markers.
 *
 * The badge carries no positioning of its own — whatever it annotates places
 * it. For the call controls that is `CompositeButton`, which anchors it to the
 * top-right of the button.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  function BadgeRender(
    { variant = 'default', size = 'sm', className, children, ...rest },
    ref,
  ) {
    return (
      <span
        ref={ref}
        className={clsx(
          'str-video__badge',
          `str-video__badge--${variant}`,
          `str-video__badge--size-${size}`,
          className,
        )}
        {...rest}
      >
        {children}
      </span>
    );
  },
);

export type ErrorBadgeProps = Omit<BadgeProps, 'variant' | 'children'>;

/**
 * A `Badge` preset to the error variant, carrying the exclamation glyph.
 */
export const ErrorBadge = forwardRef<HTMLSpanElement, ErrorBadgeProps>(
  function ErrorBadgeRender({ size = 'sm', className, ...rest }, ref) {
    return (
      <Badge
        ref={ref}
        variant="error"
        size={size}
        className={clsx('str-video__badge--icon', className)}
        {...rest}
      >
        <Icon icon="exclamation-mark-fill" />
      </Badge>
    );
  },
);
