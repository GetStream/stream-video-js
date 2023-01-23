import * as React from 'react';
import { ForwardedRef, forwardRef } from 'react';
import clsx from 'clsx';

export const CallControlsButton = forwardRef(
  (
    props: {
      icon: string;
      enabled?: boolean;
      variant?: string;
      onClick?: () => void;
      [anyProp: string]: any;
    },
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    const { icon, enabled, variant, onClick, ...rest } = props;
    return (
      <button
        className={clsx('str-video__call-controls__button', {
          [`str-video__call-controls__button--variant-${variant}`]: variant,
          'str-video__call-controls__button--enabled': enabled,
        })}
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
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
