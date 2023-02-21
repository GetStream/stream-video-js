import { ComponentProps, ForwardedRef, forwardRef } from 'react';
import clsx from 'clsx';

export type ButtonWithIconProps = {
  icon: string;
  enabled?: boolean;
  variant?: string;
} & ComponentProps<'button'>;

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
        <span
          className={clsx(
            'str-video__call-controls__button--icon',
            icon && `str-video__call-controls__button--icon-${icon}`,
          )}
        ></span>
      </button>
    );
  },
);
