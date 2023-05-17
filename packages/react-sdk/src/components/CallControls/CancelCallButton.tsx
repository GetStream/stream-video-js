import { MouseEventHandler, useCallback } from 'react';
import { Call } from '@stream-io/video-client';
import { IconButton } from '../Button/';

export type CancelCallButtonProps = {
  call?: Call;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onLeave?: () => void;
};

export const CancelCallButton = ({
  call,
  disabled,
  onClick,
  onLeave,
}: CancelCallButtonProps) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      if (onClick) {
        onClick(e);
      } else if (call) {
        await call.leave();
        onLeave?.();
      }
    },
    [onClick, onLeave, call],
  );
  return (
    <IconButton
      disabled={disabled}
      icon="call-end"
      variant="danger"
      onClick={handleClick}
    />
  );
};
