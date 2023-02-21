import * as React from 'react';
import { Call } from '@stream-io/video-client';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { IconButton } from '../Button/';
import { MouseEventHandler, useCallback } from 'react';

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
        return;
      }
      if (client && call.data.call?.callCid) {
        await client?.cancelCall(call.data.call?.callCid);
        onLeave?.();
      }
    },
    [onClick, onLeave, client, call],
  );
  return <IconButton icon="call-end" variant="danger" onClick={handleClick} />;
};
