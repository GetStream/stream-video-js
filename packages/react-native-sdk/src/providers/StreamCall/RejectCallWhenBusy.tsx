import { useEffect } from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { StreamVideoRN } from '../../utils';

const BUSY_TONE_DURATION_IN_MS = 3000;

/**
 * This is a renderless component to reject calls when the user is busy.
 */
export const RejectCallWhenBusy = () => {
  const client = useStreamVideoClient();

  useEffect(() => {
    if (!client) return;

    return client.on('call.rejected', async (event) => {
      const isCallCreatedByMe =
        event.call.created_by.id === client.state.connectedUser?.id;
      const isCalleeBusy = isCallCreatedByMe && event.reason === 'busy';

      if (isCalleeBusy) {
        StreamVideoRN.playBusyToneFor(BUSY_TONE_DURATION_IN_MS);
      }
    });
  }, [client]);

  return null;
};
