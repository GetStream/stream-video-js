import * as React from 'react';
import { Button } from './Button';
import { Call } from '@stream-io/video-client';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';

export type CancelCallButtonProps = {
  call: Call;
  onLeave?: () => void;
};

export const CancelCallButton = ({ call, onLeave }: CancelCallButtonProps) => {
  const client = useStreamVideoClient();
  return (
    <Button
      icon="call-end"
      variant="danger"
      onClick={async () => {
        if (client && call.data.call?.callCid) {
          await client?.cancelCall(call.data.call?.callCid);
          onLeave?.();
        }
      }}
    />
  );
};
