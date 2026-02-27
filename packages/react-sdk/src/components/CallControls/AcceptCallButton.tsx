import { MouseEventHandler, useCallback } from 'react';
import { IconButton } from '../Button';
import { useCall } from '@stream-io/video-react-bindings';

export type AcceptCallButtonProps = {
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onAccept?: (err?: Error) => void;
};

export const AcceptCallButton = ({
  disabled,
  onAccept,
  onClick,
}: AcceptCallButtonProps) => {
  const call = useCall();
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      if (onClick) {
        onClick(e);
      } else if (call) {
        try {
          await call.join();
          onAccept?.();
        } catch (err) {
          console.error(`Failed to accept call`, err);
          onAccept?.(err as Error);
        }
      }
    },
    [onClick, onAccept, call],
  );
  return (
    <IconButton
      disabled={disabled}
      icon="call-accept"
      variant="success"
      data-testid="accept-call-button"
      onClick={handleClick}
    />
  );
};
