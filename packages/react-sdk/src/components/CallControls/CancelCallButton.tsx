import { MouseEventHandler, useCallback } from 'react';
import { Call } from '@stream-io/video-client';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { IconButton } from '../Button/';

export type CancelCallButtonProps = {
  call: Call;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onLeave?: () => void;
};

export const CancelCallButton = ({
  call,
  onClick,
  onLeave,
}: CancelCallButtonProps) => {
  const client = useStreamVideoClient();
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (e) => {
      if (onClick) {
        onClick(e);
      } else if (client && call) {
        await client?.cancelCall(call.id, call.type);
        onLeave?.();
      }
    },
    [onClick, onLeave, client, call],
  );
  return <IconButton icon="call-end" variant="danger" onClick={handleClick} />;
};
