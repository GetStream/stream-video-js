import { ComponentProps, ForwardedRef, forwardRef } from 'react';
import clsx from 'clsx';

import { Icon, IconProps } from '../Icon';

export type ButtonWithIconProps = {
  enabled?: boolean;
  variant?: string;
} & ComponentProps<'button'> &
  IconProps;

export const IconButton = forwardRef(
  (props: ButtonWithIconProps, ref: ForwardedRef<HTMLButtonElement>) => {
    const { icon, enabled, variant, onClick, className, ...rest } = props;
    return (
      <button
        className={clsx('str-video__call-controls__button', className, {
          [`str-video__call-controls__button--variant-${variant}`]: variant,
          'str-video__call-controls__button--enabled': enabled,
        })}
        onClick={(e) => {
          e.preventDefault();
          onClick?.(e);
        }}
        ref={ref}
        {...rest}
      >
        <Icon icon={icon} />
      </button>
    );
  },
);
