import * as React from 'react';
import { Call } from '@stream-io/video-client';
import { MouseEventHandler, useCallback } from 'react';
import { IconButton } from '../Button';

export type AcceptCallButtonProps = {
  call?: Call;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onAccept?: () => void;
};

export const AcceptCallButton = ({
  call,
  disabled,
  onAccept,
  onClick,
}: AcceptCallButtonProps) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      if (onClick) {
        onClick(e);
      } else if (call) {
        await call.join();
        onAccept?.();
      }
    },
    [onClick, onAccept, call],
  );
  return (
    <IconButton
      disabled={disabled}
      icon="call-accept"
      variant="success"
      onClick={handleClick}
    />
  );
};
