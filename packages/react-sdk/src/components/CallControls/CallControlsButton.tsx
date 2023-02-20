import * as React from 'react';
import { ForwardedRef, forwardRef } from 'react';
import clsx from 'clsx';

export type CallControlsButtonProps = {
  icon:
    | 'recording-on'
    | 'recording-off'
    | 'screen-share-on'
    | 'screen-share-off'
    | 'mic'
    | 'mic-off'
    | 'camera'
    | 'camera-off'
    | 'call-end'
    | 'stats'
    | 'participants'
    | 'chat';

  enabled?: boolean;
  variant?: string;
} & React.ComponentProps<'button'>;

export const CallControlsButton = forwardRef(
  (props: CallControlsButtonProps, ref: ForwardedRef<HTMLButtonElement>) => {
    const { icon, enabled, variant, onClick, ...rest } = props;
    return (
      <button
        className={clsx('str-video__call-controls__button', {
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
