import { MouseEventHandler, useCallback } from 'react';
import { IconButton } from '../Button/';
import { useCall } from '@stream-io/video-react-bindings';

export type CancelCallButtonProps = {
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onLeave?: () => void;
};

export const CancelCallButton = ({
  disabled,
  onClick,
  onLeave,
}: CancelCallButtonProps) => {
  const call = useCall();
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
