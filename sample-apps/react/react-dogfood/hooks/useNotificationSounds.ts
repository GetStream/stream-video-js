import { useCall } from '@stream-io/video-react-sdk';
import { useEffect } from 'react';
import { beep } from '../lib/beeper';

export function useNotificationSounds() {
  const call = useCall();

  useEffect(() => {
    if (!call) {
      return;
    }

    const usubscribers: Array<() => void> = [];
    usubscribers.push(
      call.on('call.session_participant_joined', (event) => {
        if (event.participant.user.id !== call.streamClient.userID) {
          beep('/beeps/joined.mp3');
        }
      }),
      call.on('call.session_participant_left', (event) => {
        if (event.participant.user.id !== call.streamClient.userID) {
          beep('/beeps/left.mp3');
        }
      }),
    );

    return () => usubscribers.forEach((unsubscribe) => unsubscribe());
  });
}
