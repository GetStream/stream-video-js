import { useEffect } from 'react';
import { CallingxModule } from '@stream-io/react-native-callingx';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import { randomId } from '../modules/helpers/randomId';

/**
 * Calls back from the system call history (Android call log / iOS Recents, `callsHistory`):
 * fetches the original call and rings its members again in a new call.
 */
export const useCallBackEffect = () => {
  const client = useStreamVideoClient();

  useEffect(() => {
    if (!client) return;
    const subscription = CallingxModule.addEventListener(
      'callBackRequested',
      async ({ callId, isVideo }) => {
        console.log('callBackRequested', { callId, isVideo });
        try {
          const [callType, id] = callId.split(':');
          const original = client.call(callType, id);
          await original.get();
          const memberIds = original.state.members.map((m) => m.user_id);
          const ownId = client.state.connectedUser?.id;
          if (memberIds.filter((memberId) => memberId !== ownId).length === 0) {
            console.warn('callBackRequested: nobody to call back', callId);
            return;
          }

          await client.call(callType, randomId()).getOrCreate({
            ring: true,
            video: isVideo,
            data: { members: memberIds.map((user_id) => ({ user_id })) },
          });
        } catch (error) {
          console.warn('callBackRequested: failed to call back', error);
        }
      },
    );
    return () => subscription.remove();
  }, [client]);
};
