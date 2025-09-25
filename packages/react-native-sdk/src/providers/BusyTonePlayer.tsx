import { useEffect } from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { StreamVideoRN } from '../utils';
import { getLogger } from '@stream-io/video-client';

const BUSY_TONE_DURATION_IN_MS = 1500;

/**
 * This is a renderless component to play a busy tone for call rejection when the callee is busy for the user's outgoing call.
 */
const BusyTonePlayer = () => {
  const client = useStreamVideoClient();

  useEffect(() => {
    if (!client) {
      return;
    }

    const unsubscribe = client.on('call.rejected', async (event) => {
      const isCallCreatedByMe =
        event.call.created_by.id === client.state.connectedUser?.id;
      const isCalleeBusy = isCallCreatedByMe && event.reason === 'busy';

      let busyToneTimeout: ReturnType<typeof setTimeout> | undefined;

      const logger = getLogger(['RejectCallWhenBusy']);

      if (isCalleeBusy) {
        if (busyToneTimeout) {
          clearTimeout(busyToneTimeout);
          busyToneTimeout = undefined;
        }
        logger(
          'info',
          `Playing busy tone for call rejection for call cid: ${event.call.cid}`,
        );

        StreamVideoRN.playBusyTone()
          .then(() => {
            busyToneTimeout = setTimeout(() => {
              StreamVideoRN.stopBusyTone()
                .then(() => {
                  logger(
                    'info',
                    `Stopped busy tone for call rejection for call cid: ${event.call.cid}`,
                  );
                })
                .catch((error) =>
                  logger('error', 'stopBusyTone failed:', error),
                );
              busyToneTimeout = undefined;
            }, BUSY_TONE_DURATION_IN_MS);
          })
          .catch((error) => {
            logger('error', 'playBusyTone failed:', error);
          });
      }
      return () => {
        StreamVideoRN.stopBusyTone().catch((err) =>
          logger('error', 'stopBusyTone on cleanup failed:', err),
        );
        clearTimeout(busyToneTimeout);
        unsubscribe();
      };
    });
  }, [client]);

  return null;
};

export default BusyTonePlayer;
